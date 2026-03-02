import { describe, it, expect } from 'vitest';
import {
  getAnchorColumnDisplayLabel,
  getAnchorRowDisplayLabel,
  getAnchorColumnOptions,
  ANCHOR_ROW_OPTIONS,
  COORDINATE_SYSTEMS,
} from './routes';

describe('getAnchorColumnDisplayLabel', () => {
  it('should display A-1 as (A-1) in all systems', () => {
    expect(getAnchorColumnDisplayLabel('A-1', COORDINATE_SYSTEMS.ABC)).toBe('(A-1)');
    expect(getAnchorColumnDisplayLabel('A-1', COORDINATE_SYSTEMS.FFME)).toBe('(A-1)');
    expect(getAnchorColumnDisplayLabel('A-1', COORDINATE_SYSTEMS.IFSC)).toBe('(A-1)');
  });

  it('should display K+1 as (K+1) in ABC', () => {
    expect(getAnchorColumnDisplayLabel('K+1', COORDINATE_SYSTEMS.ABC)).toBe('(K+1)');
  });

  it('should display K+1 as (L+1) in FFME', () => {
    expect(getAnchorColumnDisplayLabel('K+1', COORDINATE_SYSTEMS.FFME)).toBe('(L+1)');
  });

  it('should display K+1 as (M+1) in IFSC', () => {
    expect(getAnchorColumnDisplayLabel('K+1', COORDINATE_SYSTEMS.IFSC)).toBe('(M+1)');
  });

  it('should display physical columns normally', () => {
    expect(getAnchorColumnDisplayLabel('F', COORDINATE_SYSTEMS.ABC)).toBe('F');
  });

  it('should convert physical columns between systems', () => {
    // K in ABC → L in FFME
    expect(getAnchorColumnDisplayLabel('K', COORDINATE_SYSTEMS.FFME)).toBe('L');
  });
});

describe('getAnchorRowDisplayLabel', () => {
  it('should display virtual row 0 with parentheses', () => {
    expect(getAnchorRowDisplayLabel(0)).toBe('(0)');
  });

  it('should display virtual row 11 with parentheses', () => {
    expect(getAnchorRowDisplayLabel(11)).toBe('(11)');
  });

  it('should display physical rows without parentheses', () => {
    expect(getAnchorRowDisplayLabel(1)).toBe('1');
    expect(getAnchorRowDisplayLabel(5)).toBe('5');
    expect(getAnchorRowDisplayLabel(10)).toBe('10');
  });
});

describe('getAnchorColumnOptions', () => {
  it('should include virtual columns at edges for ABC', () => {
    const options = getAnchorColumnOptions(COORDINATE_SYSTEMS.ABC);
    expect(options[0]).toBe('A-1');
    expect(options[options.length - 1]).toBe('K+1');
    expect(options.length).toBe(13); // 11 physical + 2 virtual
  });

  it('should include physical columns in order', () => {
    const options = getAnchorColumnOptions(COORDINATE_SYSTEMS.ABC);
    expect(options.slice(1, -1)).toEqual('ABCDEFGHIJK'.split(''));
  });
});

describe('ANCHOR_ROW_OPTIONS', () => {
  it('should include rows 0 through 11', () => {
    expect(ANCHOR_ROW_OPTIONS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});
