import { describe, expect, it } from 'vitest';
import { computeStats } from '../server/src/stats';
import type { DailyResultRow } from '../server/src/db-types';
import type { Stats } from '../shared/types';

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

const legacy: Stats = {
  played: 4,
  wins: 3,
  currentStreak: 2,
  maxStreak: 2,
  lastDay: 4,
  distribution: [1, 1, 1, 0, 0, 0],
};

describe('computed stats', () => {
  it('derives wins and the distribution from daily results', () => {
    const stats = computeStats([result(1, 'won', 3), result(2, 'lost', 6), result(3, 'won', 1)], null);
    expect(stats.played).toBe(3);
    expect(stats.wins).toBe(2);
    expect(stats.currentStreak).toBe(1);
    expect(stats.maxStreak).toBe(1);
    expect(stats.lastDay).toBe(3);
    expect(stats.distribution).toEqual([1, 0, 1, 0, 0, 0]);
  });

  it('adds the legacy aggregate and continues a matching streak', () => {
    const stats = computeStats([result(5, 'won', 1)], legacy);
    expect(stats.played).toBe(5);
    expect(stats.wins).toBe(4);
    expect(stats.currentStreak).toBe(3);
    expect(stats.maxStreak).toBe(3);
    expect(stats.lastDay).toBe(5);
    expect(stats.distribution).toEqual([2, 1, 1, 0, 0, 0]);
  });

  it('does not continue a legacy streak across a gap', () => {
    const stats = computeStats([result(8, 'won', 2)], legacy);
    expect(stats.currentStreak).toBe(1);
    expect(stats.maxStreak).toBe(2);
    expect(stats.played).toBe(5);
    expect(stats.wins).toBe(4);
  });

  it('returns the legacy stats when there are no database results', () => {
    expect(computeStats([], legacy)).toEqual(legacy);
  });
});
