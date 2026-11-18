import { describe, expect, it } from 'vitest';
import { emptyStats, recordDailyResult } from '../shared/stats';

describe('daily stats', () => {
  it('counts wins, streaks and the guess distribution', () => {
    let stats = emptyStats();
    stats = recordDailyResult(stats, 1, 'won', 3);
    expect(stats.played).toBe(1);
    expect(stats.wins).toBe(1);
    expect(stats.currentStreak).toBe(1);
    expect(stats.maxStreak).toBe(1);
    expect(stats.distribution[2]).toBe(1);

    stats = recordDailyResult(stats, 2, 'won', 3);
    expect(stats.currentStreak).toBe(2);
    expect(stats.maxStreak).toBe(2);
    expect(stats.distribution[2]).toBe(2);
  });

  it('resets the streak on a loss but keeps the maximum', () => {
    let stats = recordDailyResult(emptyStats(), 1, 'won', 2);
    stats = recordDailyResult(stats, 2, 'won', 4);
    stats = recordDailyResult(stats, 3, 'lost', 10);
    expect(stats.played).toBe(3);
    expect(stats.wins).toBe(2);
    expect(stats.currentStreak).toBe(0);
    expect(stats.maxStreak).toBe(2);
    expect(stats.lastDay).toBe(3);
  });

  it('starts a new streak after a missed day', () => {
    let stats = recordDailyResult(emptyStats(), 1, 'won', 1);
    stats = recordDailyResult(stats, 3, 'won', 1);
    expect(stats.currentStreak).toBe(1);
    expect(stats.lastDay).toBe(3);
  });

  it('counts a win on the tenth attempt in the last bucket', () => {
    const stats = recordDailyResult(emptyStats(), 1, 'won', 10);
    expect(stats.distribution).toHaveLength(10);
    expect(stats.distribution[9]).toBe(1);
  });

  it('does not count the same day twice', () => {
    const first = recordDailyResult(emptyStats(), 5, 'won', 2);
    const second = recordDailyResult(first, 5, 'won', 2);
    expect(second).toBe(first);
  });
});
