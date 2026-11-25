import { describe, expect, it } from 'vitest';
import {
  ATTRIBUTE_KEYS,
} from '../shared/types';
import { compareBuilding, centuryDistance, formatYear, isNearMiss, materialFamily } from '../server/src/compare';
import { buildings, getBuilding } from '../server/src/data';

function building(id: string) {
  const value = getBuilding(id);
  if (!value) throw new Error(`Missing test building: ${id}`);
  return value;
}

function cellMap(id: string, guessId: string) {
  const cells = compareBuilding(building(id), building(guessId));
  return new Map(cells.map((cell) => [cell.key, cell]));
}

describe('century comparison', () => {
  it('treats years in the same century as an exact age clue', () => {
    expect(centuryDistance(1889, 1930)).toBe(1);
    expect(centuryDistance(1889, 1890)).toBe(0);
    expect(centuryDistance(2000, 2001)).toBe(1);
    expect(centuryDistance(1, 100)).toBe(0);
  });

  it('handles the BC and AD boundary', () => {
    expect(centuryDistance(-50, 50)).toBe(1);
    expect(centuryDistance(-150, 50)).toBe(99);
    expect(centuryDistance(-438, -323)).toBe(1);
    expect(centuryDistance(-2560, -1290)).toBe(13);
  });

  it('formats signed years', () => {
    expect(formatYear(-438)).toBe('438 BC');
    expect(formatYear(1889)).toBe('1889');
  });
});

describe('building comparison', () => {
  it('returns eight clues in display order', () => {
    const cells = compareBuilding(building('colosseum'), building('florence-cathedral'));
    expect(cells.map((cell) => cell.key)).toEqual([...ATTRIBUTE_KEYS]);
  });

  it('marks the same building all green', () => {
    for (const item of buildings) {
      const cells = compareBuilding(item, item);
      expect(cells.every((cell) => cell.status === 'green')).toBe(true);
    }
  });

  it('matches the example: Colosseum versus Florence Cathedral', () => {
    const cells = cellMap('colosseum', 'florence-cathedral');
    expect(cells.get('continent')?.status).toBe('green');
    expect(cells.get('country')?.status).toBe('green');
    expect(cells.get('built')?.status).toBe('red');
    expect(cells.get('built')?.direction).toBe('older');
    expect(cells.get('style')?.status).toBe('red');
    expect(cells.get('material')?.status).toBe('yellow');
    expect(cells.get('material')?.sub).toBe('partial match');
  });

  it('uses style families for a close match', () => {
    const cells = cellMap('st-peters-basilica', 'florence-cathedral');
    expect(cells.get('style')?.status).toBe('yellow');
    expect(cells.get('type')?.status).toBe('yellow');
  });

  it('uses form families for a close type match', () => {
    const cells = cellMap('colosseum', 'florence-cathedral');
    expect(cells.get('type')?.status).toBe('red');
    const religious = cellMap('st-peters-basilica', 'notre-dame-paris');
    expect(religious.get('type')?.status).toBe('yellow');
  });

  it('shares architects and materials', () => {
    const cells = cellMap('guggenheim-bilbao', 'disney-concert-hall');
    expect(cells.get('architect')?.status).toBe('green');
    expect(cells.get('style')?.status).toBe('green');
    expect(cells.get('material')?.status).toBe('yellow');
  });

  it('uses direction arrows against the answer', () => {
    const cells = cellMap('eiffel-tower', 'cn-tower');
    expect(cells.get('built')?.status).toBe('yellow');
    expect(cells.get('built')?.direction).toBe('older');
    expect(cells.get('type')?.status).toBe('green');
    expect(cells.get('use')?.status).toBe('green');
  });

  it('keeps country and continent binary', () => {
    const cells = cellMap('colosseum', 'cn-tower');
    expect(cells.get('continent')?.status).toBe('red');
    expect(cells.get('country')?.status).toBe('red');
  });

  it('knows every material in the data set', () => {
    for (const item of buildings) {
      for (const material of item.materials) {
        expect(materialFamily(material), `${item.id}: ${material}`).not.toBe('other');
      }
    }
  });

  it('marks a wrong all-green guess as a near miss', () => {
    const cells = compareBuilding(building('altun-ha'), building('caracol'));
    expect(cells.every((cell) => cell.status === 'green')).toBe(true);
    expect(isNearMiss(cells, false)).toBe(true);
    expect(isNearMiss(cells, true)).toBe(false);
  });
});
