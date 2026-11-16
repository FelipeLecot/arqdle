import { describe, expect, it } from 'vitest';
import { createPuzzle, getPuzzleTargetId, resolveGuess } from '../server/src/puzzle';
import { buildings } from '../server/src/data';
import { todayDailySelection } from '../server/src/daily';
import { ApiError } from '../server/src/errors';

function expectApiError(callback: () => unknown, code: string) {
  try {
    callback();
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe(code);
    return;
  }
  throw new Error(`Expected ApiError ${code}`);
}

describe('puzzle tokens', () => {
  it('starts a daily puzzle without revealing the answer', () => {
    const puzzle = createPuzzle('daily');
    expect(puzzle.mode).toBe('daily');
    expect(puzzle.token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(puzzle.dayNumber).toBeGreaterThan(0);
    expect(puzzle.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(puzzle.nextDailyAt).toBeTruthy();
    expect(Date.parse(puzzle.nextDailyAt as string)).toBeGreaterThan(Date.now());
    expect(JSON.stringify(puzzle)).not.toContain('"answer"');
  });

  it('wins with the correct building and all green clues', () => {
    const target = todayDailySelection().building;
    const resolution = resolveGuess(createPuzzle('daily').token, target.id);
    expect(resolution.result.status).toBe('won');
    expect(resolution.result.answer?.id).toBe(target.id);
    expect(resolution.result.cells.every((cell) => cell.status === 'green')).toBe(true);
    expect(resolution.result.token).toBeNull();
  });

  it('loses after six wrong guesses and reveals the answer', () => {
    const target = todayDailySelection().building;
    const wrong = buildings.find((item) => item.id !== target.id);
    expect(wrong).toBeDefined();
    if (!wrong) return;

    let token = createPuzzle('daily').token;
    let lastStatus = 'playing';
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      const resolution = resolveGuess(token, wrong.id);
      lastStatus = resolution.result.status;
      expect(resolution.result.cells).toHaveLength(8);
      if (attempt < 6) {
        expect(resolution.result.status).toBe('playing');
        expect(resolution.result.answer).toBeUndefined();
        expect(resolution.result.token).toBeTruthy();
        token = resolution.result.token as string;
      } else {
        expect(resolution.result.status).toBe('lost');
        expect(resolution.result.answer?.id).toBe(target.id);
        expect(resolution.result.token).toBeNull();
      }
    }
    expect(lastStatus).toBe('lost');
  });

  it('rejects a tampered token', () => {
    const token = createPuzzle('daily').token;
    const index = Math.floor(token.length / 2);
    const replacement = token[index] === 'A' ? 'B' : 'A';
    const tampered = `${token.slice(0, index)}${replacement}${token.slice(index + 1)}`;
    expectApiError(() => resolveGuess(tampered, buildings[0].id), 'invalid_token');
  });

  it('rejects unknown buildings', () => {
    expectApiError(() => resolveGuess(createPuzzle('daily').token, 'not-a-building'), 'invalid_guess');
  });

  it('creates practice puzzles with a different target from today', () => {
    const dailyId = todayDailySelection().building.id;
    for (let index = 0; index < 20; index += 1) {
      const puzzle = createPuzzle('practice');
      const targetId = getPuzzleTargetId(puzzle.token);
      expect(targetId).not.toBe(dailyId);
      const resolution = resolveGuess(puzzle.token, targetId);
      expect(resolution.result.status).toBe('won');
      expect(resolution.result.answer?.id).toBe(targetId);
    }
  });
});
