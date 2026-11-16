const DAILY_KEY_PREFIX = 'archdle:v1:daily:';

/**
 * Development utility: opening /?reset=daily clears the saved daily game in this
 * browser, then removes the query parameter. Stats are kept.
 */
export function resetDailyIfRequested(): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  if (url.searchParams.get('reset') !== 'daily') return;

  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(DAILY_KEY_PREFIX)) window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors.
  }

  url.searchParams.delete('reset');
  window.history.replaceState({}, '', url);
}
