import { describe, it, expect } from 'vitest';
import {
  fanDeviations,
  labelBox,
  placeHoldLabels,
  selectFallbackCandidate,
  type LabelRequest,
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
});

describe('labelBox', () => {
  it('rotates the box around its centre', () => {
    const corners = labelBox({ x: 10, y: 10 }, 20, 10, 90);
    expect(corners[0].x).toBeCloseTo(15, 9);
    expect(corners[0].y).toBeCloseTo(0, 9);
  });
});
