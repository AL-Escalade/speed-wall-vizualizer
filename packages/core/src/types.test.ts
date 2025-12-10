import { describe, it, expect } from 'vitest';
import {
  COLUMN_SYSTEMS,
  CANONICAL_COLUMN_SYSTEM,
  DEFAULT_COLUMN_SYSTEM,
} from './types.js';

describe('COLUMN_SYSTEMS', () => {
  it('should define ABC system with 11 columns', () => {
    expect(COLUMN_SYSTEMS.ABC).toBe('ABCDEFGHIJK');
    expect(COLUMN_SYSTEMS.ABC.length).toBe(11);
  });

  it('should define FFME system with 11 columns (no J)', () => {
    expect(COLUMN_SYSTEMS.FFME).toBe('ABCDEFGHIKL');
    expect(COLUMN_SYSTEMS.FFME.length).toBe(11);
    expect(COLUMN_SYSTEMS.FFME).not.toContain('J');
  });

  it('should define IFSC system with 11 columns (no J/K)', () => {
    expect(COLUMN_SYSTEMS.IFSC).toBe('ABCDEFGHILM');
    expect(COLUMN_SYSTEMS.IFSC.length).toBe(11);
    expect(COLUMN_SYSTEMS.IFSC).not.toContain('J');
    expect(COLUMN_SYSTEMS.IFSC).not.toContain('K');
  });
});

describe('CANONICAL_COLUMN_SYSTEM', () => {
  it('should be ABC system', () => {
    expect(CANONICAL_COLUMN_SYSTEM).toBe(COLUMN_SYSTEMS.ABC);
  });
});

describe('DEFAULT_COLUMN_SYSTEM', () => {
  it('should be FFME system for backwards compatibility', () => {
    expect(DEFAULT_COLUMN_SYSTEM).toBe(COLUMN_SYSTEMS.FFME);
  });
});
