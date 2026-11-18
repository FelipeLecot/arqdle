import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { MAX_GUESSES } from '../../shared/types';
import { config } from './config';
import type { UserRow } from './db-types';
import { isValidDateKey } from './dates';
import { todayDateKey } from './daily';
import { query } from './db';
import { ApiError } from './errors';

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function numericOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeEqual(supplied: string, expected: string): boolean {
  const first = Buffer.from(supplied);
  const second = Buffer.from(expected);
  if (first.length !== second.length) return false;
  return crypto.timingSafeEqual(first, second);
}

export function isAdminUser(user: UserRow): boolean {
  return Boolean(
    user.email && config.admin.emails.includes(user.email.toLowerCase()),
  );
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const header = req.get('authorization') ?? '';
  if (config.admin.token && header.startsWith('Bearer ')) {
    if (safeEqual(header.slice(7).trim(), config.admin.token)) {
      next();
      return;
    }
  }

  if (req.user && isAdminUser(req.user)) {
    next();
    return;
  }

  if (config.admin.emails.length === 0 && !config.admin.token) {
    res.status(404).json({
      error: { code: 'not_found', message: 'API route not found.' },
    });
    return;
  }

  res.status(403).json({
    error: { code: 'not_admin', message: 'This account cannot view analytics.' },
  });
}

export interface DateRange {
  from: string;
  to: string;
}

export function parseDateRange(fromRaw: unknown, toRaw: unknown): DateRange {
  const today = todayDateKey();
  const to = typeof toRaw === 'string' && isValidDateKey(toRaw) ? toRaw : today;
  let from: string;

  if (typeof fromRaw === 'string' && isValidDateKey(fromRaw)) {
    from = fromRaw;
  } else {
    const end = new Date(`${to}T12:00:00Z`);
    end.setUTCDate(end.getUTCDate() - 29);
    from = end.toISOString().slice(0, 10);
  }

  if (from > to) {
    throw new ApiError(400, 'invalid_range', 'The start date must be before the end date.');
  }
  const days = Math.round(
    (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000,
  );
  if (days > 366) {
    throw new ApiError(400, 'invalid_range', 'The date range cannot exceed 366 days.');
  }
  return { from, to };
}

export interface DailyAnalyticsRow {
  date: string;
  dayNumber: number;
  targetId: string;
  targetName: string;
  players: number;
  wins: number;
  losses: number;
  winRate: number;
  firstTryWins: number;
  avgAttempts: number | null;
  distribution: number[];
}

export interface GuessAnalyticsRow {
  buildingId: string;
  buildingName: string;
  guesses: number;
  correct: number;
  wrong: number;
}

export interface Analytics {
  range: DateRange;
  totals: {
    guestUsers: number;
    googleUsers: number;
    totalUsers: number;
    newUsers: number;
    dailyPlayers: number;
    completedDailyGames: number;
    wins: number;
    losses: number;
    winRate: number;
    avgAttempts: number | null;
    firstTryWins: number;
    practiceGames: number;
    guesses: number;
  };
  days: DailyAnalyticsRow[];
  attempts: Array<{ attempts: number; count: number }>;
  topGuesses: GuessAnalyticsRow[];
  topWrongGuesses: GuessAnalyticsRow[];
  signupsByDay: Array<{ date: string; count: number }>;
}

interface DayQueryRow {
  puzzle_date: string;
  day_number: number;
  target_building_id: string;
  target_name: string | null;
  players: string;
  wins: string;
  losses: string;
  first_try_wins: string;
  avg_attempts: string | null;
}

interface GuessQueryRow {
  building_id: string;
  building_name: string;
  guesses: string;
  correct: string;
  wrong: string;
}

export async function getAnalytics(range: DateRange): Promise<Analytics> {
  const [totals, days, attemptRows, attemptDistribution, topGuesses, topWrong, signups] =
    await Promise.all([
      query<{
        guest_users: string;
        google_users: string;
        new_users: string;
        daily_players: string;
        completed_daily_games: string;
        wins: string;
        losses: string;
        avg_attempts: string | null;
        first_try_wins: string;
        practice_games: string;
        guesses: string;
      }>(
        `SELECT
           (SELECT count(*) FROM users WHERE kind = 'guest') AS guest_users,
           (SELECT count(*) FROM users WHERE kind = 'google') AS google_users,
           (SELECT count(*) FROM users
             WHERE created_at >= $1::date
               AND created_at < ($2::date + interval '1 day')) AS new_users,
           (SELECT count(DISTINCT user_id) FROM daily_results
             WHERE puzzle_date BETWEEN $1::date AND $2::date) AS daily_players,
           (SELECT count(*) FROM daily_results
             WHERE puzzle_date BETWEEN $1::date AND $2::date) AS completed_daily_games,
           (SELECT count(*) FROM daily_results
             WHERE puzzle_date BETWEEN $1::date AND $2::date AND status = 'won') AS wins,
           (SELECT count(*) FROM daily_results
             WHERE puzzle_date BETWEEN $1::date AND $2::date AND status = 'lost') AS losses,
           (SELECT avg(attempts) FROM daily_results
             WHERE puzzle_date BETWEEN $1::date AND $2::date) AS avg_attempts,
           (SELECT count(*) FROM daily_results
             WHERE puzzle_date BETWEEN $1::date AND $2::date
               AND status = 'won' AND attempts = 1) AS first_try_wins,
           (SELECT count(*) FROM games
             WHERE mode = 'practice'
               AND created_at >= $1::date
               AND created_at < ($2::date + interval '1 day')) AS practice_games,
           (SELECT count(*) FROM guesses
             WHERE created_at >= $1::date
               AND created_at < ($2::date + interval '1 day')) AS guesses`,
        [range.from, range.to],
      ),
      query<DayQueryRow>(
        `SELECT p.puzzle_date,
                p.day_number,
                p.target_building_id,
                p.target_snapshot->>'name' AS target_name,
                count(r.user_id) AS players,
                count(*) FILTER (WHERE r.status = 'won') AS wins,
                count(*) FILTER (WHERE r.status = 'lost') AS losses,
                count(*) FILTER (WHERE r.status = 'won' AND r.attempts = 1) AS first_try_wins,
                avg(r.attempts) AS avg_attempts
           FROM daily_puzzles p
           LEFT JOIN daily_results r ON r.puzzle_date = p.puzzle_date
          WHERE p.puzzle_date BETWEEN $1::date AND $2::date
          GROUP BY p.puzzle_date, p.day_number, p.target_building_id,
                   p.target_snapshot->>'name'
          ORDER BY p.puzzle_date DESC`,
        [range.from, range.to],
      ),
      query<{ attempts: number; count: string }>(
        `SELECT attempts, count(*) AS count
           FROM daily_results
          WHERE status = 'won'
            AND puzzle_date BETWEEN $1::date AND $2::date
          GROUP BY attempts
          ORDER BY attempts`,
        [range.from, range.to],
      ),
      query<{ puzzle_date: string; attempts: number; count: string }>(
        `SELECT puzzle_date, attempts, count(*) AS count
           FROM daily_results
          WHERE status = 'won'
            AND puzzle_date BETWEEN $1::date AND $2::date
          GROUP BY puzzle_date, attempts
          ORDER BY puzzle_date, attempts`,
        [range.from, range.to],
      ),
      query<GuessQueryRow>(
        `SELECT building_id,
                building_name,
                count(*) AS guesses,
                count(*) FILTER (WHERE correct) AS correct,
                count(*) FILTER (WHERE NOT correct) AS wrong
           FROM guesses
          WHERE created_at >= $1::date
            AND created_at < ($2::date + interval '1 day')
          GROUP BY building_id, building_name
          ORDER BY guesses DESC, building_name ASC
          LIMIT 100`,
        [range.from, range.to],
      ),
      query<GuessQueryRow>(
        `SELECT building_id,
                building_name,
                count(*) AS guesses,
                count(*) FILTER (WHERE correct) AS correct,
                count(*) FILTER (WHERE NOT correct) AS wrong
           FROM guesses
          WHERE created_at >= $1::date
            AND created_at < ($2::date + interval '1 day')
            AND NOT correct
          GROUP BY building_id, building_name
          ORDER BY guesses DESC, building_name ASC
          LIMIT 100`,
        [range.from, range.to],
      ),
      query<{ date: string; count: string }>(
        `SELECT created_at::date AS date, count(*) AS count
           FROM users
          WHERE created_at >= $1::date
            AND created_at < ($2::date + interval '1 day')
          GROUP BY created_at::date
          ORDER BY created_at::date`,
        [range.from, range.to],
      ),
    ]);

  const distributionByDate = new Map<string, number[]>();
  for (const row of attemptDistribution.rows) {
    const distribution =
      distributionByDate.get(row.puzzle_date) ??
      Array.from({ length: MAX_GUESSES }, () => 0);
    distribution[Math.min(Math.max(row.attempts - 1, 0), MAX_GUESSES - 1)] += num(
      row.count,
    );
    distributionByDate.set(row.puzzle_date, distribution);
  }

  const dayRows: DailyAnalyticsRow[] = days.rows.map((row) => {
    const players = num(row.players);
    const wins = num(row.wins);
    const losses = num(row.losses);
    return {
      date: row.puzzle_date,
      dayNumber: row.day_number,
      targetId: row.target_building_id,
      targetName: row.target_name ?? row.target_building_id,
      players,
      wins,
      losses,
      winRate: players === 0 ? 0 : wins / players,
      firstTryWins: num(row.first_try_wins),
      avgAttempts: numericOrNull(row.avg_attempts),
      distribution:
        distributionByDate.get(row.puzzle_date) ??
        Array.from({ length: MAX_GUESSES }, () => 0),
    };
  });

  const totalRow = totals.rows[0];
  const guestUsers = num(totalRow?.guest_users);
  const googleUsers = num(totalRow?.google_users);
  const completedDailyGames = num(totalRow?.completed_daily_games);
  const wins = num(totalRow?.wins);

  const guessRows = (rows: GuessQueryRow[]): GuessAnalyticsRow[] =>
    rows.map((row) => ({
      buildingId: row.building_id,
      buildingName: row.building_name,
      guesses: num(row.guesses),
      correct: num(row.correct),
      wrong: num(row.wrong),
    }));

  return {
    range,
    totals: {
      guestUsers,
      googleUsers,
      totalUsers: guestUsers + googleUsers,
      newUsers: num(totalRow?.new_users),
      dailyPlayers: num(totalRow?.daily_players),
      completedDailyGames,
      wins,
      losses: num(totalRow?.losses),
      winRate: completedDailyGames === 0 ? 0 : wins / completedDailyGames,
      avgAttempts: numericOrNull(totalRow?.avg_attempts),
      firstTryWins: num(totalRow?.first_try_wins),
      practiceGames: num(totalRow?.practice_games),
      guesses: num(totalRow?.guesses),
    },
    days: dayRows,
    attempts: attemptRows.rows.map((row) => ({
      attempts: row.attempts,
      count: num(row.count),
    })),
    topGuesses: guessRows(topGuesses.rows),
    topWrongGuesses: guessRows(topWrong.rows),
    signupsByDay: signups.rows.map((row) => ({
      date: row.date,
      count: num(row.count),
    })),
  };
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows]
    .map((row) => row.map((value) => csvCell(value)).join(','))
    .join('\n')
    .concat('\n');
}

export function dailyCsv(analytics: Analytics): string {
  return toCsv(
    [
      'date',
      'day_number',
      'target_id',
      'target_name',
      'players',
      'wins',
      'losses',
      'win_rate',
      'first_try_wins',
      'avg_attempts',
      ...Array.from({ length: MAX_GUESSES }, (_, index) => `attempt_${index + 1}_wins`),
    ],
    analytics.days.map((day) => [
      day.date,
      day.dayNumber,
      day.targetId,
      day.targetName,
      day.players,
      day.wins,
      day.losses,
      day.winRate,
      day.firstTryWins,
      day.avgAttempts,
      ...day.distribution,
    ]),
  );
}

export function guessesCsv(analytics: Analytics): string {
  return toCsv(
    ['building_id', 'building_name', 'guesses', 'correct', 'wrong'],
    analytics.topGuesses.map((row) => [
      row.buildingId,
      row.buildingName,
      row.guesses,
      row.correct,
      row.wrong,
    ]),
  );
}

export function attemptsCsv(analytics: Analytics): string {
  const rows: unknown[][] = [];
  for (const day of analytics.days) {
    day.distribution.forEach((count, index) => {
      rows.push([day.date, day.dayNumber, index + 1, count]);
    });
  }
  return toCsv(['date', 'day_number', 'attempts', 'wins'], rows);
}
