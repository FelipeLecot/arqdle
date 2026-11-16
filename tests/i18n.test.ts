import { describe, expect, it } from 'vitest';
import { buildings } from '../server/src/data';
import {
  buildingEs,
  continentsEs,
  countriesEs,
  formFamiliesEs,
  materialsEs,
  stylesEs,
  typesEs,
  usesEs,
} from '../src/i18n/esData';
import { translations, type TranslationKey } from '../src/i18n/translations';

describe('Spanish translations', () => {
  it('has copy for every building', () => {
    expect(Object.keys(buildingEs).sort()).toEqual(buildings.map((building) => building.id).sort());

    for (const building of buildings) {
      const copy = buildingEs[building.id];
      expect(copy, building.id).toBeDefined();
      expect(copy.name.length, building.id).toBeGreaterThan(2);
      expect(copy.city.length, building.id).toBeGreaterThan(1);
      expect(copy.blurb.length, building.id).toBeGreaterThan(30);
      expect(copy.fact.length, building.id).toBeGreaterThan(15);
      if (building.yearNote) expect(copy.yearNote, building.id).toBeTruthy();
    }
  });

  it('translates every controlled clue value', () => {
    for (const building of buildings) {
      expect(continentsEs[building.continent], building.continent).toBeTruthy();
      expect(countriesEs[building.country], building.country).toBeTruthy();
      expect(stylesEs[building.style], building.style).toBeTruthy();
      expect(typesEs[building.type], building.type).toBeTruthy();
      expect(usesEs[building.use], building.use).toBeTruthy();
      expect(formFamiliesEs[building.formFamily], building.formFamily).toBeTruthy();
      for (const material of building.materials) {
        expect(materialsEs[material], material).toBeTruthy();
      }
    }
  });

  it('has a Spanish string for every UI key', () => {
    const keys = Object.keys(translations.en) as TranslationKey[];
    for (const key of keys) {
      expect(translations.es[key], key).toBeTruthy();
    }
  });
});
