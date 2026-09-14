import { describe, it, expect } from 'vitest';
import {
  composeAllRoutes,
  composeAllSmearingZones,
  getInsertPosition,
  getWallDimensions,
  labelBox,
  layoutLabels,
  overlapArea,
  type ComposedHold,
  type Config,
  type LabelPlacement,
  type Point,
  type ZoneLabelPlacement,
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

/** Two inserts closer than this must not compete for the association rule (mirrors label-placement.ts) */
const INSERT_PROXIMITY_MM = 1;

interface Layout {
  holds: ComposedHold[];
  placements: LabelPlacement[];
  zonePlacements: ZoneLabelPlacement[];
}

async function layout(config: Config, fontSize: number): Promise<Layout> {
  const holds = composeAllRoutes(config.routes, routes);
  const zones = composeAllSmearingZones(config.routes, routes, holds);
  const { holds: placements, zones: zonePlacements } = await layoutLabels(
    config,
    holds,
    { holdLabelFontSize: fontSize },
    zones
  );
  return { holds, placements, zonePlacements };
}

function holdKey(hold: ComposedHold): string {
  return `${hold.sourceRoute}#${hold.originalHoldNumber}@${hold.laneOffset}`;
}

/** A hold's insert in wall SVG coordinates — the same origin `layoutLabels` places labels from */
function holdInsertSvg(hold: ComposedHold, wallHeight: number): Point {
  const pos = getInsertPosition(hold.panel, hold.position, hold.laneOffset);
  if (hold.anchorOffset) {
    pos.x += hold.anchorOffset.x;
    pos.y += hold.anchorOffset.y;
  }
  return { x: pos.x, y: wallHeight - pos.y };
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

  it.each(FONT_SIZES)('no zone label overlaps a hold or a hold label at %ipx', async (fontSize) => {
    const { zonePlacements } = await layout(IFSC_AND_U15_DE, fontSize);
    expect(zonePlacements.length).toBeGreaterThan(0);
    for (const zone of zonePlacements) {
      expect(zone.fallback, zone.text).toBe(false);
      expect(zone.overlap, zone.text).toBeLessThanOrEqual(1e-6);
    }
  });

  // Independent of `ZoneLabelPlacement.overlap`, which is computed by the code
  // under test: pins the hold-labels-first / zone-labels-second ordering.
  it.each(FONT_SIZES)('no zone-label box overlaps a hold-label box, checked independently, at %ipx', async (fontSize) => {
    const { placements, zonePlacements } = await layout(IFSC_AND_U15_DE, fontSize);
    for (const zone of zonePlacements) {
      if (zone.fallback) continue;
      const zoneBox = labelBox(zone.center, zone.width, zone.height, 0);
      for (const hold of placements) {
        const holdBox = labelBox(hold.center, hold.width, hold.height, hold.angle);
        expect(overlapArea(holdBox, zoneBox), `${zone.text} vs ${hold.text}`).toBeLessThanOrEqual(1e-6);
      }
    }
  });

  it('hold labels do not depend on zones at 200px', async () => {
    const holds = composeAllRoutes(IFSC_AND_U15_DE.routes, routes);
    const zones = composeAllSmearingZones(IFSC_AND_U15_DE.routes, routes, holds);
    const withZones = await layoutLabels(IFSC_AND_U15_DE, holds, { holdLabelFontSize: 200 }, zones);
    const withoutZones = await layoutLabels(IFSC_AND_U15_DE, holds, { holdLabelFontSize: 200 }, []);
    expect(withoutZones.holds.length).toBe(withZones.holds.length);
    withZones.holds.forEach((placement, index) => {
      expect(withoutZones.holds[index].center.x, placement.text).toBeCloseTo(placement.center.x, 6);
      expect(withoutZones.holds[index].center.y, placement.text).toBeCloseTo(placement.center.y, 6);
    });
  });

  it.each(FONT_SIZES)("no hold label is nearer another hold's insert than its own at %ipx", async (fontSize) => {
    const { holds, placements } = await layout(IFSC_AND_U15_DE, fontSize);
    const wall = getWallDimensions(IFSC_AND_U15_DE.wall.lanes, IFSC_AND_U15_DE.wall.panelsHeight);
    const inserts = holds.map((hold) => holdInsertSvg(hold, wall.height));

    for (const placement of placements) {
      const ownInsert = inserts[placement.holdIndex];
      const ownDistance = Math.hypot(placement.center.x - ownInsert.x, placement.center.y - ownInsert.y);

      inserts.forEach((otherInsert, otherIndex) => {
        if (otherIndex === placement.holdIndex) return;
        // Two holds sharing an insert (e.g. a hand hold and a foot hold at the
        // same position) must not compete with each other
        const proximity = Math.hypot(otherInsert.x - ownInsert.x, otherInsert.y - ownInsert.y);
        if (proximity <= INSERT_PROXIMITY_MM) return;
        const otherDistance = Math.hypot(placement.center.x - otherInsert.x, placement.center.y - otherInsert.y);
        expect(ownDistance, `${placement.text} vs hold #${otherIndex}`).toBeLessThan(otherDistance);
      });
    }
  });

  it.each([120, 200])('does not let the IFSC M8 label overlap the IFSC A3 zone label at %ipx', async (fontSize) => {
    const { holds, placements, zonePlacements } = await layout(IFSC_AND_U15_DE, fontSize);
    const m8 = placements.find((p) => holds[p.holdIndex].sourceRoute === 'ifsc' && holds[p.holdIndex].label === 'M8');
    const a3 = zonePlacements.find((z) => z.text === 'A3');
    expect(m8).toBeDefined();
    expect(a3).toBeDefined();
    const m8Box = labelBox(m8!.center, m8!.width, m8!.height, m8!.angle);
    const a3Box = labelBox(a3!.center, a3!.width, a3!.height, 0);
    expect(overlapArea(m8Box, a3Box)).toBeLessThanOrEqual(1e-6);
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
    expect(forward.size).toBeGreaterThan(0);
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
