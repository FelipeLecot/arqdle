export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes): string => {
    const part = parts.find((item) => item.type === type);
    if (!part) throw new Error(`Could not format date part: ${type}`);
    return part.value;
  };

  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function dateKeyToUtc(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** 1-based day number, counted from the configured epoch. */
export function dayNumberFor(dateKey: string, epoch: string): number {
  const days = Math.round((dateKeyToUtc(dateKey) - dateKeyToUtc(epoch)) / 86_400_000);
  return Math.max(1, days + 1);
}

export function dateLabelFor(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

/**
 * Return the first instant at which the date in `timeZone` is tomorrow's date.
 * The binary search uses the same formatter as the daily selection, so it handles
 * DST changes without an external timezone library.
 */
export function nextDailyAt(date: Date, timeZone: string): Date {
  const currentKey = dateKeyInTimeZone(date, timeZone);
  const [year, month, day] = currentKey.split('-').map(Number);
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);

  let low = date.getTime();
  let high = low + 2 * 86_400_000;
  while (dateKeyInTimeZone(new Date(high), timeZone) < tomorrow) {
    high += 86_400_000;
  }
  while (high - low > 1_000) {
    const middle = Math.floor((low + high) / 2);
    if (dateKeyInTimeZone(new Date(middle), timeZone) >= tomorrow) {
      high = middle;
    } else {
      low = middle;
    }
  }
  return new Date(high);
}
