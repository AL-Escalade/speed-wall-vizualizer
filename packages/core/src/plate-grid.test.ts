import { describe, it, expect } from 'vitest';
import {
  GRID,
  PANEL,
  COLUMNS,
  ROWS,
  getColumnIndex,
  getColumnLetter,
  convertColumn,
  getColumnsForSystem,
  validateColumn,
  getLaneOffsetByIndex,
  getColumnX,
  getRowY,
  getInsertPosition,
  getWallDimensions,
  parsePanelId,
  parseInsertPosition,
  formatPanelId,
  formatInsertPosition,
  getAnchorColumnIndex,
  getAnchorMmPosition,
} from './plate-grid.js';
import { COLUMN_SYSTEMS, CANONICAL_COLUMN_SYSTEM } from './types.js';

describe('plate-grid constants', () => {
  it('should have correct grid spacing', () => {
    expect(GRID.COLUMN_SPACING).toBe(125);
    expect(GRID.ROW_SPACING).toBe(125);
    expect(GRID.COLUMNS_PER_PANEL).toBe(11);
    expect(GRID.ROWS_PER_PANEL).toBe(10);
  });

  it('should calculate panel dimensions correctly', () => {
    // Panel width: (11 - 1) * 125 + 2 * 125 = 1500mm
    expect(PANEL.WIDTH).toBe(1500);
    // Panel height: (10 - 1) * 125 + 2 * 187.5 = 1500mm
    expect(PANEL.HEIGHT).toBe(1500);
  });

  it('should have 11 columns in canonical system', () => {
    expect(COLUMNS).toHaveLength(11);
    expect(COLUMNS[0]).toBe('A');
    expect(COLUMNS[10]).toBe('K');
  });

  it('should have 10 rows', () => {
    expect(ROWS).toHaveLength(10);
    expect(ROWS[0]).toBe(1);
    expect(ROWS[9]).toBe(10);
  });
});

describe('getColumnIndex', () => {
  it('should return correct index for ABC system', () => {
    expect(getColumnIndex('A', COLUMN_SYSTEMS.ABC)).toBe(0);
    expect(getColumnIndex('F', COLUMN_SYSTEMS.ABC)).toBe(5);
    expect(getColumnIndex('K', COLUMN_SYSTEMS.ABC)).toBe(10);
  });

  it('should return correct index for FFME system', () => {
    expect(getColumnIndex('A', COLUMN_SYSTEMS.FFME)).toBe(0);
    expect(getColumnIndex('K', COLUMN_SYSTEMS.FFME)).toBe(9);
    expect(getColumnIndex('L', COLUMN_SYSTEMS.FFME)).toBe(10);
  });

  it('should throw for invalid column', () => {
    expect(() => getColumnIndex('J', COLUMN_SYSTEMS.FFME)).toThrow('Invalid column "J"');
    expect(() => getColumnIndex('L', COLUMN_SYSTEMS.ABC)).toThrow('Invalid column "L"');
  });
});

describe('getColumnLetter', () => {
  it('should return correct letter for index', () => {
    expect(getColumnLetter(0, COLUMN_SYSTEMS.ABC)).toBe('A');
    expect(getColumnLetter(5, COLUMN_SYSTEMS.ABC)).toBe('F');
    expect(getColumnLetter(10, COLUMN_SYSTEMS.ABC)).toBe('K');
  });

  it('should throw for out of range index', () => {
    expect(() => getColumnLetter(-1, COLUMN_SYSTEMS.ABC)).toThrow('out of range');
    expect(() => getColumnLetter(11, COLUMN_SYSTEMS.ABC)).toThrow('out of range');
  });
});

describe('convertColumn', () => {
  it('should convert from FFME to ABC', () => {
    expect(convertColumn('A', COLUMN_SYSTEMS.FFME, COLUMN_SYSTEMS.ABC)).toBe('A');
    expect(convertColumn('K', COLUMN_SYSTEMS.FFME, COLUMN_SYSTEMS.ABC)).toBe('J');
    expect(convertColumn('L', COLUMN_SYSTEMS.FFME, COLUMN_SYSTEMS.ABC)).toBe('K');
  });

  it('should convert from ABC to FFME', () => {
    expect(convertColumn('A', COLUMN_SYSTEMS.ABC, COLUMN_SYSTEMS.FFME)).toBe('A');
    expect(convertColumn('J', COLUMN_SYSTEMS.ABC, COLUMN_SYSTEMS.FFME)).toBe('K');
    expect(convertColumn('K', COLUMN_SYSTEMS.ABC, COLUMN_SYSTEMS.FFME)).toBe('L');
  });

  it('should return same letter when systems are identical', () => {
    expect(convertColumn('F', COLUMN_SYSTEMS.ABC, COLUMN_SYSTEMS.ABC)).toBe('F');
  });
});

describe('getColumnsForSystem', () => {
  it('should return all columns for ABC system', () => {
    const columns = getColumnsForSystem(COLUMN_SYSTEMS.ABC);
    expect(columns).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']);
  });

  it('should return all columns for FFME system', () => {
    const columns = getColumnsForSystem(COLUMN_SYSTEMS.FFME);
    expect(columns).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L']);
  });
});

describe('validateColumn', () => {
  it('should return true for valid column', () => {
    expect(validateColumn('A', COLUMN_SYSTEMS.ABC)).toBe(true);
    expect(validateColumn('K', COLUMN_SYSTEMS.ABC)).toBe(true);
  });

  it('should throw for invalid column', () => {
    expect(() => validateColumn('L', COLUMN_SYSTEMS.ABC)).toThrow('Invalid column "L"');
    expect(() => validateColumn('J', COLUMN_SYSTEMS.FFME)).toThrow('Invalid column "J"');
  });
});

describe('getLaneOffsetByIndex', () => {
  it('should return 0 for first lane', () => {
    expect(getLaneOffsetByIndex(0)).toBe(0);
  });

  it('should return correct offset for second lane', () => {
    // Lane 1 offset = 1 * 2 * 1500 = 3000mm
    expect(getLaneOffsetByIndex(1)).toBe(3000);
  });
});

describe('getColumnX', () => {
  it('should calculate X position for column A on SN panel', () => {
    // X = 0 (lane) + 0 (SN panel) + 125 (margin) + 0 * 125 = 125
    expect(getColumnX('A', 'SN', 0)).toBe(125);
  });

  it('should calculate X position for column A on DX panel', () => {
    // X = 0 (lane) + 1500 (DX panel) + 125 (margin) + 0 * 125 = 1625
    expect(getColumnX('A', 'DX', 0)).toBe(1625);
  });

  it('should calculate X position for column F on SN panel', () => {
    // X = 0 (lane) + 0 (SN panel) + 125 (margin) + 5 * 125 = 750
    expect(getColumnX('F', 'SN', 0)).toBe(750);
  });

  it('should apply lane offset', () => {
    const baseX = getColumnX('A', 'SN', 0);
    const offsetX = getColumnX('A', 'SN', 1);
    expect(offsetX - baseX).toBe(3000);
  });
});

describe('getRowY', () => {
  it('should calculate Y position for row 1 on panel 1', () => {
    // Y = 0 (panel) + 187.5 (margin) + 0 * 125 = 187.5
    expect(getRowY(1, 1)).toBe(187.5);
  });

  it('should calculate Y position for row 10 on panel 1', () => {
    // Y = 0 (panel) + 187.5 (margin) + 9 * 125 = 1312.5
    expect(getRowY(10, 1)).toBe(1312.5);
  });

  it('should calculate Y position for row 1 on panel 2', () => {
    // Y = 1500 (panel) + 187.5 (margin) + 0 * 125 = 1687.5
    expect(getRowY(1, 2)).toBe(1687.5);
  });
});

describe('getInsertPosition', () => {
  it('should return correct absolute position', () => {
    const pos = getInsertPosition({ side: 'SN', number: 1 }, { column: 'A', row: 1 }, 0);
    expect(pos.x).toBe(125);
    expect(pos.y).toBe(187.5);
  });

  it('should handle lane offset', () => {
    const pos = getInsertPosition({ side: 'SN', number: 1 }, { column: 'A', row: 1 }, 1);
    expect(pos.x).toBe(3125); // 3000 + 125
  });
});

describe('getWallDimensions', () => {
  it('should return default wall dimensions', () => {
    const dims = getWallDimensions();
    expect(dims.width).toBe(6000); // 2 lanes * 2 panels * 1500
    expect(dims.height).toBe(15000); // 10 panels * 1500
  });

  it('should handle custom lane count', () => {
    const dims = getWallDimensions(4, 10);
    expect(dims.width).toBe(12000); // 4 lanes * 2 panels * 1500
  });

  it('should handle custom panel height', () => {
    const dims = getWallDimensions(2, 5);
    expect(dims.height).toBe(7500); // 5 panels * 1500
  });
});

describe('parsePanelId', () => {
  it('should parse valid panel identifiers', () => {
    expect(parsePanelId('SN1')).toEqual({ side: 'SN', number: 1 });
    expect(parsePanelId('DX10')).toEqual({ side: 'DX', number: 10 });
    expect(parsePanelId('sn5')).toEqual({ side: 'SN', number: 5 }); // case insensitive
  });

  it('should throw for invalid format', () => {
    expect(() => parsePanelId('XX1')).toThrow('Invalid panel identifier');
    expect(() => parsePanelId('SN')).toThrow('Invalid panel identifier');
    expect(() => parsePanelId('1SN')).toThrow('Invalid panel identifier');
  });

  it('should throw for invalid panel number', () => {
    expect(() => parsePanelId('SN0')).toThrow('Panel number must be 1-10');
    expect(() => parsePanelId('SN11')).toThrow('Panel number must be 1-10');
  });
});

describe('parseInsertPosition', () => {
  it('should parse valid positions with default FFME system', () => {
    const pos = parseInsertPosition('F4');
    expect(pos.column).toBe('F'); // F in FFME = F in ABC (same index)
    expect(pos.row).toBe(4);
  });

  it('should convert from FFME to ABC', () => {
    // K in FFME (index 9) = J in ABC (index 9)
    const pos = parseInsertPosition('K4', COLUMN_SYSTEMS.FFME);
    expect(pos.column).toBe('J');
    expect(pos.row).toBe(4);
  });

  it('should handle ABC system without conversion', () => {
    const pos = parseInsertPosition('J4', CANONICAL_COLUMN_SYSTEM);
    expect(pos.column).toBe('J');
    expect(pos.row).toBe(4);
  });

  it('should throw for invalid format', () => {
    expect(() => parseInsertPosition('4F')).toThrow('Invalid insert position format');
    expect(() => parseInsertPosition('FF4')).toThrow('Invalid insert position format');
  });

  it('should throw for invalid row', () => {
    expect(() => parseInsertPosition('F0')).toThrow('Row must be 1-10');
    expect(() => parseInsertPosition('F11')).toThrow('Row must be 1-10');
  });

  it('should throw for invalid column in system', () => {
    expect(() => parseInsertPosition('J4', COLUMN_SYSTEMS.FFME)).toThrow('Invalid column "J"');
  });
});

describe('formatPanelId', () => {
  it('should format panel identifiers', () => {
    expect(formatPanelId({ side: 'SN', number: 1 })).toBe('SN1');
    expect(formatPanelId({ side: 'DX', number: 10 })).toBe('DX10');
  });
});

describe('formatInsertPosition', () => {
  it('should format insert positions', () => {
    expect(formatInsertPosition({ column: 'F', row: 4 })).toBe('F4');
    expect(formatInsertPosition({ column: 'A', row: 10 })).toBe('A10');
  });
});

describe('getAnchorColumnIndex', () => {
  it('should return -1 for virtual column A-1', () => {
    expect(getAnchorColumnIndex('A-1')).toBe(-1);
  });

  it('should return COLUMNS_PER_PANEL for virtual column K+1', () => {
    expect(getAnchorColumnIndex('K+1')).toBe(GRID.COLUMNS_PER_PANEL);
  });

  it('should delegate to getColumnIndex for physical columns', () => {
    expect(getAnchorColumnIndex('A')).toBe(0);
    expect(getAnchorColumnIndex('F')).toBe(5);
    expect(getAnchorColumnIndex('K')).toBe(10);
  });
});

describe('getAnchorMmPosition', () => {
  const snPanel = { side: 'SN' as const, number: 1 as const };
  const dxPanel = { side: 'DX' as const, number: 1 as const };

  it('should match getInsertPosition for physical positions', () => {
    const anchor = getAnchorMmPosition(snPanel, { column: 'F', row: 5 });
    const insert = getInsertPosition(snPanel, { column: 'F', row: 5 });
    expect(anchor.x).toBe(insert.x);
    expect(anchor.y).toBe(insert.y);
  });

  it('should place virtual column A-1 one spacing left of A', () => {
    const atA = getAnchorMmPosition(snPanel, { column: 'A', row: 1 });
    const atVirtual = getAnchorMmPosition(snPanel, { column: 'A-1', row: 1 });
    expect(atA.x - atVirtual.x).toBe(GRID.COLUMN_SPACING);
  });

  it('should place virtual column K+1 one spacing right of K', () => {
    const atK = getAnchorMmPosition(snPanel, { column: 'K', row: 1 });
    const atVirtual = getAnchorMmPosition(snPanel, { column: 'K+1', row: 1 });
    expect(atVirtual.x - atK.x).toBe(GRID.COLUMN_SPACING);
  });

  it('should place virtual row 0 one spacing below row 1', () => {
    const atRow1 = getAnchorMmPosition(snPanel, { column: 'A', row: 1 });
    const atRow0 = getAnchorMmPosition(snPanel, { column: 'A', row: 0 });
    expect(atRow1.y - atRow0.y).toBe(GRID.ROW_SPACING);
  });

  it('should place virtual row 11 one spacing above row 10', () => {
    const atRow10 = getAnchorMmPosition(snPanel, { column: 'A', row: 10 });
    const atRow11 = getAnchorMmPosition(snPanel, { column: 'A', row: 11 });
    expect(atRow11.y - atRow10.y).toBe(GRID.ROW_SPACING);
  });

  it('should handle DX panel offset for virtual columns', () => {
    const snVirtual = getAnchorMmPosition(snPanel, { column: 'K+1', row: 1 });
    const dxVirtual = getAnchorMmPosition(dxPanel, { column: 'K+1', row: 1 });
    expect(dxVirtual.x - snVirtual.x).toBe(PANEL.WIDTH);
  });
});
