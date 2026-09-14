import { describe, it, expect } from 'vitest';
import {
  fanDeviations,
  labelBox,
  placeHoldLabels,
  placeZoneLabels,
  selectFallbackCandidate,
  wallFrame,
  type LabelRequest,
  type ZoneLabelRequest,
  type ZoneLabelContext,
} from './label-placement.js';
import { overlapArea } from './polygon-clip.js';
import type { Point } from './types.js';

const FONT_SIZE = 20;

function rect(minX: number, minY: number, maxX: number, maxY: number): Point[] {
  return [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }];
}

function square(cx: number, cy: number, size: number): Point[] {
  return rect(cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2);
}

function request(holdIndex: number, insert: Point, anchor: Point, outline: Point[]): LabelRequest {
  return { holdIndex, text: 'M1', ownOutline: [outline], anchor, insert, angle: 0 };
}

const HOLD = square(0, 0, 100);
const DOWN = request(0, { x: 0, y: 0 }, { x: 0, y: 60 }, HOLD);

describe('fanDeviations', () => {
  it('tries the drawn direction, then widens by 22.5° alternately', () => {
    expect(fanDeviations()).toEqual([
      0, 22.5, -22.5, 45, -45, 67.5, -67.5, 90, -90, 112.5, -112.5, 135, -135, 157.5, -157.5, 180,
    ]);
  });
});

describe('selectFallbackCandidate', () => {
  it('takes the first candidate within 5 % (+1 mm²) of the smallest overlap', () => {
    expect(selectFallbackCandidate([{ overlap: 100 }, { overlap: 97 }])).toEqual({ overlap: 100 });
    expect(selectFallbackCandidate([{ overlap: 100 }, { overlap: 97 }, { overlap: 50 }])).toEqual({ overlap: 50 });
  });
});

describe('placeHoldLabels', () => {
  it('lifts the label off its hold along the drawn direction', () => {
    const [placement] = placeHoldLabels([DOWN], [[HOLD]], FONT_SIZE);
    expect(placement).toMatchObject({
      holdIndex: 0, text: 'M1', direction: 'ray', d: 65, d0: 65,
      fallback: false, width: 26, height: 20, angle: 0, otherOverlap: 0,
    });
    expect(placement.center).toEqual({ x: 0, y: 65 });
    expect(placement.ownOverlap).toBeLessThanOrEqual(1e-6);
  });

  it('ignores how far the Inkscape anchor sits: it only gives a direction', () => {
    const far = request(0, { x: 0, y: 0 }, { x: 0, y: 300 }, HOLD);
    expect(placeHoldLabels([far], [[HOLD]], FONT_SIZE)[0].center).toEqual({ x: 0, y: 65 });
  });

  it('pushes a label straight down when the anchor sits on the insert', () => {
    const onInsert = request(0, { x: 0, y: 0 }, { x: 0, y: 0 }, HOLD);
    expect(placeHoldLabels([onInsert], [[HOLD]], FONT_SIZE)[0].center).toEqual({ x: 0, y: 65 });
  });

  it('stops right after a neighbour lying across the ray', () => {
    const bar = rect(-30, 70, 30, 85);
    const [placement] = placeHoldLabels([DOWN], [[HOLD], [bar]], FONT_SIZE);
    expect(placement).toMatchObject({ direction: 'ray', d: 100, fallback: false });
  });

  it('turns to the fan when the whole ray window is blocked', () => {
    const bar = rect(-12, 50, 12, 400);
    const [placement] = placeHoldLabels([DOWN], [[HOLD], [bar]], FONT_SIZE);
    expect(placement).toMatchObject({ direction: 22.5, d: 75, fallback: false });
  });

  it('falls back to the first least-overlapping candidate, never onto its own hold', () => {
    const everywhere = square(0, 0, 4000);
    const [placement] = placeHoldLabels([DOWN], [[HOLD], [everywhere]], FONT_SIZE);
    expect(placement).toMatchObject({ fallback: true, direction: 'ray', d: 65, d0: 65 });
    expect(placement.ownOverlap).toBeLessThanOrEqual(1e-6);
    expect(placement.otherOverlap).toBeCloseTo(32 * 26);
  });

  it('makes a later label avoid an earlier one', () => {
    const holdB = square(0, 140, 100);
    const up = request(1, { x: 0, y: 140 }, { x: 0, y: 80 }, holdB);
    const [a, b] = placeHoldLabels([DOWN, up], [[HOLD], [holdB]], FONT_SIZE);
    expect(b.fallback).toBe(false);
    expect(b.direction).not.toBe('ray');
    const boxA = labelBox(a.center, a.width, a.height, a.angle);
    const boxB = labelBox(b.center, b.width, b.height, b.angle);
    expect(overlapArea(boxA, boxB)).toBeLessThanOrEqual(1e-6);
  });

  it('places from the top of the wall down, whatever the request order', () => {
    const holdB = square(0, 140, 100);
    const up = request(1, { x: 0, y: 140 }, { x: 0, y: 80 }, holdB);
    const outlines = [[HOLD], [holdB]];
    const forward = placeHoldLabels([DOWN, up], outlines, FONT_SIZE);
    const backward = placeHoldLabels([up, DOWN], outlines, FONT_SIZE);
    expect(backward[1]).toEqual(forward[0]);
    expect(backward[0]).toEqual(forward[1]);
  });

  it.each([Number.NaN, 0, -5])('rejects a non-positive font size of %s', (fontSize) => {
    expect(() => placeHoldLabels([DOWN], [[HOLD]], fontSize)).toThrow(RangeError);
  });

  describe('the wall edge as an obstacle', () => {
    // own hold square(200, 500, 100): x in [150,250], y in [450,550]; insert
    // (200, 500), anchor (260, 500) -> ray (1, 0); text M1, fontSize 20 -> test
    // box 32 x 26.
    const ownHold = square(200, 500, 100);
    const near = request(0, { x: 200, y: 500 }, { x: 260, y: 500 }, ownHold);

    it('turns inward when the whole ray window would leave the wall', () => {
      const [withoutWall] = placeHoldLabels([near], [[ownHold]], FONT_SIZE);
      expect(withoutWall).toMatchObject({ direction: 'ray', d0: 70, d: 70, fallback: false });
      expect(withoutWall.center).toEqual({ x: 270, y: 500 });

      const [withWall] = placeHoldLabels([near], [[ownHold]], FONT_SIZE, {
        wall: { width: 280, height: 1000 },
      });
      expect(withWall).toMatchObject({ direction: 45, d0: 90, d: 90, fallback: false });
      expect(withWall.center.x).toBeCloseTo(263.6396, 3);
      expect(withWall.center.y).toBeCloseTo(563.6396, 3);
      for (const corner of labelBox(withWall.center, withWall.width, withWall.height, withWall.angle)) {
        expect(corner.x).toBeGreaterThanOrEqual(0);
        expect(corner.x).toBeLessThanOrEqual(280);
        expect(corner.y).toBeGreaterThanOrEqual(0);
        expect(corner.y).toBeLessThanOrEqual(1000);
      }
    });
  });

  describe('association with inserts', () => {
    // A second hold sits on the ray and on every early fan direction's window,
    // so only a candidate strictly closer to (0,0) than to (0,80) can be chosen.
    const NEIGHBOUR = square(0, 80, 2);
    const INSERTS: Point[] = [{ x: 0, y: 0 }, { x: 0, y: 80 }];

    it('refuses a position nearer another insert, and picks the first associated one', () => {
      const [placement] = placeHoldLabels([DOWN], [[HOLD], [NEIGHBOUR]], FONT_SIZE, { inserts: INSERTS });
      expect(placement).toMatchObject({ direction: 67.5, d: 75, d0: 75, fallback: false });
      expect(placement.center.x).toBeCloseTo(-69.291, 3);
      expect(placement.center.y).toBeCloseTo(28.701, 3);
      const ownDistance = Math.hypot(placement.center.x, placement.center.y);
      const otherDistance = Math.hypot(placement.center.x, placement.center.y - 80);
      expect(ownDistance).toBeLessThan(otherDistance);
    });

    it('behaves like today when no inserts are given', () => {
      const [placement] = placeHoldLabels([DOWN], [[HOLD], [NEIGHBOUR]], FONT_SIZE);
      expect(placement).toMatchObject({ direction: 'ray', d: 65 });
    });

    it('ignores an insert within 1 mm of its own (the 1 mm same-insert exception)', () => {
      // (0, 65) is closer to (0, 0.5) than to (0, 0): 64.5 < 65. Without the
      // exception this insert would refuse the ray candidate and the label
      // could never associate with its own hold.
      const nearbyInsert = { x: 0, y: 0.5 };
      const farAwayOutline = square(1000, 1000, 2);
      const [placement] = placeHoldLabels(
        [DOWN],
        [[HOLD], [farAwayOutline]],
        FONT_SIZE,
        { inserts: [{ x: 0, y: 0 }, nearbyInsert] }
      );
      expect(placement).toMatchObject({ direction: 'ray', d: 65, fallback: false });
    });

    it('prefers an associated candidate among the fallback pool', () => {
      // Every candidate is blocked, but only some are associated (closer to
      // (0,0) than to (0,80)); the fallback must still prefer one of those.
      const everywhere = square(0, 0, 4000);
      const [placement] = placeHoldLabels(
        [DOWN],
        [[HOLD], [NEIGHBOUR], [everywhere]],
        FONT_SIZE,
        { inserts: INSERTS }
      );
      expect(placement.fallback).toBe(true);
      const ownDistance = Math.hypot(placement.center.x, placement.center.y);
      const otherDistance = Math.hypot(placement.center.x, placement.center.y - 80);
      expect(ownDistance).toBeLessThan(otherDistance);
    });
  });
});

describe('placeZoneLabels', () => {
  function zoneRequest(overrides: Partial<ZoneLabelRequest> = {}): ZoneLabelRequest {
    return { zoneIndex: 0, text: 'A3', zoneLeft: 0, zoneRight: 200, zoneBottom: 100, ...overrides };
  }

  it('places a zone label with no obstacle at shift 0, drop 0', () => {
    const [placement] = placeZoneLabels([zoneRequest()], [], FONT_SIZE);
    expect(placement).toMatchObject({
      shift: 0, drop: 0, width: 26, height: 20, fallback: false,
    });
    expect(placement.center).toEqual({ x: 13, y: 115 });
  });

  it('slides right to clear a hold under the zone', () => {
    const obstacle = rect(0, 100, 40, 140);
    const [placement] = placeZoneLabels([zoneRequest()], [[obstacle]], FONT_SIZE);
    expect(placement).toMatchObject({ shift: 45, drop: 0 });
    expect(placement.center).toEqual({ x: 58, y: 115 });
  });

  it('drops below the zone when the whole edge is blocked', () => {
    const obstacle = rect(-10, 100, 210, 140);
    const [placement] = placeZoneLabels([zoneRequest()], [[obstacle]], FONT_SIZE);
    expect(placement).toMatchObject({ shift: 0, drop: 40 });
    expect(placement.center).toEqual({ x: 13, y: 155 });
  });

  it('falls back when nothing is free', () => {
    const obstacle = square(0, 0, 4000);
    const [placement] = placeZoneLabels([zoneRequest()], [[obstacle]], FONT_SIZE);
    expect(placement.fallback).toBe(true);
  });

  describe('fixedLabels (hold labels already placed)', () => {
    it('a fixed hold label pushes a zone label along the edge', () => {
      const fixed = rect(0, 100, 40, 140);
      const context: ZoneLabelContext = { fixedLabels: [fixed] };
      const [placement] = placeZoneLabels([zoneRequest()], [], FONT_SIZE, context);
      expect(placement).toMatchObject({ shift: 45, drop: 0 });
      expect(placement.center).toEqual({ x: 58, y: 115 });
    });

    it('a rotated fixed label is handled', () => {
      const fixed = labelBox({ x: 13, y: 115 }, 26, 20, 45);
      const context: ZoneLabelContext = { fixedLabels: [fixed] };
      const [placement] = placeZoneLabels([zoneRequest()], [], FONT_SIZE, context);
      expect(placement.shift).not.toBe(0);
      const box = labelBox(placement.center, placement.width, placement.height, 0);
      expect(overlapArea(fixed, box)).toBeLessThanOrEqual(1e-6);
    });
  });

  it('makes a later zone label avoid an earlier one', () => {
    const first = zoneRequest({ zoneIndex: 0, zoneLeft: 0, zoneRight: 200 });
    const second = zoneRequest({ zoneIndex: 1, zoneLeft: 20, zoneRight: 220 });
    const [a, b] = placeZoneLabels([first, second], [], FONT_SIZE);
    expect(b.fallback).toBe(false);
    const boxA = labelBox(a.center, a.width, a.height, 0);
    const boxB = labelBox(b.center, b.width, b.height, 0);
    expect(overlapArea(boxA, boxB)).toBeLessThanOrEqual(1e-6);
  });

  it.each([Number.NaN, 0, -5])('rejects a non-positive font size of %s', (fontSize) => {
    expect(() => placeZoneLabels([zoneRequest()], [], fontSize)).toThrow(RangeError);
  });

  describe('the wall edge as an obstacle', () => {
    it('does not let a zone label drop below the wall', () => {
      // Blocks the whole edge band; the drop that would otherwise be free (40,
      // box y up to 155 + 10 + 3 = 168) lands outside a 150 mm-tall wall.
      const obstacle = rect(-10, 100, 210, 140);

      const [withoutWall] = placeZoneLabels([zoneRequest()], [[obstacle]], FONT_SIZE);
      expect(withoutWall).toMatchObject({ shift: 0, drop: 40, fallback: false });

      const [withWall] = placeZoneLabels([zoneRequest()], [[obstacle]], FONT_SIZE, {
        wall: { width: 1000, height: 150 },
      });
      expect(withWall.fallback).toBe(true);
      // 416 mm² from the ordinary obstacle + 96 mm² from the frame: pins the
      // frame's own contribution rather than just "some overlap exists".
      expect(withWall).toMatchObject({ shift: 5, drop: 25 });
      expect(withWall.overlap).toBeCloseTo(512, 6);
    });
  });
});

describe('labelBox', () => {
  it('rotates the box around its centre', () => {
    const corners = labelBox({ x: 10, y: 10 }, 20, 10, 90);
    expect(corners[0].x).toBeCloseTo(15, 9);
    expect(corners[0].y).toBeCloseTo(0, 9);
  });
});

describe('wallFrame', () => {
  it('returns 4 polygons', () => {
    expect(wallFrame({ width: 100, height: 50 })).toHaveLength(4);
  });

  it('has zero overlap with a box fully inside the wall', () => {
    const frame = wallFrame({ width: 100, height: 50 });
    const box = rect(10, 10, 90, 40);
    for (const polygon of frame) {
      expect(overlapArea(polygon, box)).toBeLessThanOrEqual(1e-6);
    }
  });

  it('has overlap 200 for a box crossing the right edge by 10 mm x 20 mm', () => {
    const frame = wallFrame({ width: 100, height: 50 });
    const box = rect(95, 10, 110, 30);
    const totalOverlap = frame.reduce((sum, polygon) => sum + overlapArea(polygon, box), 0);
    expect(totalOverlap).toBeCloseTo(200, 6);
  });
});
