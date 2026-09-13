/**
 * SVG transform attributes as affine matrices.
 *
 * Reads the transform lists Inkscape writes on hold assets. Any form outside
 * the supported set throws: outlines and label anchors are computed from these
 * matrices, so a silently ignored transform would misplace every label.
 */

import type { Point } from './types.js';

/** Affine matrix [a, b, c, d, e, f], as in SVG's matrix(a,b,c,d,e,f) */
export type Matrix = [number, number, number, number, number, number];

export const IDENTITY_MATRIX: Matrix = [1, 0, 0, 1, 0, 0];

export function translateMatrix(x: number, y: number): Matrix {
  return [1, 0, 0, 1, x, y];
}

/** Rotation in SVG degrees (clockwise on screen, y axis pointing down) */
export function rotateMatrix(degrees: number): Matrix {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [cos, sin, -sin, cos, 0, 0];
}

export function scaleMatrix(sx: number, sy: number = sx): Matrix {
  return [sx, 0, 0, sy, 0, 0];
}

/**
 * m1 · m2: applies m2 first, then m1 — the order of an SVG transform list.
 */
export function multiplyMatrices(m1: Matrix, m2: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

export function applyMatrix(m: Matrix, p: Point): Point {
  const [a, b, c, d, e, f] = m;
  return { x: a * p.x + c * p.y + e, y: b * p.x + d * p.y + f };
}

/**
 * Rotation carried by a matrix, in SVG degrees.
 */
export function matrixRotation(m: Matrix): number {
  return (Math.atan2(m[1], m[0]) * 180) / Math.PI;
}

const TRANSFORM_FUNCTION = /([a-zA-Z]+)\s*\(([^)]*)\)/g;

function transformFunctionMatrix(name: string, args: number[], source: string): Matrix {
  if (name === 'matrix' && args.length === 6) {
    return [args[0], args[1], args[2], args[3], args[4], args[5]];
  }
  if (name === 'translate' && (args.length === 1 || args.length === 2)) {
    return translateMatrix(args[0], args[1] ?? 0);
  }
  if (name === 'rotate' && args.length === 1) {
    return rotateMatrix(args[0]);
  }
  if (name === 'rotate' && args.length === 3) {
    const [angle, cx, cy] = args;
    return multiplyMatrices(multiplyMatrices(translateMatrix(cx, cy), rotateMatrix(angle)), translateMatrix(-cx, -cy));
  }
  if (name === 'scale' && (args.length === 1 || args.length === 2)) {
    return scaleMatrix(args[0], args[1] ?? args[0]);
  }
  throw new Error(`Unsupported transform "${source}"`);
}

/**
 * Parse an SVG transform attribute into one matrix.
 * Supports matrix, translate, rotate(a[, cx, cy]) and scale(sx[, sy]),
 * composed left to right.
 * @throws for any other function (skewX, skewY) or a malformed list
 */
export function parseTransformList(transform: string | null): Matrix {
  if (transform === null || transform.trim() === '') return IDENTITY_MATRIX;

  let matrix = IDENTITY_MATRIX;
  for (const match of transform.matchAll(TRANSFORM_FUNCTION)) {
    const rawArgs = match[2].trim();
    const args = rawArgs === '' ? [] : rawArgs.split(/[\s,]+/).map(Number);
    if (args.some((value) => Number.isNaN(value))) {
      throw new Error(`Unsupported transform "${transform}"`);
    }
    matrix = multiplyMatrices(matrix, transformFunctionMatrix(match[1], args, transform));
  }

  const leftover = transform.replace(TRANSFORM_FUNCTION, '').replace(/[\s,]/g, '');
  if (leftover !== '') {
    throw new Error(`Unsupported transform "${transform}"`);
  }
  return matrix;
}
