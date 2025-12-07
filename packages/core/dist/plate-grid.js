/**
 * IFSC speed climbing wall grid constants and position calculations
 */
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
};
/** Calculated panel dimensions */
export const PANEL = {
    /** Panel width: (11 columns - 1) × 125mm + 2 margins × 125mm = 1500mm */
    WIDTH: (GRID.COLUMNS_PER_PANEL - 1) * GRID.COLUMN_SPACING + 2 * GRID.PANEL_MARGIN_HORIZONTAL,
    /** Panel height: (10 rows - 1) × 125mm + 2 margins × 187.5mm = 1500mm */
    HEIGHT: (GRID.ROWS_PER_PANEL - 1) * GRID.ROW_SPACING + 2 * GRID.PANEL_MARGIN_VERTICAL,
};
/** Number of physical panels per lane (horizontally) */
export const PANELS_PER_LANE = 2;
/** Column letters in order (excluding J) */
export const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L'];
/** Column letter to index mapping */
export const COLUMN_INDEX = {
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5,
    'G': 6, 'H': 7, 'I': 8, 'K': 9, 'L': 10,
};
/** Row numbers */
export const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
/** Panel numbers */
export const PANEL_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
/** Panel sides */
export const PANEL_SIDES = ['SN', 'DX'];
/**
 * Get the X offset for a lane index
 * @param laneIndex - Lane index (0 = leftmost lane)
 * @returns X offset in mm
 */
export function getLaneOffsetByIndex(laneIndex) {
    return laneIndex * PANELS_PER_LANE * PANEL.WIDTH;
}
/**
 * Get the absolute X position of a column
 * @param column - Column letter
 * @param panelSide - Panel side (SN=left panel, DX=right panel)
 * @param laneOffset - Lane offset (0 = leftmost lane). Default: 0
 * @returns X position in mm
 */
export function getColumnX(column, panelSide, laneOffset = 0) {
    const laneOffsetMm = getLaneOffsetByIndex(laneOffset);
    const columnIndex = COLUMN_INDEX[column];
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
export function getRowY(row, panelNumber) {
    const panelOffset = (panelNumber - 1) * PANEL.HEIGHT;
    const rowOffset = GRID.PANEL_MARGIN_VERTICAL + (row - 1) * GRID.ROW_SPACING;
    return panelOffset + rowOffset;
}
/**
 * Get the absolute position of an insert
 * @param panel - Panel identifier (side = SN/DX, number = height)
 * @param position - Insert position within panel
 * @param laneOffset - Lane offset (0 = leftmost lane). Default: 0
 * @returns Absolute position in mm
 */
export function getInsertPosition(panel, position, laneOffset = 0) {
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
export function getWallDimensions(lanes = 2, panelsHeight = 10) {
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
export function parsePanelId(panelStr) {
    const match = panelStr.match(/^(SN|DX)(\d+)$/i);
    if (!match) {
        throw new Error(`Invalid panel identifier: ${panelStr}`);
    }
    const side = match[1].toUpperCase();
    const number = parseInt(match[2], 10);
    if (number < 1 || number > 10) {
        throw new Error(`Panel number must be 1-10, got: ${number}`);
    }
    return { side, number };
}
/**
 * Parse an insert position string (e.g., "F4", "A10")
 * @param posStr - Position string
 * @returns Parsed insert position
 */
export function parseInsertPosition(posStr) {
    const match = posStr.match(/^([A-IKL])(\d+)$/i);
    if (!match) {
        throw new Error(`Invalid insert position: ${posStr}`);
    }
    const column = match[1].toUpperCase();
    const row = parseInt(match[2], 10);
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
export function formatPanelId(panel) {
    return `${panel.side}${panel.number}`;
}
/**
 * Format an insert position to string
 * @param position - Insert position
 * @returns Position string (e.g., "F4")
 */
export function formatInsertPosition(position) {
    return `${position.column}${position.row}`;
}
//# sourceMappingURL=plate-grid.js.map