import { describe, expect, it } from 'vitest';
import type { BuildingOption } from '../shared/types';
import { scoreOption } from '../src/search';

const option: BuildingOption = {
  id: 'test-building',
  name: 'Test Building',
  hint: 'Montevideo, Uruguay',
  city: 'Montevideo',
  country: 'Uruguay',
  countryCode: 'UY',
  architects: ['Oscar Niemeyer'],
};

describe('building search', () => {
  it('matches names, architects and cities', () => {
    expect(scoreOption(option, 'test', 'en')).toBe(0);
    expect(scoreOption(option, 'niemeyer', 'en')).toBe(1);
    expect(scoreOption(option, 'montevideo', 'en')).toBe(2);
  });

  it('does not match the country', () => {
    expect(scoreOption(option, 'uruguay', 'en')).toBe(Number.POSITIVE_INFINITY);
  });

  it('ignores unknown architects', () => {
    expect(
      scoreOption({ ...option, id: 'unknown-architect', architects: ['Unknown'] }, 'unknown', 'en'),
    ).toBe(Number.POSITIVE_INFINITY);
  });
});
