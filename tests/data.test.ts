import { describe, expect, it } from 'vitest';
import { buildings } from '../server/src/data';
import { materialFamily } from '../server/src/compare';
import { config } from '../server/src/config';
import { dailySelectionFor, randomPracticeBuilding, todayDailySelection } from '../server/src/daily';
import { dayNumberFor } from '../server/src/dates';
import {
  CONTINENTS,
  FORM_FAMILIES,
  STYLE_FAMILIES,
  USE_CATEGORIES,
} from '../server/src/types';

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

describe('building data', () => {
  it('contains a useful number of buildings', () => {
    expect(buildings.length).toBeGreaterThanOrEqual(60);
  });

  it('has unique ids and names', () => {
    expect(new Set(buildings.map((item) => item.id)).size).toBe(buildings.length);
    expect(new Set(buildings.map((item) => item.name)).size).toBe(buildings.length);
  });

  it('has complete and valid attributes', () => {
    for (const item of buildings) {
      expect(item.name.length, item.id).toBeGreaterThan(2);
      expect(item.city.length, item.id).toBeGreaterThan(1);
      expect(item.country.length, item.id).toBeGreaterThan(1);
      expect(item.countryCode, item.id).toMatch(/^[A-Z]{2}$/);
      expect(CONTINENTS, item.id).toContain(item.continent);
      expect(STYLE_FAMILIES, item.id).toContain(item.styleFamily);
      expect(FORM_FAMILIES, item.id).toContain(item.formFamily);
      expect(USE_CATEGORIES, item.id).toContain(item.use);
      expect(item.year, item.id).toBeGreaterThan(-10_000);
      expect(item.year, item.id).toBeLessThan(2031);
      expect(item.materials.length, item.id).toBeGreaterThan(0);
      expect(item.architects.length, item.id).toBeGreaterThan(0);
      expect(item.blurb.length, item.id).toBeGreaterThan(40);
      expect(item.fact.length, item.id).toBeGreaterThan(20);
      expect(item.wikiTitle.length, item.id).toBeGreaterThan(2);
      if (item.heightM !== undefined) expect(item.heightM, item.id).toBeGreaterThan(0);
      for (const material of item.materials) {
        expect(materialFamily(material), `${item.id}: ${material}`).not.toBe('other');
      }
    }
  });

  it('covers every continent', () => {
    const covered = new Set(buildings.map((item) => item.continent));
    expect([...CONTINENTS].every((continent) => covered.has(continent))).toBe(true);
  });

  it('uses every style family and form family', () => {
    const styles = new Set(buildings.map((item) => item.styleFamily));
    const forms = new Set(buildings.map((item) => item.formFamily));
    expect([...STYLE_FAMILIES].every((family) => styles.has(family))).toBe(true);
    expect([...FORM_FAMILIES].every((family) => forms.has(family))).toBe(true);
  });
});

describe('daily selection', () => {
  it('counts the first day from the configured epoch', () => {
    expect(dayNumberFor('2026-11-16', '2026-11-16')).toBe(1);
    expect(dayNumberFor('2026-11-17', '2026-11-16')).toBe(2);
  });

  it('is deterministic', () => {
    const first = dailySelectionFor('2035-04-12');
    const second = dailySelectionFor('2035-04-12');
    expect(first.building.id).toBe(second.building.id);
    expect(first.dayNumber).toBeGreaterThan(1);
  });

  it('uses every building once across a full cycle', () => {
    const start = addDays(config.epoch, buildings.length * 100);
    const ids = new Set<string>();
    for (let offset = 0; offset < buildings.length; offset += 1) {
      ids.add(dailySelectionFor(addDays(start, offset)).building.id);
    }
    expect(ids.size).toBe(buildings.length);
  });

  it('never picks the daily answer in practice', () => {
    const dailyId = todayDailySelection().building.id;
    for (let index = 0; index < 40; index += 1) {
      expect(randomPracticeBuilding().id).not.toBe(dailyId);
    }
  });
});
