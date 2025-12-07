/**
 * IFSC speed climbing wall grid constants and position calculations
 */
import type { PanelSide, PanelNumber, Column, Row, Point, PanelId, InsertPosition } from './types.js';
/** IFSC grid constants (all dimensions in mm) */
export declare const GRID: {
    /** Horizontal spacing between columns */
    readonly COLUMN_SPACING: 125;
    /** Vertical spacing between rows */
    readonly ROW_SPACING: 125;
    /** Margin at top and bottom of each panel */
    readonly PANEL_MARGIN_VERTICAL: 187.5;
    /** Margin at left and right of each panel */
    readonly PANEL_MARGIN_HORIZONTAL: 125;
    /** Number of columns per panel (A-L, excluding J) */
    readonly COLUMNS_PER_PANEL: 11;
    /** Number of rows per panel */
    readonly ROWS_PER_PANEL: 10;
};
/** Calculated panel dimensions */
export declare const PANEL: {
    /** Panel width: (11 columns - 1) × 125mm + 2 margins × 125mm = 1500mm */
    readonly WIDTH: number;
    /** Panel height: (10 rows - 1) × 125mm + 2 margins × 187.5mm = 1500mm */
    readonly HEIGHT: number;
};
/** Number of physical panels per lane (horizontally) */
export declare const PANELS_PER_LANE = 2;
/** Column letters in order (excluding J) */
export declare const COLUMNS: Column[];
/** Column letter to index mapping */
export declare const COLUMN_INDEX: Record<Column, number>;
/** Row numbers */
export declare const ROWS: Row[];
/** Panel numbers */
export declare const PANEL_NUMBERS: PanelNumber[];
/** Panel sides */
export declare const PANEL_SIDES: PanelSide[];
/**
 * Get the X offset for a lane index
 * @param laneIndex - Lane index (0 = leftmost lane)
 * @returns X offset in mm
 */
export declare function getLaneOffsetByIndex(laneIndex: number): number;
/**
 * Get the absolute X position of a column
 * @param column - Column letter
 * @param panelSide - Panel side (SN=left panel, DX=right panel)
 * @param laneOffset - Lane offset (0 = leftmost lane). Default: 0
 * @returns X position in mm
 */
export declare function getColumnX(column: Column, panelSide: PanelSide, laneOffset?: number): number;
/**
 * Get the absolute Y position of a row within a panel
 * @param row - Row number (1-10, 1 = bottom of panel)
 * @param panelNumber - Panel number (1-10, 1 = bottom)
 * @returns Y position in mm
 */
export declare function getRowY(row: Row, panelNumber: PanelNumber): number;
/**
 * Get the absolute position of an insert
 * @param panel - Panel identifier (side = SN/DX, number = height)
 * @param position - Insert position within panel
 * @param laneOffset - Lane offset (0 = leftmost lane). Default: 0
 * @returns Absolute position in mm
 */
export declare function getInsertPosition(panel: PanelId, position: InsertPosition, laneOffset?: number): Point;
/**
 * Get the total wall dimensions
 * @param lanes - Number of lanes
 * @param panelsHeight - Number of panels in height
 * @returns Wall dimensions in mm
 */
export declare function getWallDimensions(lanes?: number, panelsHeight?: number): {
    width: number;
    height: number;
};
/**
 * Parse a panel identifier string (e.g., "DX2", "SN10")
 * @param panelStr - Panel string
 * @returns Parsed panel identifier
 */
export declare function parsePanelId(panelStr: string): PanelId;
/**
 * Parse an insert position string (e.g., "F4", "A10")
 * @param posStr - Position string
 * @returns Parsed insert position
 */
export declare function parseInsertPosition(posStr: string): InsertPosition;
/**
 * Format a panel identifier to string
 * @param panel - Panel identifier
 * @returns Panel string (e.g., "DX2")
 */
export declare function formatPanelId(panel: PanelId): string;
/**
 * Format an insert position to string
 * @param position - Insert position
 * @returns Position string (e.g., "F4")
 */
export declare function formatInsertPosition(position: InsertPosition): string;
//# sourceMappingURL=plate-grid.d.ts.map