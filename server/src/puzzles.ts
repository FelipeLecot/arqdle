import crypto from 'node:crypto';
import type pg from 'pg';
import type { DailyPuzzleRow, GameRow } from './db-types';
import { dailySelectionFor } from './daily';

export async function ensureDailyPuzzle(
  client: pg.PoolClient,
  dateKey: string,
): Promise<DailyPuzzleRow> {
  const selection = dailySelectionFor(dateKey);
  await client.query(
    `INSERT INTO daily_puzzles (puzzle_date, day_number, target_building_id, target_snapshot)
     VALUES ($1::date, $2, $3, $4::jsonb)
     ON CONFLICT (puzzle_date) DO NOTHING`,
    [dateKey, selection.dayNumber, selection.building.id, JSON.stringify(selection.building)],
  );
  const result = await client.query<DailyPuzzleRow>(
    'SELECT * FROM daily_puzzles WHERE puzzle_date = $1::date',
    [dateKey],
  );
  if (!result.rows[0]) throw new Error(`Could not create daily puzzle for ${dateKey}`);
  return result.rows[0];
}

export async function ensureDailyGame(
  client: pg.PoolClient,
  userId: string,
  puzzle: DailyPuzzleRow,
): Promise<GameRow> {
  await client.query(
    `INSERT INTO games
       (id, user_id, mode, puzzle_date, day_number, target_building_id, target_snapshot)
     VALUES ($1, $2, 'daily', $3::date, $4, $5, $6::jsonb)
     ON CONFLICT (user_id, puzzle_date) WHERE mode = 'daily' DO NOTHING`,
    [
      crypto.randomUUID(),
      userId,
      puzzle.puzzle_date,
      puzzle.day_number,
      puzzle.target_building_id,
      JSON.stringify(puzzle.target_snapshot),
    ],
  );
  const result = await client.query<GameRow>(
    `SELECT * FROM games
      WHERE user_id = $1 AND mode = 'daily' AND puzzle_date = $2::date`,
    [userId, puzzle.puzzle_date],
  );
  if (!result.rows[0]) throw new Error(`Could not create daily game for ${puzzle.puzzle_date}`);
  return result.rows[0];
}
