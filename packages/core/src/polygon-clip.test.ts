import { describe, it, expect } from 'vitest';
import { aabb, aabbIntersects, clipPolygon, overlapArea, polygonArea, signedArea } from './polygon-clip.js';
import type { Point } from './types.js';

function rect(x: number, y: number, width: number, height: number): Point[] {
  return [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }];
}

/** L-shape: [0,20]×[0,10] ∪ [0,10]×[10,20], area 300 */
const L_SHAPE: Point[] = [
  { x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 10 },
  { x: 10, y: 10 }, { x: 10, y: 20 }, { x: 0, y: 20 },
];

describe('signedArea / polygonArea', () => {
  it('flips the sign with the winding but not the area', () => {
    expect(signedArea(rect(0, 0, 10, 20))).toBe(200);
    expect(signedArea(rect(0, 0, 10, 20).reverse())).toBe(-200);
    expect(polygonArea(rect(0, 0, 10, 20).reverse())).toBe(200);
  });

  it('measures a concave polygon', () => {
    expect(polygonArea(L_SHAPE)).toBe(300);
  });
});

describe('overlapArea', () => {
  it('is zero for disjoint shapes', () => {
    expect(overlapArea(rect(0, 0, 10, 10), rect(20, 20, 10, 10))).toBe(0);
  });

  it('is zero for shapes that only share an edge', () => {
    expect(overlapArea(rect(0, 0, 10, 10), rect(10, 0, 10, 10))).toBeCloseTo(0, 9);
  });

  it('is the inner area when the clip contains nothing but part of the subject', () => {
    expect(overlapArea(rect(0, 0, 100, 100), rect(10, 10, 20, 30))).toBeCloseTo(600);
  });

  it('is half when the clip covers half of the subject', () => {
    expect(overlapArea(rect(0, 0, 10, 10), rect(5, -5, 20, 20))).toBeCloseTo(50);
  });

  it('is exact for a concave subject clipped by a rectangle', () => {
    expect(overlapArea(L_SHAPE, rect(5, 5, 10, 10))).toBeCloseTo(75);
  });

  it('does not depend on the winding of the clip', () => {
    expect(overlapArea(L_SHAPE, rect(5, 5, 10, 10).reverse())).toBeCloseTo(75);
  });
});

describe('clipPolygon', () => {
  it('returns an empty polygon for an empty subject', () => {
    expect(clipPolygon([], rect(0, 0, 1, 1))).toEqual([]);
  });
});

describe('aabb', () => {
  it('bounds the points', () => {
    expect(aabb(rect(1, 2, 3, 4))).toEqual({ minX: 1, minY: 2, maxX: 4, maxY: 6 });
  });

  it('counts touching boxes as intersecting and far ones as not', () => {
    expect(aabbIntersects(aabb(rect(0, 0, 10, 10)), aabb(rect(10, 0, 10, 10)))).toBe(true);
    expect(aabbIntersects(aabb(rect(0, 0, 10, 10)), aabb(rect(11, 0, 10, 10)))).toBe(false);
  });
});
