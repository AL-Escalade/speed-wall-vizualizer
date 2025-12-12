/**
 * IFSC speed climbing wall grid constants and position calculations
 */

import type { PanelSide, PanelNumber, Column, Row, Point, PanelId, InsertPosition, ColumnSystem } from './types.js';
import { DEFAULT_COLUMN_SYSTEM, CANONICAL_COLUMN_SYSTEM } from './types.js';

/** IFSC grid constants (all dimensions in mm) */
export const GRID = {
  /** Horizontal spacing between columns */
  COLUMN_SPACING: 125,
  /** Vertical spacing between rows */
  ROW_SPACING: 125,
  /** Margin at top and bottom of each panel */
  PANEL_MARGIN_VERTICAL: 187.5,
  /** Margin at left and right of each panel */
  PANEL_MARGIN_HORIZONTAL: 125,
  /** Number of columns per panel (A-L, excluding J) */
  COLUMNS_PER_PANEL: 11,
  /** Number of rows per panel */
  ROWS_PER_PANEL: 10,
} as const;

/** Calculated panel dimensions */
export const PANEL = {
  /** Panel width: (11 columns - 1) × 125mm + 2 margins × 125mm = 1500mm */
  WIDTH: (GRID.COLUMNS_PER_PANEL - 1) * GRID.COLUMN_SPACING + 2 * GRID.PANEL_MARGIN_HORIZONTAL,
  /** Panel height: (10 rows - 1) × 125mm + 2 margins × 187.5mm = 1500mm */
  HEIGHT: (GRID.ROWS_PER_PANEL - 1) * GRID.ROW_SPACING + 2 * GRID.PANEL_MARGIN_VERTICAL,
} as const;

/** Number of physical panels per lane (horizontally) */
export const PANELS_PER_LANE = 2;

/** Column letters in order for canonical ABC system */
export const COLUMNS: Column[] = CANONICAL_COLUMN_SYSTEM.split('') as Column[];

/**
 * Get the column index for a given column letter in a specific coordinate system
 * @param column - Column letter
 * @param columnSystem - Column coordinate system (default: ABC)
 * @returns Column index (0-10)
 * @throws Error if column is not valid for the given system
 */
export function getColumnIndex(column: Column, columnSystem: ColumnSystem = DEFAULT_COLUMN_SYSTEM): number {
  const index = columnSystem.indexOf(column);
  if (index === -1) {
    throw new Error(
      `Invalid column "${column}" for coordinate system "${columnSystem}". ` +
      `Valid columns are: ${columnSystem.split('').join(', ')}`
    );
  }
  return index;
}

/**
 * Get the column letter for a given index in a specific coordinate system
 * @param index - Column index (0-10)
 * @param columnSystem - Column coordinate system (default: ABC)
 * @returns Column letter
 * @throws Error if index is out of range
 */
export function getColumnLetter(index: number, columnSystem: ColumnSystem = DEFAULT_COLUMN_SYSTEM): Column {
  if (index < 0 || index >= columnSystem.length) {
    throw new Error(`Column index ${index} out of range (0-${columnSystem.length - 1})`);
  }
  return columnSystem[index] as Column;
}

/**
 * Convert a column from one coordinate system to another
 * @param column - Column letter in the source system
 * @param fromSystem - Source coordinate system
 * @param toSystem - Target coordinate system
 * @returns Column letter in the target system
 */
export function convertColumn(column: Column, fromSystem: ColumnSystem, toSystem: ColumnSystem): Column {
  const index = getColumnIndex(column, fromSystem);
  return getColumnLetter(index, toSystem);
}

/**
 * Get all column letters for a coordinate system
 * @param columnSystem - Column coordinate system
 * @returns Array of column letters
 */
export function getColumnsForSystem(columnSystem: ColumnSystem = DEFAULT_COLUMN_SYSTEM): Column[] {
  return columnSystem.split('') as Column[];
}

/**
 * Validate that a column is valid for a given coordinate system
 * @param column - Column letter to validate
 * @param columnSystem - Column coordinate system
 * @returns true if valid
 * @throws Error if invalid
 */
export function validateColumn(column: string, columnSystem: ColumnSystem = DEFAULT_COLUMN_SYSTEM): column is Column {
  if (columnSystem.indexOf(column) === -1) {
    throw new Error(
      `Invalid column "${column}" for coordinate system "${columnSystem}". ` +
      `Valid columns are: ${columnSystem.split('').join(', ')}`
    );
  }
  return true;
}

/** Row numbers */
export const ROWS: Row[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Panel numbers */
export const PANEL_NUMBERS: PanelNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Panel sides */
export const PANEL_SIDES: PanelSide[] = ['SN', 'DX'];

/**
 * Get the X offset for a lane index
 * @param laneIndex - Lane index (0 = leftmost lane)
 * @returns X offset in mm
 */
export function getLaneOffsetByIndex(laneIndex: number): number {
  return laneIndex * PANELS_PER_LANE * PANEL.WIDTH;
}

/**
 * Get the absolute X position of a column
 * @param column - Column letter (must be in canonical ABC system)
 * @param panelSide - Panel side (SN=left panel, DX=right panel)
 * @param laneOffset - Lane offset (0 = leftmost lane). Default: 0
 * @returns X position in mm
 */
export function getColumnX(column: Column, panelSide: PanelSide, laneOffset: number = 0): number {
  const laneOffsetMm = getLaneOffsetByIndex(laneOffset);
  const columnIndex = getColumnIndex(column, CANONICAL_COLUMN_SYSTEM);
  // SN = left panel (no offset), DX = right panel (add panel width)
  const panelOffset = panelSide === 'DX' ? PANEL.WIDTH : 0;
  // Add horizontal margin to position column A at the margin offset from panel edge
  return laneOffsetMm + panelOffset + GRID.PANEL_MARGIN_HORIZONTAL + columnIndex * GRID.COLUMN_SPACING;
}

/**
 * Get the absolute Y position of a row within a panel
 * @param row - Row number (1-10, 1 = bottom of panel)
 * @param panelNumber - Panel number (1-10, 1 = bottom)
 * @returns Y position in mm
 */
export function getRowY(row: Row, panelNumber: PanelNumber): number {
  const panelOffset = (panelNumber - 1) * PANEL.HEIGHT;
  const rowOffset = GRID.PANEL_MARGIN_VERTICAL + (row - 1) * GRID.ROW_SPACING;
  return panelOffset + rowOffset;
}

/**
 * Get the absolute position of an insert
 * @param panel - Panel identifier (side = SN/DX, number = height)
 * @param position - Insert position within panel (column must be in ABC system)
 * @param laneOffset - Lane offset (0 = leftmost lane). Default: 0
 * @returns Absolute position in mm
 */
export function getInsertPosition(
  panel: PanelId,
  position: InsertPosition,
  laneOffset: number = 0
): Point {
  return {
    x: getColumnX(position.column, panel.side, laneOffset),
    y: getRowY(position.row, panel.number),
  };
}

/**
 * Get the total wall dimensions
 * @param lanes - Number of lanes
 * @param panelsHeight - Number of panels in height
 * @returns Wall dimensions in mm
 */
export function getWallDimensions(lanes: number = 2, panelsHeight: number = 10): { width: number; height: number } {
  return {
    width: lanes * PANELS_PER_LANE * PANEL.WIDTH,
    height: panelsHeight * PANEL.HEIGHT,
  };
}

/**
 * Parse a panel identifier string (e.g., "DX2", "SN10")
 * @param panelStr - Panel string
 * @returns Parsed panel identifier
 */
export function parsePanelId(panelStr: string): PanelId {
  const match = panelStr.match(/^(SN|DX)(\d+)$/i);
  if (!match) {
    throw new Error(`Invalid panel identifier: ${panelStr}`);
  }
  const side = match[1].toUpperCase() as PanelSide;
  const number = parseInt(match[2], 10) as PanelNumber;
  if (number < 1 || number > 10) {
    throw new Error(`Panel number must be 1-10, got: ${number}`);
  }
  return { side, number };
}

/**
 * Parse an insert position string (e.g., "F4", "A10") and convert to canonical ABC coordinate system
 * @param posStr - Position string
 * @param sourceColumnSystem - Column coordinate system of the input. Default: FFME (for backwards compatibility)
 * @returns Parsed insert position with column converted to canonical ABC system
 */
export function parseInsertPosition(posStr: string, sourceColumnSystem: ColumnSystem = DEFAULT_COLUMN_SYSTEM): InsertPosition {
  const match = posStr.match(/^([A-M])(\d+)$/i);
  if (!match) {
    throw new Error(`Invalid insert position format: "${posStr}". Expected format: <column><row> (e.g., "F4", "A10")`);
  }
  const sourceColumn = match[1].toUpperCase() as Column;
  const row = parseInt(match[2], 10) as Row;

  // Validate column against the source coordinate system
  validateColumn(sourceColumn, sourceColumnSystem);

  // Convert to canonical ABC system for internal representation
  const column = sourceColumnSystem === CANONICAL_COLUMN_SYSTEM
    ? sourceColumn
    : convertColumn(sourceColumn, sourceColumnSystem, CANONICAL_COLUMN_SYSTEM);

  if (row < 1 || row > 10) {
    throw new Error(`Row must be 1-10, got: ${row}`);
  }
  return { column, row };
}

/**
 * Format a panel identifier to string
 * @param panel - Panel identifier
 * @returns Panel string (e.g., "DX2")
 */
export function formatPanelId(panel: PanelId): string {
  return `${panel.side}${panel.number}`;
}

/**
 * Format an insert position to string
 * @param position - Insert position
 * @returns Position string (e.g., "F4")
 */
export function formatInsertPosition(position: InsertPosition): string {
  return `${position.column}${position.row}`;
}
