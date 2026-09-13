/**
 * Polygon clipping and area helpers for label collision tests.
 *
 * One primitive answers both questions label placement asks: "do these shapes
 * touch?" (overlap above AREA_EPSILON) and "how much do they overlap?".
 */

import type { Point } from './types.js';

/** Overlap areas at or below this value (mm²) count as "no intersection" */
export const AREA_EPSILON = 1e-6;

/** Axis-aligned bounding box */
export interface Aabb {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Signed area of a polygon (shoelace formula); the sign gives the winding.
 */
export function signedArea(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

/**
 * Area of a polygon, whatever its winding.
 */
export function polygonArea(points: Point[]): number {
  return Math.abs(signedArea(points));
}

/** Cross product of (b - a) and (p - a): positive when p is left of a→b */
function cross(a: Point, b: Point, p: Point): number {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

/** Intersection of segment s→e with the infinite line through a and b */
function intersect(s: Point, e: Point, a: Point, b: Point): Point {
  const ex = b.x - a.x;
  const ey = b.y - a.y;
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const t = (ex * (a.y - s.y) - ey * (a.x - s.x)) / (ex * dy - ey * dx);
  return { x: s.x + t * dx, y: s.y + t * dy };
}

/**
 * Sutherland–Hodgman: the part of `subject` inside `convexClip`.
 *
 * The subject may be concave (a BIG hold is); the clip must be convex (a label
 * box is). The clip winding does not matter. A concave subject can produce
 * degenerate zero-area edges, which leave the area exact.
 */
export function clipPolygon(subject: Point[], convexClip: Point[]): Point[] {
  const clip = signedArea(convexClip) < 0 ? [...convexClip].reverse() : convexClip;
  let output = subject;
  for (let i = 0; i < clip.length && output.length > 0; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const input = output;
    output = [];
    let previous = input[input.length - 1];
    for (const current of input) {
      const currentInside = cross(a, b, current) >= 0;
      const previousInside = cross(a, b, previous) >= 0;
      if (currentInside) {
        if (!previousInside) output.push(intersect(previous, current, a, b));
        output.push(current);
      } else if (previousInside) {
        output.push(intersect(previous, current, a, b));
      }
      previous = current;
    }
  }
  return output;
}

/**
 * Area of the part of `subject` inside `convexClip`.
 */
export function overlapArea(subject: Point[], convexClip: Point[]): number {
  return polygonArea(clipPolygon(subject, convexClip));
}

/**
 * Axis-aligned bounding box of a set of points.
 */
export function aabb(points: Point[]): Aabb {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Whether two boxes intersect; touching counts, so the prefilter never drops a
 * shape the exact test would keep.
 */
export function aabbIntersects(a: Aabb, b: Aabb): boolean {
  return a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY;
}
