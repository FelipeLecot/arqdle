import type pg from 'pg';
import type { DailyResultRow, GameRow, UserRow } from './db-types';
import { isBetterResult, isLegacyStats, mergeLegacyStats } from './stats';

function keepGuestGame(
  guestGame: GameRow,
  targetGame: GameRow,
  guestResult: DailyResultRow | undefined,
  targetResult: DailyResultRow | undefined,
): boolean {
  if (guestResult && targetResult) return isBetterResult(guestResult, targetResult);
  if (guestResult) return true;
  if (targetResult) return false;
  if (guestGame.status !== 'playing' && targetGame.status === 'playing') return true;
  if (guestGame.status === 'playing' && targetGame.status !== 'playing') return false;
  return guestGame.attempts > targetGame.attempts;
}

async function getResults(
  client: pg.PoolClient,
  tableUserId: string,
): Promise<Map<string, DailyResultRow>> {
  const result = await client.query<DailyResultRow>(
    'SELECT * FROM daily_results WHERE user_id = $1',
    [tableUserId],
  );
  return new Map(result.rows.map((row) => [row.puzzle_date, row]));
}

/**
 * Merge a guest profile into an existing Google profile.
 *
 * The caller must run this inside a transaction. Daily conflicts keep the
 * better result (a win beats a loss, then fewer attempts). Practice games are
 * always kept. The guest user is deleted at the end.
 */
export async function mergeGuestIntoUser(
  client: pg.PoolClient,
  guestId: string,
  targetId: string,
): Promise<void> {
  if (guestId === targetId) return;

  const ids = [guestId, targetId].sort();
  const locked = await client.query<UserRow>(
    'SELECT * FROM users WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE',
    [ids],
  );
  const guest = locked.rows.find((row) => row.id === guestId);
  const target = locked.rows.find((row) => row.id === targetId);
  if (!target) throw new Error('Could not merge into a missing user.');
  if (!guest) return;
  if (guest.kind !== 'guest') return;

  const guestResults = await getResults(client, guestId);
  const targetResults = await getResults(client, targetId);

  const guestGames = await client.query<GameRow>(
    'SELECT * FROM games WHERE user_id = $1',
    [guestId],
  );
  const targetGames = await client.query<GameRow>(
    "SELECT * FROM games WHERE user_id = $1 AND mode = 'daily'",
    [targetId],
  );
  const targetDailyGames = new Map(
    targetGames.rows.map((game) => [game.puzzle_date, game]),
  );

  for (const game of guestGames.rows) {
    if (game.mode === 'practice') {
      await client.query('UPDATE games SET user_id = $1 WHERE id = $2', [targetId, game.id]);
      continue;
    }

    const targetGame = game.puzzle_date ? targetDailyGames.get(game.puzzle_date) : undefined;
    if (!targetGame) {
      await client.query('UPDATE games SET user_id = $1 WHERE id = $2', [targetId, game.id]);
      continue;
    }

    const guestResult = game.puzzle_date ? guestResults.get(game.puzzle_date) : undefined;
    const targetResult = game.puzzle_date ? targetResults.get(game.puzzle_date) : undefined;
    if (keepGuestGame(game, targetGame, guestResult, targetResult)) {
      await client.query('DELETE FROM games WHERE id = $1', [targetGame.id]);
      await client.query('UPDATE games SET user_id = $1 WHERE id = $2', [targetId, game.id]);
    } else {
      await client.query('DELETE FROM games WHERE id = $1', [game.id]);
    }
  }

  for (const result of guestResults.values()) {
    const current = targetResults.get(result.puzzle_date);
    if (!current) {
      await client.query(
        'UPDATE daily_results SET user_id = $1 WHERE user_id = $2 AND puzzle_date = $3::date',
        [targetId, guestId, result.puzzle_date],
      );
      continue;
    }
    if (isBetterResult(result, current)) {
      await client.query(
        'DELETE FROM daily_results WHERE user_id = $1 AND puzzle_date = $2::date',
        [targetId, current.puzzle_date],
      );
      await client.query(
        'UPDATE daily_results SET user_id = $1 WHERE user_id = $2 AND puzzle_date = $3::date',
        [targetId, guestId, result.puzzle_date],
      );
    } else {
      await client.query(
        'DELETE FROM daily_results WHERE user_id = $1 AND puzzle_date = $2::date',
        [guestId, result.puzzle_date],
      );
    }
  }

  // Guesses on moved games still point at the guest. Reassign before deleting it.
  await client.query('UPDATE guesses SET user_id = $1 WHERE user_id = $2', [targetId, guestId]);

  const targetLegacy = isLegacyStats(target.legacy_stats) ? target.legacy_stats : null;
  const guestLegacy = isLegacyStats(guest.legacy_stats) ? guest.legacy_stats : null;
  const mergedLegacy = mergeLegacyStats(targetLegacy, guestLegacy);

  await client.query(
    `UPDATE users
        SET legacy_stats = CASE WHEN $2::jsonb IS NULL THEN legacy_stats ELSE $2::jsonb END,
            legacy_imported_at = COALESCE(legacy_imported_at, $3),
            updated_at = now()
      WHERE id = $1`,
    [targetId, mergedLegacy ? JSON.stringify(mergedLegacy) : null, guest.legacy_imported_at],
  );

  await client.query('DELETE FROM users WHERE id = $1', [guestId]);
}
