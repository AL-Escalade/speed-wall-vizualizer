import { describe, it, expect } from 'vitest';
import {
  composeAllRoutes,
  getWallDimensions,
  labelBox,
  layoutHoldLabels,
  type ComposedHold,
  type Config,
  type LabelPlacement,
} from '@voie-vitesse/core';
import { loadRoutes } from './index.js';

const routes = loadRoutes();

const IFSC_AND_U15_DE: Config = {
  wall: { lanes: 2, panelsHeight: 10 },
  routes: [
    { segments: [{ source: 'ifsc', laneOffset: 0 }] },
    { segments: [{ source: 'u15-de', laneOffset: 1 }] },
  ],
};

const FONT_SIZES = [40, 120, 200];

/**
 * Ceiling on fallbacks for IFSC + U15-DE, per font size. Measured 0 when the
 * placement landed (the spec review simulation found 0 too); the slack keeps a
 * hold nudged in a reference route from failing this test for no reason.
 */
const FALLBACK_CEILING = 2;

async function layout(config: Config, fontSize: number): Promise<{ holds: ComposedHold[]; placements: LabelPlacement[] }> {
  const holds = composeAllRoutes(config.routes, routes);
  const placements = await layoutHoldLabels(config, holds, { holdLabelFontSize: fontSize });
  return { holds, placements };
}

function holdKey(hold: ComposedHold): string {
  return `${hold.sourceRoute}#${hold.originalHoldNumber}@${hold.laneOffset}`;
}

describe('hold label placement on the reference routes', () => {
  it.each(FONT_SIZES)('keeps every label off its own hold at %ipx', async (fontSize) => {
    const { placements } = await layout(IFSC_AND_U15_DE, fontSize);
    for (const placement of placements) {
      expect(placement.ownOverlap, placement.text).toBeLessThanOrEqual(1e-6);
    }
  });

  it.each(FONT_SIZES)('rarely falls back at %ipx', async (fontSize) => {
    const { placements } = await layout(IFSC_AND_U15_DE, fontSize);
    expect(placements.filter((placement) => placement.fallback).length).toBeLessThanOrEqual(FALLBACK_CEILING);
  });

  it.each([120, 200])('frees M2 from M1 (IFSC) and H2 from H1 (U15-DE) at %ipx', async (fontSize) => {
    const { holds, placements } = await layout(IFSC_AND_U15_DE, fontSize);
    const find = (route: string, label: string): LabelPlacement | undefined =>
      placements.find((p) => holds[p.holdIndex].sourceRoute === route && holds[p.holdIndex].label === label);
    expect(find('ifsc', 'M2')?.fallback).toBe(false);
    expect(find('u15-de', 'H2')?.fallback).toBe(false);
  });

  it('does not depend on the order of the routes', async () => {
    const reversed: Config = { ...IFSC_AND_U15_DE, routes: [...IFSC_AND_U15_DE.routes].reverse() };
    const byHold = async (config: Config): Promise<Map<string, LabelPlacement>> => {
      const { holds, placements } = await layout(config, 200);
      return new Map(placements.map((p) => [holdKey(holds[p.holdIndex]), p]));
    };
    const forward = await byHold(IFSC_AND_U15_DE);
    const backward = await byHold(reversed);
    expect(backward.size).toBe(forward.size);
    for (const [key, placement] of forward) {
      expect(backward.get(key)?.center.x, key).toBeCloseTo(placement.center.x, 6);
      expect(backward.get(key)?.center.y, key).toBeCloseTo(placement.center.y, 6);
    }
  });

  it.each(['u15', 'u11-u13'])('keeps the %s finish pad label on the wall at 200px', async (source) => {
    const config: Config = { wall: { lanes: 1, panelsHeight: 10 }, routes: [{ segments: [{ source, laneOffset: 0 }] }] };
    const wall = getWallDimensions(config.wall.lanes, config.wall.panelsHeight);
    const { holds, placements } = await layout(config, 200);
    const pads = placements.filter((p) => holds[p.holdIndex].type === 'STOP');
    expect(pads.length).toBeGreaterThan(0);
    for (const pad of pads) {
      for (const corner of labelBox(pad.center, pad.width, pad.height, pad.angle)) {
        expect(corner.x).toBeGreaterThanOrEqual(0);
        expect(corner.x).toBeLessThanOrEqual(wall.width);
        expect(corner.y).toBeGreaterThanOrEqual(0);
        expect(corner.y).toBeLessThanOrEqual(wall.height);
      }
    }
  });
});
