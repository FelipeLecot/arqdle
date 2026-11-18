import type { Building } from '../types';
import { africa } from './africa';
import { africaExtra } from './africa-extra';
import { americas } from './americas';
import { americasExtra } from './americas-extra';
import { asia } from './asia';
import { asiaExtra } from './asia-extra';
import { europe } from './europe';
import { europeExtra } from './europe-extra';
import { iconBuildings } from './icons';
import { moreBuildings } from './more';
import { antarctica, oceania } from './oceania';
import { antarcticaExtra, oceaniaExtra } from './oceania-extra';
import { southAmericaExtra } from './south-america-extra';

export const buildings: Building[] = [
  ...europe,
  ...europeExtra,
  ...americas,
  ...americasExtra,
  ...southAmericaExtra,
  ...africa,
  ...africaExtra,
  ...asia,
  ...asiaExtra,
  ...oceania,
  ...oceaniaExtra,
  ...antarctica,
  ...antarcticaExtra,
  ...moreBuildings,
  ...iconBuildings,
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
