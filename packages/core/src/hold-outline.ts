/**
 * Hold outlines: SVG path data flattened to polygons.
 *
 * Label placement tests label boxes against the real hold shape, so the
 * Bézier curves of the "prise" path are cut into straight segments.
 */

import type { Point } from './types.js';

/** Straight segments per cubic Bézier curve */
export const BEZIER_SEGMENTS = 8;

const PATH_TOKEN = /[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
const SUPPORTED_COMMANDS = 'MmLlHhVvCcSsZz';

function isCommand(token: string): boolean {
  return /^[a-zA-Z]$/.test(token);
}

function appendCubic(points: Point[], p0: Point, p1: Point, p2: Point, p3: Point): void {
  for (let k = 1; k <= BEZIER_SEGMENTS; k++) {
    const t = k / BEZIER_SEGMENTS;
    const u = 1 - t;
    points.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
}

/**
 * Flatten the first subpath of SVG path data into a polygon.
 *
 * Supports M L H V C S Z, absolute and relative, with implicit repetition
 * (extra parameter sets repeat the command; after M they are lines). Stops at
 * the first Z or at the second M: the first subpath of a compound hold shape is
 * its outer contour, the rule simplifyCompoundPath applies to the rendering.
 * @throws for arcs, quadratic curves or any other command
 */
export function flattenFirstSubpath(d: string): Point[] {
  const tokens = d.match(PATH_TOKEN) ?? [];
  const points: Point[] = [];
  let index = 0;
  let command = '';
  let current: Point = { x: 0, y: 0 };
  let lastControl: Point | null = null;
  let started = false;

  const nextNumber = (): number => {
    const token = tokens[index];
    if (token === undefined || isCommand(token)) {
      throw new Error(`Malformed path data: number expected at token ${index}`);
    }
    index++;
    return Number(token);
  };
  const nextPoint = (origin: Point): Point => {
    const x = nextNumber();
    const y = nextNumber();
    return { x: origin.x + x, y: origin.y + y };
  };

  while (index < tokens.length) {
    if (isCommand(tokens[index])) {
      command = tokens[index];
      index++;
      if (!SUPPORTED_COMMANDS.includes(command)) {
        throw new Error(`Unsupported path command "${command}"`);
      }
    } else if (command === '') {
      throw new Error('Malformed path data: it must start with a command');
    }

    const relative = command === command.toLowerCase();
    const origin: Point = relative ? current : { x: 0, y: 0 };

    switch (command.toUpperCase()) {
      case 'M': {
        if (started) return points;
        current = nextPoint(origin);
        points.push(current);
        started = true;
        lastControl = null;
        command = relative ? 'l' : 'L';
        break;
      }
      case 'L': {
        current = nextPoint(origin);
        points.push(current);
        lastControl = null;
        break;
      }
      case 'H': {
        current = { x: (relative ? current.x : 0) + nextNumber(), y: current.y };
        points.push(current);
        lastControl = null;
        break;
      }
      case 'V': {
        current = { x: current.x, y: (relative ? current.y : 0) + nextNumber() };
        points.push(current);
        lastControl = null;
        break;
      }
      case 'C': {
        const p1 = nextPoint(origin);
        const p2 = nextPoint(origin);
        const p3 = nextPoint(origin);
        appendCubic(points, current, p1, p2, p3);
        lastControl = p2;
        current = p3;
        break;
      }
      case 'S': {
        const p1: Point = lastControl === null
          ? current
          : { x: 2 * current.x - lastControl.x, y: 2 * current.y - lastControl.y };
        const p2 = nextPoint(origin);
        const p3 = nextPoint(origin);
        appendCubic(points, current, p1, p2, p3);
        lastControl = p2;
        current = p3;
        break;
      }
      default:
        // Z: the first subpath is closed
        return points;
    }
  }
  return points;
}
