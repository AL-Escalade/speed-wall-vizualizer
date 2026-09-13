import { describe, it, expect } from 'vitest';
import { BEZIER_SEGMENTS, flattenFirstSubpath } from './hold-outline.js';

const SQUARE = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];

describe('flattenFirstSubpath', () => {
  it('reads absolute lines', () => {
    expect(flattenFirstSubpath('M0,0 L10,0 L10,10 L0,10 Z')).toEqual(SQUARE);
  });

  it('reads relative lines and horizontal/vertical shortcuts', () => {
    expect(flattenFirstSubpath('m0,0 l10,0 l0,10 l-10,0 z')).toEqual(SQUARE);
    expect(flattenFirstSubpath('M0 0 h10 v10 h-10 z')).toEqual(SQUARE);
    expect(flattenFirstSubpath('M0 0 H10 V10 H0 Z')).toEqual(SQUARE);
  });

  it('repeats a command over extra parameter sets, as lines after a move', () => {
    expect(flattenFirstSubpath('M 0,0 10,0 10,10 0,10 z')).toEqual(SQUARE);
    expect(flattenFirstSubpath('m 0,0 10,0 0,10 -10,0 z')).toEqual(SQUARE);
  });

  it('cuts each cubic curve into BEZIER_SEGMENTS segments ending on its end point', () => {
    const points = flattenFirstSubpath('M0,0 C0,10 10,10 10,0 10,-10 20,-10 20,0');
    expect(points).toHaveLength(1 + 2 * BEZIER_SEGMENTS);
    expect(points[BEZIER_SEGMENTS]).toEqual({ x: 10, y: 0 });
    expect(points[2 * BEZIER_SEGMENTS]).toEqual({ x: 20, y: 0 });
  });

  it('chains relative cubic curves from the end of the previous one', () => {
    const points = flattenFirstSubpath('m0,0 c0,10 10,10 10,0 0,-10 10,-10 10,0');
    expect(points[BEZIER_SEGMENTS]).toEqual({ x: 10, y: 0 });
    expect(points[2 * BEZIER_SEGMENTS]).toEqual({ x: 20, y: 0 });
  });

  it('reflects the previous control point for a smooth curve', () => {
    const points = flattenFirstSubpath('M0,0 C0,10 10,10 10,0 S20,-10 20,0');
    // Second curve: (10,0) (10,-10) (20,-10) (20,0), at t = 0.5
    expect(points[BEZIER_SEGMENTS + BEZIER_SEGMENTS / 2].x).toBeCloseTo(15, 9);
    expect(points[BEZIER_SEGMENTS + BEZIER_SEGMENTS / 2].y).toBeCloseTo(-7.5, 9);
  });

  it('keeps only the first subpath', () => {
    expect(flattenFirstSubpath('M0,0 L10,0 L10,10 Z M50,50 L60,50')).toHaveLength(3);
    expect(flattenFirstSubpath('M0,0 L10,0 M50,50 L60,50')).toHaveLength(2);
  });

  it('reads exponent numbers', () => {
    expect(flattenFirstSubpath('M0,0 L1e1,0')).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }]);
  });

  it('throws on arcs and quadratic curves', () => {
    expect(() => flattenFirstSubpath('M0,0 A5,5 0 0 1 10,0')).toThrow('Unsupported path command "A"');
    expect(() => flattenFirstSubpath('M0,0 Q5,5 10,0')).toThrow('Unsupported path command "Q"');
  });
});
