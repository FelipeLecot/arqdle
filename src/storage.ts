import type { Answer, GameStatus, GuessRecord, LegacyImportRequest, Stats } from '../shared/types';
import { emptyStats } from '../shared/stats';

const PREFIX = 'arqdle:v1';
const LEGACY_PREFIX = 'archdle:v1';
// Increment when the catalog changes in a way that changes daily answers.
const DAILY_KEY_VERSION = 'v2';

export function migrateLegacyStorage(): void {
  try {
    const keys: string[] = [];
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(`${LEGACY_PREFIX}:`)) keys.push(key);
    }
    for (const legacyKey of keys) {
      const newKey = `${PREFIX}:${legacyKey.slice(LEGACY_PREFIX.length + 1)}`;
      const value = window.localStorage.getItem(legacyKey);
      if (value !== null && window.localStorage.getItem(newKey) === null) {
        window.localStorage.setItem(newKey, value);
      }
      window.localStorage.removeItem(legacyKey);
    }
  } catch {
    // Storage can be unavailable in private mode.
  }
}

interface StoredGame {
  token?: string;
  guesses: GuessRecord[];
  status: GameStatus;
  answer?: Answer;
  dayNumber?: number;
  date?: string;
  dateLabel?: string;
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private mode.
  }
}

function isStoredGame(value: unknown): value is StoredGame {
  if (!value || typeof value !== 'object') return false;
  const game = value as Partial<StoredGame>;
  return (
    Array.isArray(game.guesses) &&
    game.guesses.every(
      (guess) =>
        guess &&
        typeof guess.id === 'string' &&
        typeof guess.name === 'string' &&
        Array.isArray(guess.cells),
    ) &&
    (game.status === 'playing' || game.status === 'won' || game.status === 'lost')
  );
}

function parseGame(raw: string | null): StoredGame | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredGame(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadStats(): Stats {
  const raw = read(`${PREFIX}:stats`);
  if (!raw) return emptyStats();
  try {
    const parsed = JSON.parse(raw) as Partial<Stats>;
    const distribution =
      Array.isArray(parsed.distribution) && parsed.distribution.length === 6
        ? parsed.distribution.map((value) => (Number.isFinite(value) ? Number(value) : 0))
        : emptyStats().distribution;
    return {
      played: Number.isFinite(parsed.played) ? Number(parsed.played) : 0,
      wins: Number.isFinite(parsed.wins) ? Number(parsed.wins) : 0,
      currentStreak: Number.isFinite(parsed.currentStreak) ? Number(parsed.currentStreak) : 0,
      maxStreak: Number.isFinite(parsed.maxStreak) ? Number(parsed.maxStreak) : 0,
      lastDay: Number.isFinite(parsed.lastDay) ? Number(parsed.lastDay) : null,
      distribution,
    };
  } catch {
    return emptyStats();
  }
}

function latestDailyGame(): { date: string; game: StoredGame } | null {
  try {
    let latest: { date: string; game: StoredGame } | null = null;
    const prefix = `${PREFIX}:daily:${DAILY_KEY_VERSION}:`;
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(prefix)) continue;
      const date = key.slice(prefix.length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const game = parseGame(window.localStorage.getItem(key));
      if (game && (!latest || date > latest.date)) latest = { date, game };
    }
    return latest;
  } catch {
    return null;
  }
}

function hasStats(stats: Stats): boolean {
  return (
    stats.played > 0 ||
    stats.wins > 0 ||
    stats.currentStreak > 0 ||
    stats.maxStreak > 0 ||
    stats.distribution.some((value) => value > 0)
  );
}

/** Read the old browser-only progress so the server can import it once. */
export function collectLegacyImport(): LegacyImportRequest | null {
  if (read(`${PREFIX}:legacy-imported`) !== null) return null;

  const stats = loadStats();
  const daily = latestDailyGame();
  const payload: LegacyImportRequest = {};
  if (hasStats(stats)) payload.stats = stats;
  if (daily) {
    payload.daily = {
      date: daily.date,
      guesses: daily.game.guesses.map((guess) => ({ id: guess.id })),
    };
  }

  return payload.stats || payload.daily ? payload : null;
}

export function markLegacyImported(): void {
  write(`${PREFIX}:legacy-imported`, new Date().toISOString());
}

export function clearLegacyGames(): void {
  try {
    const prefix = `${PREFIX}:daily:${DAILY_KEY_VERSION}:`;
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
    window.localStorage.removeItem(`${PREFIX}:practice`);
  } catch {
    // Ignore storage errors.
  }
}

export function hasSeenIntro(): boolean {
  return read(`${PREFIX}:intro`) === '1';
}

export function markIntroSeen(): void {
  write(`${PREFIX}:intro`, '1');
}
