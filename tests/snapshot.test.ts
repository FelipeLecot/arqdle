import { describe, expect, it } from 'vitest';
import { buildings } from '../server/src/data';
import { parseBuildingSnapshot } from '../server/src/snapshot';

describe('building snapshots', () => {
  it('accepts a complete building', () => {
    const parsed = parseBuildingSnapshot(buildings[0]);
    expect(parsed?.id).toBe(buildings[0].id);
  });

  it('rejects malformed snapshots', () => {
    expect(parseBuildingSnapshot(null)).toBeNull();
    expect(parseBuildingSnapshot({ id: 'x' })).toBeNull();
    expect(parseBuildingSnapshot({ ...buildings[0], materials: 'stone' })).toBeNull();
    expect(parseBuildingSnapshot({ ...buildings[0], continent: 'Atlantis' })).toBeNull();
  });
});
