const PREFIX = 'arqdle:v1';
const LEGACY_PREFIX = 'archdle:v1';

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

export function hasSeenIntro(): boolean {
  return read(`${PREFIX}:intro`) === '1';
}

export function markIntroSeen(): void {
  write(`${PREFIX}:intro`, '1');
}
