/**
 * SVG Generator for speed climbing wall visualization
 */
import { GRID, PANEL, PANELS_PER_LANE, COLUMNS, ROWS, PANEL_NUMBERS, getInsertPosition, getWallDimensions } from './plate-grid.js';
import { calculateHoldRotation } from './rotation.js';
import { loadHoldSvg, getHoldDimensions, getHoldDefaultOrientation } from './hold-svg-parser.js';
/**
 * Determine the visual arrow direction after rotation
 * @param holdType - Type of hold (to get default orientation)
 * @param rotation - Rotation angle in wall coordinates (from calculateHoldRotation)
 * @returns Arrow direction (up, down, left, right)
 */
function getArrowDirection(holdType, rotation) {
    const defaultOrientation = getHoldDefaultOrientation(holdType);
    // Final arrow angle = defaultOrientation + rotation (normalized to 0-360)
    // rotation is the angle calculated to point from position to orientation target
    const finalAngle = ((defaultOrientation + rotation) % 360 + 360) % 360;
    // Convert angle to direction (0=right, 90=up, 180=left, 270=down)
    if (finalAngle >= 315 || finalAngle < 45)
        return 'right';
    if (finalAngle >= 45 && finalAngle < 135)
        return 'up';
    if (finalAngle >= 135 && finalAngle < 225)
        return 'left';
    return 'down';
}
const DEFAULT_OPTIONS = {
    showGrid: true,
    showPanelLabels: true,
    showCoordinateLabels: true,
    gridColor: '#666666',
    gridLineWidth: 0.5,
    insertRadius: 4,
    labelFontSize: 28,
};
/**
 * Generate SVG for the insert grid
 */
function generateGrid(wallDimensions, config, options) {
    const lines = [];
    const { lanes, panelsHeight } = config.wall;
    // Generate grid for each physical panel (each lane has PANELS_PER_LANE horizontal panels)
    for (let laneIndex = 0; laneIndex < lanes; laneIndex++) {
        const laneBaseX = laneIndex * PANELS_PER_LANE * PANEL.WIDTH;
        // Draw inserts for each horizontal panel within the lane
        for (let hPanel = 0; hPanel < PANELS_PER_LANE; hPanel++) {
            const panelBaseX = laneBaseX + hPanel * PANEL.WIDTH;
            for (const panelNum of PANEL_NUMBERS.slice(0, panelsHeight)) {
                const panelBaseY = (panelNum - 1) * PANEL.HEIGHT;
                // Draw inserts for this physical panel
                for (let colIdx = 0; colIdx < COLUMNS.length; colIdx++) {
                    for (const row of ROWS) {
                        const x = panelBaseX + GRID.PANEL_MARGIN_HORIZONTAL + colIdx * GRID.COLUMN_SPACING;
                        const y = panelBaseY + GRID.PANEL_MARGIN_VERTICAL + (row - 1) * GRID.ROW_SPACING;
                        lines.push(`<circle cx="${x}" cy="${wallDimensions.height - y}" r="${options.insertRadius}" fill="${options.gridColor}" />`);
                    }
                }
                // Panel label (centered in each physical panel)
                // Left panels (hPanel=0) are labeled SN, right panels (hPanel=1) are labeled DX
                if (options.showPanelLabels) {
                    const panelLane = hPanel === 0 ? 'SN' : 'DX';
                    const panelId = `${panelLane}${panelNum}`;
                    const centerX = panelBaseX + GRID.PANEL_MARGIN_HORIZONTAL + (COLUMNS.length - 1) * GRID.COLUMN_SPACING / 2;
                    const centerY = panelBaseY + PANEL.HEIGHT / 2;
                    lines.push(`<text x="${centerX}" y="${wallDimensions.height - centerY}" font-size="${options.labelFontSize * 3}" fill="#AAAAAA" text-anchor="middle" dominant-baseline="middle" opacity="0.4">${panelId}</text>`);
                }
            }
        }
    }
    // Coordinate labels for each physical panel (in the margins)
    if (options.showCoordinateLabels) {
        for (let laneIndex = 0; laneIndex < lanes; laneIndex++) {
            const laneBaseX = laneIndex * PANELS_PER_LANE * PANEL.WIDTH;
            // Labels for each horizontal panel within the lane
            for (let hPanel = 0; hPanel < PANELS_PER_LANE; hPanel++) {
                const panelBaseX = laneBaseX + hPanel * PANEL.WIDTH;
                for (const panelNum of PANEL_NUMBERS.slice(0, panelsHeight)) {
                    const panelBaseY = (panelNum - 1) * PANEL.HEIGHT;
                    // Column labels (in top and bottom margins of each panel)
                    for (let colIdx = 0; colIdx < COLUMNS.length; colIdx++) {
                        const x = panelBaseX + GRID.PANEL_MARGIN_HORIZONTAL + colIdx * GRID.COLUMN_SPACING;
                        // Bottom margin labels (between bottom edge and row 1)
                        const bottomY = wallDimensions.height - panelBaseY - GRID.PANEL_MARGIN_VERTICAL / 2;
                        lines.push(`<text x="${x}" y="${bottomY}" font-size="${options.labelFontSize}" fill="#AAAAAA" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${COLUMNS[colIdx]}</text>`);
                        // Top margin labels (between row 10 and top edge)
                        const topY = wallDimensions.height - panelBaseY - PANEL.HEIGHT + GRID.PANEL_MARGIN_VERTICAL / 2;
                        lines.push(`<text x="${x}" y="${topY}" font-size="${options.labelFontSize}" fill="#AAAAAA" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${COLUMNS[colIdx]}</text>`);
                    }
                    // Row labels (in left and right margins of each panel)
                    for (const row of ROWS) {
                        const y = panelBaseY + GRID.PANEL_MARGIN_VERTICAL + (row - 1) * GRID.ROW_SPACING;
                        const svgY = wallDimensions.height - y;
                        // Left margin labels (between left edge and column A)
                        const leftX = panelBaseX + GRID.PANEL_MARGIN_HORIZONTAL / 2;
                        lines.push(`<text x="${leftX}" y="${svgY}" font-size="${options.labelFontSize}" fill="#AAAAAA" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${row}</text>`);
                        // Right margin labels (between column L and right edge)
                        const rightX = panelBaseX + PANEL.WIDTH - GRID.PANEL_MARGIN_HORIZONTAL / 2;
                        lines.push(`<text x="${rightX}" y="${svgY}" font-size="${options.labelFontSize}" fill="#AAAAAA" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${row}</text>`);
                    }
                }
            }
        }
        // Panel number labels on left margin of wall
        for (const panelNum of PANEL_NUMBERS.slice(0, panelsHeight)) {
            const panelBaseY = (panelNum - 1) * PANEL.HEIGHT;
            const panelCenterY = wallDimensions.height - (panelBaseY + PANEL.HEIGHT / 2);
            lines.push(`<text x="${-50}" y="${panelCenterY}" font-size="${options.labelFontSize * 1.2}" fill="#AAAAAA" text-anchor="middle" dominant-baseline="middle" font-weight="bold">P${panelNum}</text>`);
        }
    }
    // Draw panel boundary lines (horizontal lines between panels)
    for (let p = 0; p <= panelsHeight; p++) {
        const y = wallDimensions.height - p * PANEL.HEIGHT;
        lines.push(`<line x1="0" y1="${y}" x2="${wallDimensions.width}" y2="${y}" stroke="#999999" stroke-width="1" stroke-dasharray="5,5" />`);
    }
    // Draw lane boundary lines (vertical lines between lanes)
    for (let l = 0; l <= lanes; l++) {
        const x = l * PANELS_PER_LANE * PANEL.WIDTH;
        lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${wallDimensions.height}" stroke="#999999" stroke-width="1" stroke-dasharray="5,5" />`);
    }
    return lines.join('\n');
}
/** Font size for hold numbers */
const HOLD_NUMBER_FONT_SIZE = 40;
/**
 * Generate SVG for a single hold
 */
async function generateHold(hold, wallDimensions) {
    // Get hold dimensions from central configuration
    const baseDimensions = getHoldDimensions(hold.type);
    // Apply hold scale factor
    const holdDimensions = {
        width: baseDimensions.width * hold.holdScale,
        height: baseDimensions.height * hold.holdScale,
    };
    // Load SVG data
    const svgData = await loadHoldSvg(hold.type);
    // Calculate position
    const pos = getInsertPosition(hold.panel, hold.position, hold.laneOffset);
    // Apply anchor offset if present (already in mm)
    if (hold.anchorOffset) {
        pos.x += hold.anchorOffset.x;
        pos.y += hold.anchorOffset.y;
    }
    // Convert to SVG coordinates (Y is inverted)
    const svgX = pos.x;
    const svgY = wallDimensions.height - pos.y;
    // Calculate scale factor
    const scaleX = holdDimensions.width / svgData.viewBox.width;
    const scaleY = holdDimensions.height / svgData.viewBox.height;
    const scale = Math.min(scaleX, scaleY); // Use uniform scale to maintain aspect ratio
    // Calculate rotation (use orientation panel if specified, otherwise same as hold panel)
    const orientationPanel = hold.orientationPanel ?? hold.panel;
    const rotation = calculateHoldRotation(hold.panel, hold.position, orientationPanel, hold.orientation, hold.type, hold.laneOffset);
    // Note: The SVG's embedded transform already positions the hold with arrow pointing
    // in the default orientation (e.g., down for BIG). We don't need to compensate for
    // svgRotation since DEFAULT_ORIENTATIONS already describes the displayed orientation.
    // Build transform
    // 1. Translate to position
    // 2. Rotate around position
    // 3. Scale
    // 4. Translate back by insert center (so insert center is at position)
    const transform = [
        `translate(${svgX}, ${svgY})`,
        `rotate(${-rotation})`, // Negate because SVG Y is inverted
        `scale(${scale})`,
        `translate(${-svgData.insertCenter.x}, ${-svgData.insertCenter.y})`,
    ].join(' ');
    // Build elements array
    const elements = [];
    // Add colored path element if present
    // Use hold color (already includes route default from composeRoute)
    const holdColor = hold.color ?? '#FF0000'; // Fallback to red if no color
    if (svgData.pathElement !== null) {
        const coloredPath = svgData.pathElement.replace(/<(path)/, `<$1 fill="${holdColor}"`);
        elements.push(coloredPath);
    }
    // Add additional elements (circles, or all visual elements for uncolored holds)
    elements.push(...svgData.additionalElements);
    // Add data attributes for interactive selection
    const dataAttrs = [
        `data-source="${hold.sourceRoute}"`,
        `data-hold="${hold.originalHoldNumber}"`,
        `data-composed="${hold.composedHoldNumber}"`,
    ].join(' ');
    const holdSvg = `<g transform="${transform}" ${dataAttrs} class="hold">${elements.join('\n')}</g>`;
    // Generate label (use label if defined, otherwise composedHoldNumber)
    const labelText = hold.label ?? String(hold.composedHoldNumber);
    // Determine arrow direction and find corresponding label zone
    const arrowDirection = getArrowDirection(hold.type, rotation);
    const labelZone = svgData.labelZones[arrowDirection] ?? svgData.labelZones['default'];
    let labelSvg = '';
    if (labelZone) {
        // Take the label element from the SVG and modify it
        let labelElement = labelZone.element;
        // Compensate for the group scale to get consistent font size
        const adjustedFontSize = HOLD_NUMBER_FONT_SIZE / scale;
        // Replace the text content (inside <tspan> or directly in <text>)
        // First try to replace inside <tspan>
        if (labelElement.includes('<tspan')) {
            labelElement = labelElement.replace(/>([^<]*)<\/tspan>/g, `>${labelText}</tspan>`);
        }
        else {
            // Replace text directly inside <text>
            labelElement = labelElement.replace(/>([^<]*)<\/text>/, `>${labelText}</text>`);
        }
        // Replace fill color (in style attribute or as attribute)
        labelElement = labelElement.replace(/fill\s*:\s*[^;}"']+/gi, `fill:${holdColor}`);
        labelElement = labelElement.replace(/\bfill\s*=\s*["'][^"']*["']/gi, `fill="${holdColor}"`);
        // If no fill found, add it to the opening tag
        if (!labelElement.includes('fill')) {
            labelElement = labelElement.replace(/<text/, `<text fill="${holdColor}"`);
        }
        // Replace font-size (in style attribute or as attribute)
        // Use adjusted size to compensate for group scale
        labelElement = labelElement.replace(/font-size\s*:\s*[^;}"'px]+(?:px)?/gi, `font-size:${adjustedFontSize}px`);
        labelElement = labelElement.replace(/\bfont-size\s*=\s*["'][^"']*["']/gi, `font-size="${adjustedFontSize}px"`);
        // Also update tspan font-size if present
        if (labelElement.includes('<tspan')) {
            labelElement = labelElement.replace(/(<tspan[^>]*style\s*=\s*["'][^"']*)font-size\s*:\s*[^;}"'px]+(?:px)?/gi, `$1font-size:${adjustedFontSize}px`);
        }
        // Add dominant-baseline="hanging" for top alignment
        if (!labelElement.includes('dominant-baseline')) {
            labelElement = labelElement.replace(/<text/, '<text dominant-baseline="hanging"');
        }
        // Include the label in the same transform group as the hold
        labelSvg = `<g transform="${transform}">${labelElement}</g>`;
    }
    else {
        // Fallback: place label below the hold with a simple offset
        const fallbackOffset = Math.max(svgData.viewBox.width, svgData.viewBox.height) * scale * 0.6;
        const labelX = svgX;
        const labelY = svgY + fallbackOffset;
        labelSvg = `<text x="${labelX}" y="${labelY}" font-size="${HOLD_NUMBER_FONT_SIZE}" fill="${holdColor}" text-anchor="middle" dominant-baseline="hanging" font-weight="bold">${labelText}</text>`;
    }
    return { holdSvg, labelSvg };
}
/**
 * Generate full SVG document
 */
export async function generateSvg(config, holds, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const wallDimensions = getWallDimensions(config.wall.lanes, config.wall.panelsHeight);
    // Add margin for labels (needs to accommodate font size + panel labels)
    const margin = opts.showCoordinateLabels ? 80 : 0;
    const svgWidth = wallDimensions.width + margin * 2;
    const svgHeight = wallDimensions.height + margin * 2;
    const parts = [];
    // SVG header
    parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}mm" height="${svgHeight}mm" viewBox="${-margin} ${-margin} ${svgWidth} ${svgHeight}">`);
    // Background
    parts.push(`<rect x="0" y="0" width="${wallDimensions.width}" height="${wallDimensions.height}" fill="white" stroke="#333333" stroke-width="1" />`);
    // Grid
    if (opts.showGrid) {
        parts.push(`<g id="grid">`);
        parts.push(generateGrid(wallDimensions, config, opts));
        parts.push(`</g>`);
    }
    // Holds
    parts.push(`<g id="holds">`);
    const labels = [];
    for (const hold of holds) {
        const { holdSvg, labelSvg } = await generateHold(hold, wallDimensions);
        parts.push(holdSvg);
        labels.push(labelSvg);
    }
    parts.push(`</g>`);
    // Hold number labels (separate layer so they appear on top)
    parts.push(`<g id="hold-labels">`);
    parts.push(...labels);
    parts.push(`</g>`);
    // Close SVG
    parts.push(`</svg>`);
    return parts.join('\n');
}
//# sourceMappingURL=svg-generator.js.map