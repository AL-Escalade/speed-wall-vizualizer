import { describe, it, expect } from 'vitest';
import { calculateAngle, calculateHoldRotation, calculateRotation } from './rotation.js';

describe('calculateAngle', () => {
  it('should return 0 for pointing right', () => {
    const angle = calculateAngle({ x: 0, y: 0 }, { x: 100, y: 0 });
    expect(angle).toBe(0);
  });

  it('should return 90 for pointing up', () => {
    const angle = calculateAngle({ x: 0, y: 0 }, { x: 0, y: 100 });
    expect(angle).toBe(90);
  });

  it('should return 180 for pointing left', () => {
    const angle = calculateAngle({ x: 0, y: 0 }, { x: -100, y: 0 });
    expect(angle).toBe(180);
  });

  it('should return 270 for pointing down', () => {
    const angle = calculateAngle({ x: 0, y: 0 }, { x: 0, y: -100 });
    expect(angle).toBe(270);
  });

  it('should handle diagonal angles', () => {
    const angle = calculateAngle({ x: 0, y: 0 }, { x: 100, y: 100 });
    expect(angle).toBe(45);
  });

  it('should normalize negative angles', () => {
    const angle = calculateAngle({ x: 0, y: 0 }, { x: 100, y: -100 });
    expect(angle).toBe(315);
  });

  it('should return 0 for coincident points', () => {
    // When from and to are the same point, atan2(0, 0) returns 0
    const angle = calculateAngle({ x: 50, y: 50 }, { x: 50, y: 50 });
    expect(angle).toBe(0);
  });
});

describe('calculateHoldRotation', () => {
  it('should calculate rotation for same panel pointing right', () => {
    const rotation = calculateHoldRotation(
      { side: 'SN', number: 1 },
      { column: 'A', row: 1 },
      { side: 'SN', number: 1 },
      { column: 'B', row: 1 },
      'BIG'
    );
    // BIG default is 270°, target is 0° (pointing right), so rotation = 0 - 270 = -270 → normalized to 90
    expect(rotation).toBe(90);
  });

  it('should calculate rotation for orientation pointing up', () => {
    const rotation = calculateHoldRotation(
      { side: 'SN', number: 1 },
      { column: 'A', row: 1 },
      { side: 'SN', number: 1 },
      { column: 'A', row: 2 },
      'BIG'
    );
    // BIG default is 270°, target is 90° (pointing up), so rotation = 90 - 270 = -180
    expect(rotation).toBe(-180);
  });

  it('should handle cross-panel orientation', () => {
    const rotation = calculateHoldRotation(
      { side: 'SN', number: 1 },
      { column: 'A', row: 1 },
      { side: 'DX', number: 1 },
      { column: 'A', row: 1 },
      'BIG'
    );
    // Orientation is to the right (DX panel), so target angle is 0°
    // BIG default is 270°, rotation = 0 - 270 = -270 → normalized to 90
    expect(rotation).toBe(90);
  });

  it('should calculate rotation for FOOT hold type', () => {
    const rotation = calculateHoldRotation(
      { side: 'SN', number: 1 },
      { column: 'A', row: 1 },
      { side: 'SN', number: 1 },
      { column: 'B', row: 1 },
      'FOOT'
    );
    // FOOT default is 180°, target is 0° (pointing right), so rotation = 0 - 180 = -180
    expect(rotation).toBe(-180);
  });

  it('should calculate rotation for STOP hold type', () => {
    const rotation = calculateHoldRotation(
      { side: 'SN', number: 1 },
      { column: 'A', row: 1 },
      { side: 'SN', number: 1 },
      { column: 'B', row: 1 },
      'STOP'
    );
    // STOP default is 0°, target is 0° (pointing right), so rotation = 0
    expect(rotation).toBe(0);
  });

  it('should apply laneOffset consistently to both position and orientation', () => {
    // laneOffset shifts both points by the same amount, so relative angle stays the same
    const rotationWithoutOffset = calculateHoldRotation(
      { side: 'SN', number: 1 },
      { column: 'A', row: 1 },
      { side: 'SN', number: 1 },
      { column: 'B', row: 1 },
      'BIG',
      0
    );
    const rotationWithOffset = calculateHoldRotation(
      { side: 'SN', number: 1 },
      { column: 'A', row: 1 },
      { side: 'SN', number: 1 },
      { column: 'B', row: 1 },
      'BIG',
      1
    );
    // Same relative positions = same rotation regardless of lane offset
    expect(rotationWithOffset).toBe(rotationWithoutOffset);
  });
});

describe('calculateRotation', () => {
  it('should be a shortcut for same-panel rotation', () => {
    const panel = { side: 'SN' as const, number: 1 as const };
    const position = { column: 'A' as const, row: 1 as const };
    const orientation = { column: 'B' as const, row: 2 as const };

    const fullResult = calculateHoldRotation(panel, position, panel, orientation, 'BIG');
    const shortResult = calculateRotation(panel, position, orientation, 'BIG');

    expect(shortResult).toBe(fullResult);
  });
});
