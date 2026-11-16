import type { Building } from '../types';
import { africa } from './africa';
import { americas } from './americas';
import { asia } from './asia';
import { europe } from './europe';
import { antarctica, oceania } from './oceania';

export const buildings: Building[] = [
  ...europe,
  ...americas,
  ...africa,
  ...asia,
  ...oceania,
  ...antarctica,
].sort((a, b) => a.name.localeCompare(b.name, 'en'));

const byId = new Map<string, Building>();
const byName = new Map<string, Building>();

for (const building of buildings) {
  if (byId.has(building.id)) {
    throw new Error(`Duplicate building id: ${building.id}`);
  }
  byId.set(building.id, building);
  byName.set(building.name.toLowerCase(), building);
}

export const buildingById = byId;

export function getBuilding(id: string): Building | undefined {
  return byId.get(id);
}

export function getBuildingByName(name: string): Building | undefined {
  return byName.get(name.trim().toLowerCase());
}

export function searchableNames(building: Building): string {
  return [building.name, ...(building.aliases ?? []), building.city, building.country]
    .join(' ')
    .toLowerCase();
}
