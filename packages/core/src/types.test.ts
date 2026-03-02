import { describe, it, expect } from 'vitest';
import {
  COLUMN_SYSTEMS,
  CANONICAL_COLUMN_SYSTEM,
  DEFAULT_COLUMN_SYSTEM,
  VIRTUAL_COLUMNS,
  VIRTUAL_ROWS,
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

describe('VIRTUAL_COLUMNS', () => {
  it('should define before-first as A-1', () => {
    expect(VIRTUAL_COLUMNS.BEFORE_FIRST).toBe('A-1');
  });

  it('should define after-last as K+1', () => {
    expect(VIRTUAL_COLUMNS.AFTER_LAST).toBe('K+1');
  });
});

describe('VIRTUAL_ROWS', () => {
  it('should define below-first as 0', () => {
    expect(VIRTUAL_ROWS.BELOW_FIRST).toBe(0);
  });

  it('should define above-last as 11', () => {
    expect(VIRTUAL_ROWS.ABOVE_LAST).toBe(11);
  });
});
