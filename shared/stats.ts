import type { GameStatus, Stats } from './types';

export function emptyStats(): Stats {
  return {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastDay: null,
    distribution: [0, 0, 0, 0, 0, 0],
  };
}

export function recordDailyResult(
  stats: Stats,
  dayNumber: number,
  status: GameStatus,
  attempts: number,
): Stats {
  if (!Number.isInteger(dayNumber) || dayNumber < 1) return stats;
  if (stats.lastDay !== null && stats.lastDay >= dayNumber) return stats;

  const won = status === 'won';
  const distribution = [...stats.distribution];
  if (won) {
    const index = Math.min(Math.max(attempts - 1, 0), distribution.length - 1);
    distribution[index] += 1;
  }
  const currentStreak = won
    ? stats.lastDay === dayNumber - 1
      ? stats.currentStreak + 1
      : 1
    : 0;

  return {
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    lastDay: dayNumber,
    distribution,
  };
}
