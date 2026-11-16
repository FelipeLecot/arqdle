import type { Answer, GameStatus, GuessRecord, Stats } from '../shared/types';
import { emptyStats } from '../shared/stats';

const PREFIX = 'archdle:v1';
// Increment when the catalog changes in a way that changes daily answers.
const DAILY_KEY_VERSION = 'v2';

function dailyKey(date: string): string {
  return `${PREFIX}:daily:${DAILY_KEY_VERSION}:${date}`;
}

export interface StoredGame {
  token: string;
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
    // Storage can be unavailable in private mode. The game still works in memory.
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

function isStoredGame(value: unknown): value is StoredGame {
  if (!value || typeof value !== 'object') return false;
  const game = value as Partial<StoredGame>;
  return (
    typeof game.token === 'string' &&
    game.token.length > 0 &&
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

export function loadDaily(date: string): StoredGame | null {
  return parseGame(read(dailyKey(date)));
}

export function saveDaily(date: string, game: StoredGame): void {
  write(dailyKey(date), JSON.stringify(game));
}

export function clearDaily(date: string): void {
  remove(dailyKey(date));
}

export function pruneDaily(keepDate: string): void {
  try {
    const prefix = `${PREFIX}:daily:`;
    const keepKey = dailyKey(keepDate);
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith(prefix) && key !== keepKey) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage errors.
  }
}

export function loadPractice(): StoredGame | null {
  return parseGame(read(`${PREFIX}:practice`));
}

export function savePractice(game: StoredGame): void {
  write(`${PREFIX}:practice`, JSON.stringify(game));
}

export function clearPractice(): void {
  remove(`${PREFIX}:practice`);
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

export function saveStats(stats: Stats): void {
  write(`${PREFIX}:stats`, JSON.stringify(stats));
}

export function hasSeenIntro(): boolean {
  return read(`${PREFIX}:intro`) === '1';
}

export function markIntroSeen(): void {
  write(`${PREFIX}:intro`, '1');
}
