import { describe, expect, it } from 'vitest';
import { dateKeyInTimeZone, nextDailyAt } from '../server/src/dates';

describe('next daily reset', () => {
  it('finds the next local midnight', () => {
    const now = new Date('2026-11-16T15:30:00Z');
    const next = nextDailyAt(now, 'America/Montevideo');
    expect(dateKeyInTimeZone(next, 'America/Montevideo')).toBe('2026-11-17');
    expect(dateKeyInTimeZone(new Date(next.getTime() - 2_000), 'America/Montevideo')).toBe(
      '2026-11-16',
    );
    expect(next.getTime()).toBeGreaterThan(now.getTime());
    expect(next.getTime() - now.getTime()).toBeLessThan(25 * 60 * 60 * 1000);
  });

  it('handles a daylight-saving transition', () => {
    const now = new Date('2026-03-28T12:00:00Z');
    const next = nextDailyAt(now, 'Europe/Madrid');
    expect(dateKeyInTimeZone(next, 'Europe/Madrid')).toBe('2026-03-29');
    expect(dateKeyInTimeZone(new Date(next.getTime() - 2_000), 'Europe/Madrid')).toBe(
      '2026-03-28',
    );
  });
});
