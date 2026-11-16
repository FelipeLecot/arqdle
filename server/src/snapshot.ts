import type { Building } from './types';
import { CONTINENTS } from './types';

const CONTINENT_SET = new Set<string>(CONTINENTS);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Validate a jsonb building snapshot before using it in comparisons.
 * Snapshots are written by this server, but a corrupt row should not crash a game.
 */
export function parseBuildingSnapshot(value: unknown): Building | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const building = value as Partial<Building>;
  if (
    typeof building.id !== 'string' ||
    typeof building.name !== 'string' ||
    typeof building.city !== 'string' ||
    typeof building.country !== 'string' ||
    typeof building.countryCode !== 'string' ||
    typeof building.continent !== 'string' ||
    !CONTINENT_SET.has(building.continent) ||
    typeof building.year !== 'number' ||
    !Number.isFinite(building.year) ||
    typeof building.style !== 'string' ||
    typeof building.styleFamily !== 'string' ||
    typeof building.type !== 'string' ||
    typeof building.formFamily !== 'string' ||
    typeof building.use !== 'string' ||
    !isStringArray(building.materials) ||
    !isStringArray(building.architects) ||
    typeof building.blurb !== 'string' ||
    typeof building.fact !== 'string' ||
    typeof building.wikiTitle !== 'string'
  ) {
    return null;
  }
  return building as Building;
}
