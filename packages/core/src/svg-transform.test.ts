import { describe, it, expect } from 'vitest';
import { applyMatrix, matrixRotation, parseTransformList, rotateMatrix } from './svg-transform.js';

function expectPoint(actual: { x: number; y: number }, x: number, y: number): void {
  expect(actual.x).toBeCloseTo(x, 9);
  expect(actual.y).toBeCloseTo(y, 9);
}

describe('parseTransformList', () => {
  it('is the identity for a missing or blank attribute', () => {
    expectPoint(applyMatrix(parseTransformList(null), { x: 3, y: 4 }), 3, 4);
    expectPoint(applyMatrix(parseTransformList('  '), { x: 3, y: 4 }), 3, 4);
  });

  it('reads translate with one or two values', () => {
    expectPoint(applyMatrix(parseTransformList('translate(30, 40)'), { x: 1, y: 1 }), 31, 41);
    expectPoint(applyMatrix(parseTransformList('translate(5)'), { x: 1, y: 1 }), 6, 1);
  });

  it('reads rotate the SVG way (x axis onto y axis for 90°)', () => {
    expectPoint(applyMatrix(parseTransformList('rotate(90)'), { x: 1, y: 0 }), 0, 1);
  });

  it('reads rotate around a centre', () => {
    const m = parseTransformList('rotate(90, 10, 10)');
    expectPoint(applyMatrix(m, { x: 10, y: 10 }), 10, 10);
    expectPoint(applyMatrix(m, { x: 20, y: 10 }), 10, 20);
  });

  it('reads scale(-1) as a half turn', () => {
    const m = parseTransformList('scale(-1)');
    expectPoint(applyMatrix(m, { x: 1, y: 2 }), -1, -2);
    expect(matrixRotation(m)).toBeCloseTo(180, 9);
  });

  it('reads matrix()', () => {
    expectPoint(applyMatrix(parseTransformList('matrix(1,0,0,1,5,6)'), { x: 1, y: 1 }), 6, 7);
  });

  it('composes a list left to right (the rightmost applies first)', () => {
    expectPoint(applyMatrix(parseTransformList('translate(10, 0) rotate(90)'), { x: 1, y: 0 }), 10, 1);
  });

  it('throws on a function it cannot represent', () => {
    expect(() => parseTransformList('skewX(10)')).toThrow('Unsupported transform "skewX(10)"');
  });

  it('throws on trailing garbage', () => {
    expect(() => parseTransformList('rotate(45) junk')).toThrow('Unsupported transform');
  });
});

describe('matrixRotation', () => {
  it('returns the rotation angle in degrees', () => {
    expect(matrixRotation(rotateMatrix(45))).toBeCloseTo(45, 9);
  });
});
