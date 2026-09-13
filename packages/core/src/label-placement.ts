/**
 * Hold label placement.
 *
 * Each label starts from its hold's insert and is pushed outward: first along
 * the direction the asset designer drew (insert → Inkscape anchor), then along
 * a fan of directions around it, until it clears its own hold, the other holds
 * and the labels already placed. Pure geometry in wall coordinates (mm, SVG
 * y-down): no SVG, no assets.
 */

import type { Point } from './types.js';
import { AREA_EPSILON, aabb, aabbIntersects, overlapArea, type Aabb } from './polygon-clip.js';

/** Estimated glyph advance, in em: core cannot measure a font */
export const LABEL_GLYPH_WIDTH_EM = 0.65;
/** Clearance around a label box during collision tests, in em */
export const LABEL_MARGIN_EM = 0.15;
/** Distance between two candidate positions along a direction, in mm */
export const LABEL_STEP_MM = 5;
/** How far past its lift-off a label may travel along one direction, in em */
export const LABEL_WINDOW_EM = 2;
/** Angle between two fan directions, in degrees */
export const LABEL_FAN_STEP_DEG = 22.5;

const FALLBACK_TOLERANCE = 1.05;
const FALLBACK_SLACK_MM2 = 1;
const DIRECTION_EPSILON_MM = 1;
const BOX_CORNERS: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

/** A label to place, in wall coordinates */
export interface LabelRequest {
  /** Index of the hold in the composed hold list */
  holdIndex: number;
  /** Displayed text */
  text: string;
  /** The hold's own outline */
  ownOutline: Point[][];
  /** Inkscape anchor: only gives the push direction from the insert */
  anchor: Point;
  /** Insert of the hold: origin of every direction */
  insert: Point;
  /** Label angle θ in SVG degrees (zone angle − hold rotation) */
  angle: number;
}

/** Where a label ended up */
export interface LabelPlacement {
  holdIndex: number;
  text: string;
  center: Point;
  angle: number;
  /** Label box, without the collision margin */
  width: number;
  height: number;
  /** 'ray' for the drawn direction, else the fan deviation in degrees */
  direction: 'ray' | number;
  /** Distance from the insert to the label centre, in mm */
  d: number;
  /** Lift-off distance in the chosen direction, in mm */
  d0: number;
  /** No free position existed: least overlap was kept */
  fallback: boolean;
  /** Overlap with its own hold, margin included (mm²) — always ≤ 1e-6 */
  ownOverlap: number;
  /** Overlap with other holds and labels, margin included (mm²) */
  otherOverlap: number;
}

interface Obstacle {
  polygons: Point[][];
  box: Aabb;
}

interface Candidate {
  center: Point;
  direction: 'ray' | number;
  d: number;
  d0: number;
  polygon: Point[];
  box: Aabb;
  ownOverlap: number;
  overlap: number;
}

/**
 * Corners of a width × height box centred on `center`, rotated by `angle` SVG
 * degrees: C + [[cos, −sin], [sin, cos]] · (±w/2, ±h/2).
 */
export function labelBox(center: Point, width: number, height: number, angle: number): Point[] {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return BOX_CORNERS.map(([sx, sy]) => {
    const dx = (sx * width) / 2;
    const dy = (sy * height) / 2;
    return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
  });
}

/**
 * Fan deviations in degrees, closest to the drawn direction first:
 * 0, +22.5, −22.5, … , +157.5, −157.5, 180.
 */
export function fanDeviations(): number[] {
  const deviations = [0];
  for (let step = LABEL_FAN_STEP_DEG; step < 180; step += LABEL_FAN_STEP_DEG) {
    deviations.push(step, -step);
  }
  deviations.push(180);
  return deviations;
}

/**
 * First candidate whose overlap is within 5 % (+1 mm²) of the smallest: exact
 * ties never happen between float areas, and a negligible gain is not worth
 * drifting away from the hold.
 */
export function selectFallbackCandidate<T extends { overlap: number }>(candidates: T[]): T {
  const smallest = Math.min(...candidates.map((candidate) => candidate.overlap));
  const selected = candidates.find(
    (candidate) => candidate.overlap <= FALLBACK_TOLERANCE * smallest + FALLBACK_SLACK_MM2
  );
  if (selected === undefined) {
    throw new Error('No label candidate to fall back on');
  }
  return selected;
}

function rotateVector(vector: Point, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { x: vector.x * cos - vector.y * sin, y: vector.x * sin + vector.y * cos };
}

/** Unit vector from the insert toward the anchor; straight down when they meet */
function rayDirection(request: LabelRequest): Point {
  const dx = request.anchor.x - request.insert.x;
  const dy = request.anchor.y - request.insert.y;
  const length = Math.hypot(dx, dy);
  return length < DIRECTION_EPSILON_MM ? { x: 0, y: 1 } : { x: dx / length, y: dy / length };
}

function overlapWith(polygon: Point[], box: Aabb, obstacle: Obstacle): number {
  if (!aabbIntersects(box, obstacle.box)) return 0;
  return obstacle.polygons.reduce((sum, shape) => sum + overlapArea(shape, polygon), 0);
}

/**
 * First distance on the 5 mm grid where the test box clears its own hold.
 * Past the farthest outline vertex plus half the box diagonal nothing can
 * intersect, so reaching that bound is an internal error, never a font size.
 */
function liftOff(request: LabelRequest, own: Obstacle, testBox: (d: number) => Point[], halfDiagonal: number): number {
  const reach = Math.max(
    0,
    ...request.ownOutline.flat().map((p) => Math.hypot(p.x - request.insert.x, p.y - request.insert.y))
  );
  const limit = reach + halfDiagonal + LABEL_STEP_MM;
  for (let d = 0; d <= limit; d += LABEL_STEP_MM) {
    const polygon = testBox(d);
    if (overlapWith(polygon, aabb(polygon), own) <= AREA_EPSILON) return d;
  }
  throw new Error(`Label "${request.text}" could not clear its own hold`);
}

function toPlacement(
  request: LabelRequest,
  candidate: Candidate,
  width: number,
  height: number,
  fallback: boolean
): LabelPlacement {
  return {
    holdIndex: request.holdIndex,
    text: request.text,
    center: candidate.center,
    angle: request.angle,
    width,
    height,
    direction: candidate.direction,
    d: candidate.d,
    d0: candidate.d0,
    fallback,
    ownOverlap: candidate.ownOverlap,
    otherOverlap: candidate.overlap,
  };
}

function placeLabel(request: LabelRequest, fontSize: number, obstacles: Obstacle[]): LabelPlacement {
  const width = [...request.text].length * LABEL_GLYPH_WIDTH_EM * fontSize;
  const height = fontSize;
  const margin = LABEL_MARGIN_EM * fontSize;
  const testWidth = width + 2 * margin;
  const testHeight = height + 2 * margin;
  const own: Obstacle = { polygons: request.ownOutline, box: aabb(request.ownOutline.flat()) };
  const ray = rayDirection(request);
  const candidates: Candidate[] = [];

  for (const deviation of fanDeviations()) {
    const direction = rotateVector(ray, deviation);
    const at = (d: number): Point => ({
      x: request.insert.x + d * direction.x,
      y: request.insert.y + d * direction.y,
    });
    const testBox = (d: number): Point[] => labelBox(at(d), testWidth, testHeight, request.angle);
    const d0 = liftOff(request, own, testBox, Math.hypot(testWidth, testHeight) / 2);

    for (let d = d0; d <= d0 + LABEL_WINDOW_EM * fontSize + 1e-9; d += LABEL_STEP_MM) {
      const polygon = testBox(d);
      const box = aabb(polygon);
      // Re-tested at every step: an arm of a concave hold can cross the ray again
      const ownOverlap = overlapWith(polygon, box, own);
      if (ownOverlap > AREA_EPSILON) continue;

      const candidate: Candidate = {
        center: at(d),
        direction: deviation === 0 ? 'ray' : deviation,
        d,
        d0,
        polygon,
        box,
        ownOverlap,
        overlap: 0,
      };
      if (!obstacles.some((obstacle) => overlapWith(polygon, box, obstacle) > AREA_EPSILON)) {
        return toPlacement(request, candidate, width, height, false);
      }
      candidates.push(candidate);
    }
  }

  for (const candidate of candidates) {
    candidate.overlap = obstacles.reduce(
      (sum, obstacle) => sum + overlapWith(candidate.polygon, candidate.box, obstacle),
      0
    );
  }
  return toPlacement(request, selectFallbackCandidate(candidates), width, height, true);
}

/**
 * Place hold labels, top of the wall first (then left to right, then by hold
 * index), so the result does not depend on the order of the sections.
 * @param requests - Labels to place (holds with an empty text are left out)
 * @param outlines - Outlines of every hold, indexed by holdIndex
 * @param fontSize - Label font size, in mm
 * @returns Placements, in the order of `requests`
 */
export function placeHoldLabels(requests: LabelRequest[], outlines: Point[][][], fontSize: number): LabelPlacement[] {
  const holdObstacles = outlines.map((polygons, index) => ({ index, polygons, box: aabb(polygons.flat()) }));
  const labelObstacles: Obstacle[] = [];
  const order = requests
    .map((_, index) => index)
    .sort((a, b) =>
      requests[a].insert.y - requests[b].insert.y
      || requests[a].insert.x - requests[b].insert.x
      || requests[a].holdIndex - requests[b].holdIndex
    );

  const placements = new Array<LabelPlacement>(requests.length);
  for (const index of order) {
    const request = requests[index];
    const obstacles: Obstacle[] = [
      ...holdObstacles.filter((obstacle) => obstacle.index !== request.holdIndex),
      ...labelObstacles,
    ];
    const placement = placeLabel(request, fontSize, obstacles);
    placements[index] = placement;
    const polygon = labelBox(placement.center, placement.width, placement.height, placement.angle);
    labelObstacles.push({ polygons: [polygon], box: aabb(polygon) });
  }
  return placements;
}
