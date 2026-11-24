import { describe, expect, it } from 'vitest';
import { computeStats } from '../server/src/stats';
import type { DailyResultRow } from '../server/src/db-types';

function result(day: number, status: 'won' | 'lost', attempts: number): DailyResultRow {
  return {
    user_id: 'user',
    puzzle_date: `2026-11-${String(day).padStart(2, '0')}`,
    day_number: day,
    status,
    attempts,
    target_building_id: 'x',
    completed_at: new Date(),
  };
}

describe('computed stats', () => {
  it('derives wins and the distribution from daily results', () => {
    const stats = computeStats(
      [result(1, 'won', 3), result(2, 'lost', 10), result(3, 'won', 1)],
    );
    expect(stats.played).toBe(3);
    expect(stats.wins).toBe(2);
    expect(stats.currentStreak).toBe(1);
    expect(stats.maxStreak).toBe(1);
    expect(stats.lastDay).toBe(3);
    expect(stats.distribution).toEqual([1, 0, 1, 0, 0, 0, 0, 0, 0, 0]);
  });
});
