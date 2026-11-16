import type { AttributeKey, CellStatus, Direction, GuessCell } from '../../shared/types';
import type { Building } from './types';

const MATERIAL_FAMILIES: Record<string, string> = {
  travertine: 'stone',
  tuff: 'stone',
  marble: 'stone',
  limestone: 'stone',
  sandstone: 'stone',
  granite: 'stone',
  basalt: 'stone',
  andesite: 'stone',
  sarsen: 'stone',
  bluestone: 'stone',
  'portland stone': 'stone',
  soapstone: 'stone',
  laterite: 'stone',
  stone: 'stone',
  concrete: 'concrete',
  'reinforced concrete': 'concrete',
  steel: 'metal',
  'wrought iron': 'metal',
  iron: 'metal',
  bronze: 'metal',
  lead: 'metal',
  'gold leaf': 'metal',
  titanium: 'metal',
  aluminium: 'metal',
  'stainless steel': 'metal',
  glass: 'glass',
  'stained glass': 'glass',
  brick: 'ceramic',
  terracotta: 'ceramic',
  'ceramic tile': 'ceramic',
  'terracotta tile': 'ceramic',
  stucco: 'ceramic',
  plaster: 'ceramic',
  tile: 'ceramic',
  wood: 'timber',
  timber: 'timber',
  'composite panels': 'synthetic',
  plastic: 'synthetic',
};

export function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function materialFamily(material: string): string {
  return MATERIAL_FAMILIES[normalize(material)] ?? 'other';
}

export function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BC` : String(year);
}

function ordinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

export function centuryLabel(year: number): string {
  const century = Math.ceil(Math.abs(year) / 100);
  return year < 0 ? `${ordinal(century)} c. BC` : `${ordinal(century)} c.`;
}

export function centuryDistance(a: number, b: number): number {
  const first = { number: Math.ceil(Math.abs(a) / 100), era: a < 0 ? 'BC' : 'AD' };
  const second = { number: Math.ceil(Math.abs(b) / 100), era: b < 0 ? 'BC' : 'AD' };
  if (first.era === second.era) return Math.abs(first.number - second.number);
  // The 1st century BC and the 1st century AD meet at the year 1.
  if (first.number === 1 && second.number === 1) return 1;
  return 99;
}

export function countryFlag(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/[A-Z]/g, (letter) =>
      String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65),
    );
}

function cell(
  key: AttributeKey,
  status: CellStatus,
  value: string,
  note: string,
  extra: Partial<Pick<GuessCell, 'sub' | 'direction'>> = {},
): GuessCell {
  return { key, status, value, note, ...extra };
}

function exactStatus(matches: boolean): CellStatus {
  return matches ? 'green' : 'red';
}

function describeStatus(status: CellStatus, exact: string, close: string, miss: string): string {
  if (status === 'green') return exact;
  if (status === 'yellow') return close;
  return miss;
}

export function compareBuilding(target: Building, guess: Building): GuessCell[] {
  const continentStatus = exactStatus(guess.continent === target.continent);
  const countryStatus = exactStatus(
    guess.countryCode.toUpperCase() === target.countryCode.toUpperCase(),
  );

  const centuries = centuryDistance(guess.year, target.year);
  const builtStatus: CellStatus = centuries === 0 ? 'green' : centuries === 1 ? 'yellow' : 'red';
  const direction: Direction | undefined =
    target.year === guess.year ? undefined : target.year < guess.year ? 'older' : 'newer';

  const styleStatus: CellStatus =
    normalize(guess.style) === normalize(target.style)
      ? 'green'
      : guess.styleFamily === target.styleFamily
        ? 'yellow'
        : 'red';

  const typeStatus: CellStatus =
    normalize(guess.type) === normalize(target.type)
      ? 'green'
      : guess.formFamily === target.formFamily
        ? 'yellow'
        : 'red';

  const useStatus = exactStatus(normalize(guess.use) === normalize(target.use));

  const guessMaterials = guess.materials.map(normalize);
  const targetMaterials = target.materials.map(normalize);
  const primaryMaterialMatch = guessMaterials[0] === targetMaterials[0];
  const exactMaterialOverlap = guessMaterials.filter((material) =>
    targetMaterials.includes(material),
  );
  const guessedFamilies = new Set(guessMaterials.map(materialFamily));
  const sharedFamilies = [...new Set(targetMaterials.map(materialFamily))].filter((family) =>
    guessedFamilies.has(family),
  );
  const materialStatus: CellStatus = primaryMaterialMatch
    ? 'green'
    : exactMaterialOverlap.length > 0 || sharedFamilies.length > 0
      ? 'yellow'
      : 'red';

  const guessArchitects = new Set(guess.architects.map(normalize));
  const targetArchitects = new Set(target.architects.map(normalize));
  const architectOverlap = [...guessArchitects].filter((name) => targetArchitects.has(name));
  const sameArchitects =
    guessArchitects.size === targetArchitects.size &&
    architectOverlap.length === guessArchitects.size;
  const architectStatus: CellStatus = sameArchitects
    ? 'green'
    : architectOverlap.length > 0
      ? 'yellow'
      : 'red';

  const builtDirectionNote =
    direction === 'older'
      ? ' The answer is older.'
      : direction === 'newer'
        ? ' The answer is newer.'
        : '';

  return [
    cell(
      'continent',
      continentStatus,
      guess.continent,
      describeStatus(
        continentStatus,
        `Continent: ${guess.continent}. Exact match.`,
        '',
        `Continent: ${guess.continent}. The answer is on a different continent.`,
      ),
    ),
    cell(
      'country',
      countryStatus,
      `${countryFlag(guess.countryCode)} ${guess.country}`,
      describeStatus(
        countryStatus,
        `Country: ${guess.country}. Exact match.`,
        '',
        `Country: ${guess.country}. The answer is in a different country.`,
      ),
    ),
    cell(
      'built',
      builtStatus,
      formatYear(guess.year),
      `Built: guessed ${formatYear(guess.year)} (${centuryLabel(guess.year)}).${
        builtStatus === 'green'
          ? ' Same century as the answer.'
          : builtStatus === 'yellow'
            ? ' Next to the answer’s century.'
            : ' Far from the answer’s century.'
      }${builtDirectionNote}`,
      {
        sub: centuryLabel(guess.year),
        direction,
      },
    ),
    cell(
      'style',
      styleStatus,
      guess.style,
      describeStatus(
        styleStatus,
        `Style: ${guess.style}. Exact match.`,
        `Style: ${guess.style}, in the same family as the answer (${guess.styleFamily}).`,
        `Style: ${guess.style} (${guess.styleFamily}). No match.`,
      ),
      styleStatus === 'yellow' ? { sub: 'same family' } : {},
    ),
    cell(
      'type',
      typeStatus,
      guess.type,
      describeStatus(
        typeStatus,
        `Type: ${guess.type}. Exact match.`,
        `Type: ${guess.type}, in the same form family as the answer (${guess.formFamily}).`,
        `Type: ${guess.type}. No match.`,
      ),
      typeStatus === 'yellow' ? { sub: guess.formFamily } : {},
    ),
    cell(
      'use',
      useStatus,
      guess.use,
      describeStatus(
        useStatus,
        `Use: ${guess.use}. Exact match.`,
        '',
        `Use: ${guess.use}. The answer has a different use.`,
      ),
    ),
    cell(
      'material',
      materialStatus,
      guess.materials.join(' · '),
      materialStatus === 'green'
        ? `Material: ${guess.materials.join(', ')}. Same main material.`
        : materialStatus === 'yellow'
          ? `Material: ${guess.materials.join(', ')}. ${
              exactMaterialOverlap.length > 0
                ? `Shares ${exactMaterialOverlap.join(' and ')} with the answer.`
                : `Shares the ${sharedFamilies.join(' and ')} material family.`
            }`
          : `Material: ${guess.materials.join(', ')}. No match.`,
      materialStatus === 'yellow' ? { sub: 'same family' } : {},
    ),
    cell(
      'architect',
      architectStatus,
      guess.architects.join(' · '),
      architectStatus === 'green'
        ? `Architect: ${guess.architects.join(' and ')}. Exact match.`
        : architectStatus === 'yellow'
          ? `Architect: ${guess.architects.join(' and ')}. Shares ${architectOverlap.join(' and ')} with the answer.`
          : `Architect: ${guess.architects.join(' and ')}. No match.`,
      architectStatus === 'yellow' ? { sub: 'shares one' } : {},
    ),
  ];
}
