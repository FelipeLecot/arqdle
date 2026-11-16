import crypto from 'node:crypto';
import type { LegacyImportRequest, Me, Stats } from '../../shared/types';
import { compareBuilding } from './compare';
import { config } from './config';
import type { DailyResultRow, GameRow, GuessRow, OAuthAccountRow, UserRow } from './db-types';
import { getBuilding } from './data';
import { todayDateKey } from './daily';
import { isValidDateKey } from './dates';
import { query, withTransaction } from './db';
import { ApiError } from './errors';
import { ensureDailyGame, ensureDailyPuzzle } from './puzzles';
import { parseBuildingSnapshot } from './snapshot';
import { computeStats, isLegacyStats } from './stats';

export async function getUserById(id: string): Promise<UserRow | null> {
  const result = await query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function getStatsForUser(user: UserRow): Promise<Stats> {
  const results = await query<DailyResultRow>(
    `SELECT user_id, puzzle_date, day_number, status, attempts, target_building_id, completed_at
       FROM daily_results
      WHERE user_id = $1
      ORDER BY day_number ASC`,
    [user.id],
  );
  const legacy = isLegacyStats(user.legacy_stats) ? user.legacy_stats : null;
  return computeStats(results.rows, legacy);
}

export async function buildMe(user: UserRow): Promise<Me> {
  const stats = await getStatsForUser(user);
  return {
    profile: {
      id: user.id,
      kind: user.kind,
      name: user.name,
      email: user.email,
      pictureUrl: user.picture_url,
      createdAt: user.created_at.toISOString(),
      stats,
    },
    auth: {
      googleEnabled: config.google.enabled,
      signInUrl: '/api/auth/google/start',
    },
    canImportLegacy: user.legacy_imported_at === null,
  };
}

interface ParsedLegacyImport {
  stats: Stats | null;
  daily: { date: string; guessIds: string[] } | null;
}

function parseLegacyImport(payload: unknown): ParsedLegacyImport {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApiError(400, 'invalid_import', 'The import payload is not valid.');
  }
  const body = payload as LegacyImportRequest;
  let stats: Stats | null = null;

  if (body.stats !== undefined && body.stats !== null) {
    if (!isLegacyStats(body.stats)) {
      throw new ApiError(400, 'invalid_import', 'The saved stats are not valid.');
    }
    stats = {
      played: Math.max(0, Math.trunc(body.stats.played)),
      wins: Math.max(0, Math.min(Math.trunc(body.stats.wins), Math.trunc(body.stats.played))),
      currentStreak: Math.max(0, Math.trunc(body.stats.currentStreak)),
      maxStreak: Math.max(0, Math.trunc(body.stats.maxStreak)),
      lastDay:
        body.stats.lastDay === null ? null : Math.max(1, Math.trunc(body.stats.lastDay)),
      distribution: body.stats.distribution.map((value) =>
        Math.max(0, Math.trunc(Number.isFinite(value) ? value : 0)),
      ),
    };
  }

  let daily: ParsedLegacyImport['daily'] = null;
  if (body.daily !== undefined && body.daily !== null) {
    if (
      typeof body.daily.date !== 'string' ||
      !isValidDateKey(body.daily.date) ||
      !Array.isArray(body.daily.guesses)
    ) {
      throw new ApiError(400, 'invalid_import', 'The saved daily game is not valid.');
    }
    const guessIds = body.daily.guesses
      .map((guess) => (guess && typeof guess.id === 'string' ? guess.id : null))
      .filter((id): id is string => typeof id === 'string' && id.length <= 120);
    daily = { date: body.daily.date, guessIds: [...new Set(guessIds)].slice(0, 6) };
  }

  return { stats, daily };
}

async function importCurrentDaily(
  client: import('pg').PoolClient,
  user: UserRow,
  daily: NonNullable<ParsedLegacyImport['daily']>,
): Promise<void> {
  const today = todayDateKey();
  if (daily.date !== today) return;

  const puzzle = await ensureDailyPuzzle(client, today);
  const game = await ensureDailyGame(client, user.id, puzzle);
  if (game.status !== 'playing') return;

  const target = parseBuildingSnapshot(game.target_snapshot);
  if (!target) return;

  const existing = await client.query<GuessRow>(
    'SELECT * FROM guesses WHERE game_id = $1 ORDER BY attempt ASC',
    [game.id],
  );
  const seen = new Set(existing.rows.map((row) => row.building_id));
  let attempts = existing.rows.length;
  let correct = existing.rows.some((row) => row.correct);

  for (const id of daily.guessIds) {
    if (correct || attempts >= config.maxGuesses || seen.has(id)) continue;
    const building = getBuilding(id);
    if (!building) continue;

    const cells = compareBuilding(target, building);
    attempts += 1;
    correct = building.id === target.id;
    await client.query(
      `INSERT INTO guesses
         (id, game_id, user_id, attempt, building_id, building_name, cells, correct)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
       ON CONFLICT DO NOTHING`,
      [
        crypto.randomUUID(),
        game.id,
        user.id,
        attempts,
        building.id,
        building.name,
        JSON.stringify(cells),
        correct,
      ],
    );
    seen.add(building.id);
  }

  const status = correct ? 'won' : attempts >= config.maxGuesses ? 'lost' : 'playing';
  await client.query(
    `UPDATE games
        SET attempts = $2,
            status = $3,
            updated_at = now(),
            completed_at = CASE WHEN $4 THEN now() ELSE completed_at END
      WHERE id = $1`,
    [game.id, attempts, status, status !== 'playing'],
  );

  if (status !== 'playing') {
    await client.query(
      `INSERT INTO daily_results
         (user_id, puzzle_date, day_number, status, attempts, target_building_id)
       VALUES ($1, $2::date, $3, $4, $5, $6)
       ON CONFLICT (user_id, puzzle_date) DO NOTHING`,
      [user.id, today, puzzle.day_number, status, attempts, target.id],
    );
  }
}

export async function importLegacy(
  user: UserRow,
  payload: unknown,
): Promise<{ imported: boolean; user: UserRow }> {
  const parsed = parseLegacyImport(payload);

  return withTransaction(async (client) => {
    const locked = await client.query<UserRow>(
      'SELECT * FROM users WHERE id = $1 FOR UPDATE',
      [user.id],
    );
    const current = locked.rows[0];
    if (!current) {
      throw new ApiError(404, 'not_found', 'The profile no longer exists.');
    }
    if (current.legacy_imported_at) {
      return { imported: false, user: current };
    }

    if (parsed.daily) {
      await importCurrentDaily(client, current, parsed.daily);
    }

    const updated = await client.query<UserRow>(
      `UPDATE users
          SET legacy_stats = COALESCE($2::jsonb, legacy_stats),
              legacy_imported_at = now(),
              updated_at = now()
        WHERE id = $1
        RETURNING *`,
      [current.id, parsed.stats ? JSON.stringify(parsed.stats) : null],
    );
    return { imported: true, user: updated.rows[0] };
  });
}

export async function deleteUser(userId: string): Promise<void> {
  await query('DELETE FROM users WHERE id = $1', [userId]);
}

export async function exportUserData(user: UserRow): Promise<unknown> {
  const [games, guesses, results, accounts, stats] = await Promise.all([
    query<GameRow>('SELECT * FROM games WHERE user_id = $1 ORDER BY created_at ASC', [user.id]),
    query<GuessRow>('SELECT * FROM guesses WHERE user_id = $1 ORDER BY created_at ASC', [user.id]),
    query<DailyResultRow>(
      'SELECT * FROM daily_results WHERE user_id = $1 ORDER BY puzzle_date ASC',
      [user.id],
    ),
    query<OAuthAccountRow>(
      'SELECT provider, provider_account_id, email, created_at FROM oauth_accounts WHERE user_id = $1',
      [user.id],
    ),
    getStatsForUser(user),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      kind: user.kind,
      name: user.name,
      email: user.email,
      pictureUrl: user.picture_url,
      createdAt: user.created_at.toISOString(),
      legacyStats: user.legacy_stats,
      legacyImportedAt: user.legacy_imported_at?.toISOString() ?? null,
    },
    oauthAccounts: accounts.rows,
    stats,
    games: games.rows,
    guesses: guesses.rows,
    dailyResults: results.rows,
  };
}
