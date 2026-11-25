import crypto from 'node:crypto';
import type { GameView, GuessRecord } from '../../shared/types';
import { toAnswer } from './answer';
import { compareBuilding, isNearMiss } from './compare';
import { config } from './config';
import type { GameRow, GuessRow } from './db-types';
import { getBuilding } from './data';
import { randomPracticeBuilding, todayDateKey } from './daily';
import { dateLabelFor, nextDailyAt } from './dates';
import { query, withTransaction } from './db';
import { ApiError } from './errors';
import { getWikipediaImage } from './images';
import { ensureDailyGame, ensureDailyPuzzle } from './puzzles';
import { parseBuildingSnapshot } from './snapshot';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function guessRecords(rows: GuessRow[]): GuessRecord[] {
  return rows.map((row) => ({
    id: row.building_id,
    name: row.building_name,
    cells: row.cells,
    correct: row.correct,
    nearMiss: isNearMiss(row.cells, row.correct),
  }));
}

export async function buildGameView(game: GameRow): Promise<GameView> {
  const guesses = await query<GuessRow>(
    'SELECT * FROM guesses WHERE game_id = $1 ORDER BY attempt ASC',
    [game.id],
  );

  const view: GameView = {
    id: game.id,
    mode: game.mode,
    status: game.status,
    maxGuesses: config.maxGuesses,
    attempts: game.attempts,
    guesses: guessRecords(guesses.rows),
  };

  if (game.mode === 'daily' && game.puzzle_date) {
    view.date = game.puzzle_date;
    view.dayNumber = game.day_number ?? undefined;
    view.dateLabel = dateLabelFor(game.puzzle_date);
    view.nextDailyAt = nextDailyAt(new Date(), config.timezone).toISOString();
  }

  if (game.status !== 'playing') {
    const target = parseBuildingSnapshot(game.target_snapshot);
    if (target) {
      const image = await getWikipediaImage(target.wikiTitle, target.name);
      view.answer = toAnswer(target, image);
    }
  }

  return view;
}

export async function getDailyGame(userId: string): Promise<GameView> {
  const game = await withTransaction(async (client) => {
    const puzzle = await ensureDailyPuzzle(client, todayDateKey());
    return ensureDailyGame(client, userId, puzzle);
  });
  return buildGameView(game);
}

export async function getPracticeGame(
  userId: string,
  options: { newGame?: boolean; excludeId?: string } = {},
): Promise<GameView> {
  let game: GameRow | undefined;

  if (!options.newGame) {
    const existing = await query<GameRow>(
      `SELECT * FROM games
        WHERE user_id = $1 AND mode = 'practice'
        ORDER BY updated_at DESC
        LIMIT 1`,
      [userId],
    );
    game = existing.rows[0];
  }

  if (!game) {
    const exclude = new Set<string>();
    if (options.excludeId && getBuilding(options.excludeId)) exclude.add(options.excludeId);
    const target = randomPracticeBuilding(exclude);
    const created = await query<GameRow>(
      `INSERT INTO games
         (id, user_id, mode, target_building_id, target_snapshot)
       VALUES ($1, $2, 'practice', $3, $4::jsonb)
       RETURNING *`,
      [crypto.randomUUID(), userId, target.id, JSON.stringify(target)],
    );
    game = created.rows[0];
  }

  return buildGameView(game);
}

export async function submitGuess(
  userId: string,
  gameId: string,
  buildingId: string,
): Promise<GameView> {
  if (!UUID_PATTERN.test(gameId)) {
    throw new ApiError(400, 'invalid_game', 'The game id is not valid.');
  }
  const guess = getBuilding(buildingId);
  if (!guess) {
    throw new ApiError(400, 'invalid_guess', 'That building is not in the game list.');
  }

  const game = await withTransaction(async (client) => {
    const found = await client.query<GameRow>(
      'SELECT * FROM games WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [gameId, userId],
    );
    const current = found.rows[0];
    if (!current) {
      throw new ApiError(404, 'game_not_found', 'This game no longer exists.');
    }
    if (current.mode === 'daily' && current.puzzle_date !== todayDateKey()) {
      throw new ApiError(409, 'daily_closed', 'This daily puzzle is closed. Load the new one.');
    }

    const duplicate = await client.query<GuessRow>(
      'SELECT * FROM guesses WHERE game_id = $1 AND building_id = $2',
      [current.id, buildingId],
    );
    if (duplicate.rows[0]) return current;

    if (current.status !== 'playing') {
      throw new ApiError(409, 'game_over', 'This game is already over.');
    }
    if (current.attempts >= config.maxGuesses) {
      throw new ApiError(409, 'game_over', 'This game is already over.');
    }

    const target = parseBuildingSnapshot(current.target_snapshot);
    if (!target) {
      throw new ApiError(500, 'invalid_puzzle', 'This puzzle is no longer available.');
    }

    const cells = compareBuilding(target, guess);
    const attempt = current.attempts + 1;
    const correct = target.id === guess.id;
    const status = correct
      ? 'won'
      : attempt >= config.maxGuesses
        ? 'lost'
        : 'playing';

    await client.query(
      `INSERT INTO guesses
         (id, game_id, user_id, attempt, building_id, building_name, cells, correct)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
      [
        crypto.randomUUID(),
        current.id,
        userId,
        attempt,
        guess.id,
        guess.name,
        JSON.stringify(cells),
        correct,
      ],
    );

    const updated = await client.query<GameRow>(
      `UPDATE games
          SET attempts = $2,
              status = $3,
              updated_at = now(),
              completed_at = CASE WHEN $4 THEN now() ELSE completed_at END
        WHERE id = $1
        RETURNING *`,
      [current.id, attempt, status, status !== 'playing'],
    );

    if (current.mode === 'daily' && status !== 'playing' && current.puzzle_date) {
      await client.query(
        `INSERT INTO daily_results
           (user_id, puzzle_date, day_number, status, attempts, target_building_id)
         VALUES ($1, $2::date, $3, $4, $5, $6)
         ON CONFLICT (user_id, puzzle_date) DO NOTHING`,
        [
          userId,
          current.puzzle_date,
          current.day_number ?? 0,
          status,
          attempt,
          current.target_building_id,
        ],
      );
    }

    return updated.rows[0];
  });

  return buildGameView(game);
}
