import { MAX_GUESSES, type Stats } from '../../shared/types';
import type { DailyResultRow } from './db-types';
import { emptyStats } from '../../shared/stats';

/** Stats are derived from finished daily games. */
export function computeStats(results: DailyResultRow[]): Stats {
  if (results.length === 0) return emptyStats();

  const sorted = [...results].sort((a, b) => a.day_number - b.day_number);
  const distribution = Array.from({ length: MAX_GUESSES }, () => 0);
  let played = 0;
  let wins = 0;
  let maxStreak = 0;
  let previousDay: number | null = null;
  let currentStreak = 0;

  for (const result of sorted) {
    played += 1;
    if (result.status === 'won') {
      wins += 1;
      distribution[Math.min(Math.max(result.attempts - 1, 0), MAX_GUESSES - 1)] += 1;
      currentStreak =
        previousDay !== null && result.day_number === previousDay + 1
          ? currentStreak + 1
          : 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
    previousDay = result.day_number;
  }

  return {
    played,
    wins: Math.min(wins, played),
    currentStreak,
    maxStreak: Math.max(maxStreak, currentStreak),
    lastDay: previousDay,
    distribution,
  };
}

export function isBetterResult(
  candidate: Pick<DailyResultRow, 'status' | 'attempts'>,
  current: Pick<DailyResultRow, 'status' | 'attempts'>,
): boolean {
  if (candidate.status !== current.status) return candidate.status === 'won';
  return candidate.attempts < current.attempts;
}
