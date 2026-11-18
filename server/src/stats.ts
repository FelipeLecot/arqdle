import { MAX_GUESSES, type Stats } from '../../shared/types';
import type { DailyResultRow } from './db-types';
import { emptyStats } from '../../shared/stats';

/** Stats saved before the switch to ten attempts have six buckets. */
const LEGACY_DISTRIBUTION_LENGTH = 6;

function distributionOf(value: unknown): number[] {
  const distribution = Array.isArray(value) ? value : [];
  return Array.from({ length: MAX_GUESSES }, (_, index) => {
    const count = distribution[index];
    return Number.isInteger(count) && count >= 0 ? Number(count) : 0;
  });
}

function isValidDistributionLength(length: number): boolean {
  return length === LEGACY_DISTRIBUTION_LENGTH || length === MAX_GUESSES;
}

export function isLegacyStats(value: unknown): value is Stats {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const stats = value as Partial<Stats>;
  return (
    Number.isInteger(stats.played) &&
    (stats.played ?? -1) >= 0 &&
    Number.isInteger(stats.wins) &&
    (stats.wins ?? -1) >= 0 &&
    Number.isInteger(stats.currentStreak) &&
    (stats.currentStreak ?? -1) >= 0 &&
    Number.isInteger(stats.maxStreak) &&
    (stats.maxStreak ?? -1) >= 0 &&
    (stats.lastDay === null ||
      (Number.isInteger(stats.lastDay) && (stats.lastDay ?? 0) >= 1)) &&
    Array.isArray(stats.distribution) &&
    isValidDistributionLength(stats.distribution.length)
  );
}

/**
 * Stats are derived from finished daily games. The optional legacy aggregate
 * preserves progress that was stored in localStorage before the database.
 */
export function computeStats(results: DailyResultRow[], legacy: Stats | null): Stats {
  if (results.length === 0) {
    if (!legacy) return emptyStats();
    return {
      ...legacy,
      distribution: distributionOf(legacy.distribution),
      wins: Math.min(legacy.wins, legacy.played),
    };
  }

  const sorted = [...results].sort((a, b) => a.day_number - b.day_number);
  const distribution = Array.from({ length: MAX_GUESSES }, () => 0);
  let played = 0;
  let wins = 0;
  let maxStreak = legacy?.maxStreak ?? 0;
  let previousDay =
    legacy?.lastDay !== null &&
    legacy?.lastDay !== undefined &&
    sorted[0].day_number === legacy.lastDay + 1
      ? legacy.lastDay
      : null;
  let currentStreak = previousDay !== null ? legacy?.currentStreak ?? 0 : 0;

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

  if (legacy) {
    played += legacy.played;
    wins += legacy.wins;
    distribution.forEach((count, index) => {
      distribution[index] = count + (legacy.distribution[index] ?? 0);
    });
    maxStreak = Math.max(maxStreak, legacy.maxStreak);
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

export function mergeLegacyStats(first: Stats | null, second: Stats | null): Stats | null {
  if (!first) return second ? { ...second, distribution: distributionOf(second.distribution) } : null;
  if (!second) return { ...first, distribution: distributionOf(first.distribution) };

  const distribution = distributionOf(first.distribution);
  distributionOf(second.distribution).forEach((count, index) => {
    distribution[index] += count;
  });

  const lastDay =
    first.lastDay === null
      ? second.lastDay
      : second.lastDay === null
        ? first.lastDay
        : Math.max(first.lastDay, second.lastDay);

  return {
    played: first.played + second.played,
    wins: Math.min(first.wins + second.wins, first.played + second.played),
    currentStreak: Math.max(first.currentStreak, second.currentStreak),
    maxStreak: Math.max(first.maxStreak, second.maxStreak),
    lastDay,
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
