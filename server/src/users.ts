import type { Me, Stats } from '../../shared/types';
import { config } from './config';
import type { DailyResultRow, GameRow, GuessRow, OAuthAccountRow, UserRow } from './db-types';
import { query } from './db';
import { computeStats } from './stats';

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
  return computeStats(results.rows);
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
  };
}

export async function deleteUser(userId: string): Promise<void> {
  await query('DELETE FROM users WHERE id = $1', [userId]);
}

/** Unfinished games must not reveal their answer in the export. */
function exportGame(game: GameRow): unknown {
  if (game.status !== 'playing') return game;
  const { target_building_id: _id, target_snapshot: _snapshot, ...rest } = game;
  return rest;
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
    },
    oauthAccounts: accounts.rows,
    stats,
    games: games.rows.map(exportGame),
    guesses: guesses.rows,
    dailyResults: results.rows,
  };
}
