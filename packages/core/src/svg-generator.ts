/**
 * SVG Generator for speed climbing wall visualization
 */

import type { Config, Dimensions, ArrowDirection, ColumnSystem, ComposedSmearingZone } from './types.js';
import { DEFAULT_COLUMN_SYSTEM } from './types.js';
import { GRID, PANEL, PANELS_PER_LANE, ROWS, PANEL_NUMBERS, getInsertPosition, getWallDimensions, getColumnsForSystem, parsePanelId } from './plate-grid.js';
import { calculateHoldRotation } from './rotation.js';
import { loadHoldSvg, getHoldDimensions, getHoldDefaultOrientation, getHoldShowArrow } from './hold-svg-parser.js';
import type { ComposedHold } from './route-composer.js';

/**
 * Determine the visual arrow direction after rotation
 * @param holdType - Type of hold (to get default orientation)
 * @param rotation - Rotation angle in wall coordinates (from calculateHoldRotation)
 * @returns Arrow direction (up, down, left, right)
 */
function getArrowDirection(holdType: string, rotation: number): ArrowDirection {
  const defaultOrientation = getHoldDefaultOrientation(holdType);

  // Final arrow angle = defaultOrientation + rotation (normalized to 0-360)
  // rotation is the angle calculated to point from position to orientation target
  const finalAngle = ((defaultOrientation + rotation) % 360 + 360) % 360;

  // Convert angle to direction (0=right, 90=up, 180=left, 270=down)
  if (finalAngle >= 315 || finalAngle < 45) return 'right';
  if (finalAngle >= 45 && finalAngle < 135) return 'up';
  if (finalAngle >= 135 && finalAngle < 225) return 'left';
  return 'down';
}

/** Arrow indicator configuration constants */
const ARROW_BASE_WIDTH = 30;    // Fixed base width in mm
const ARROW_TARGET_CIRCLE_RADIUS = 15; // Circle radius around target insert in mm
const ARROW_STROKE_WIDTH = 2;   // Stroke width for the target circle in mm

/**
 * Generate SVG elements for an arrow pointing from hold to target insert
 * Returns a triangle (base at hold, tip at target) and a circle around the target
 *
 * @param holdPos - Hold position in SVG coordinates
 * @param targetPos - Target insert position in SVG coordinates
 * @param color - The color for the arrow and circle
 * @returns SVG elements string (polygon + circle)
 */
function generateArrowToTarget(
  holdPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  color: string
): string {
  // Calculate direction vector
  const dx = targetPos.x - holdPos.x;
  const dy = targetPos.y - holdPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Don't draw arrow if positions are too close
  if (distance < 1) {
    return '';
  }

  // Normalize direction
  const dirX = dx / distance;
  const dirY = dy / distance;

  // Perpendicular vector for triangle base
  const perpX = -dirY;
  const perpY = dirX;

  const halfBase = ARROW_BASE_WIDTH / 2;

  // Triangle vertices: base at hold position, tip at target
  const tipX = targetPos.x;
  const tipY = targetPos.y;
  const baseLeftX = holdPos.x + perpX * halfBase;
  const baseLeftY = holdPos.y + perpY * halfBase;
  const baseRightX = holdPos.x - perpX * halfBase;
  const baseRightY = holdPos.y - perpY * halfBase;

  const trianglePoints = `${baseLeftX},${baseLeftY} ${tipX},${tipY} ${baseRightX},${baseRightY}`;
  const triangle = `<polygon points="${trianglePoints}" fill="${color}" />`;

  // Circle around target insert
  const circle = `<circle cx="${targetPos.x}" cy="${targetPos.y}" r="${ARROW_TARGET_CIRCLE_RADIUS}" fill="none" stroke="${color}" stroke-width="${ARROW_STROKE_WIDTH}" />`;

  return `${triangle}\n${circle}`;
}

/** SVG generation options */
export interface SvgOptions {
  /** Show insert grid */
  showGrid?: boolean;
  /** Show panel labels */
  showPanelLabels?: boolean;
  /** Show column/row labels */
  showCoordinateLabels?: boolean;
  /** Grid color (inserts and coordinate labels) */
  gridColor?: string;
  /** Grid line width */
  gridLineWidth?: number;
  /** Insert marker radius */
  insertRadius?: number;
  /** Font size for coordinate labels (A-L, 1-10) */
  labelFontSize?: number;
  /** Font size for hold number labels */
  holdLabelFontSize?: number;
  /** Show arrow indicators for hold orientation */
  showArrow?: boolean;
  /** Column coordinate system for display labels (default: ABC) */
  coordinateDisplaySystem?: ColumnSystem;
  /** Show smearing zones (default: true) */
  showSmearingZones?: boolean;
}

const DEFAULT_OPTIONS: Required<SvgOptions> = {
  showGrid: true,
  showPanelLabels: true,
  showCoordinateLabels: true,
  gridColor: '#999999',
  gridLineWidth: 0.5,
  insertRadius: 4,
  labelFontSize: 40,
  holdLabelFontSize: 40,
  showArrow: false,
  coordinateDisplaySystem: DEFAULT_COLUMN_SYSTEM,
  showSmearingZones: true,
};

/**
 * Generate SVG for the insert grid
 */
function generateGrid(
  wallDimensions: Dimensions,
  config: Config,
  options: Required<SvgOptions>
): string {
  const lines: string[] = [];
  const { lanes, panelsHeight } = config.wall;

  // Get column labels for the display coordinate system
  const displayColumns = getColumnsForSystem(options.coordinateDisplaySystem);

  // Generate grid for each physical panel (each lane has PANELS_PER_LANE horizontal panels)
  for (let laneIndex = 0; laneIndex < lanes; laneIndex++) {
    const laneBaseX = laneIndex * PANELS_PER_LANE * PANEL.WIDTH;

    // Draw inserts for each horizontal panel within the lane
    for (let hPanel = 0; hPanel < PANELS_PER_LANE; hPanel++) {
      const panelBaseX = laneBaseX + hPanel * PANEL.WIDTH;

      for (const panelNum of PANEL_NUMBERS.slice(0, panelsHeight)) {
        const panelBaseY = (panelNum - 1) * PANEL.HEIGHT;

        // Draw inserts for this physical panel
        for (let colIdx = 0; colIdx < displayColumns.length; colIdx++) {
          for (const row of ROWS) {
            const x = panelBaseX + GRID.PANEL_MARGIN_HORIZONTAL + colIdx * GRID.COLUMN_SPACING;
            const y = panelBaseY + GRID.PANEL_MARGIN_VERTICAL + (row - 1) * GRID.ROW_SPACING;
            lines.push(
              `<circle cx="${x}" cy="${wallDimensions.height - y}" r="${options.insertRadius}" fill="${options.gridColor}" />`
            );
          }
        }

        // Panel label (centered in each physical panel)
        // Left panels (hPanel=0) are labeled SN, right panels (hPanel=1) are labeled DX
        if (options.showPanelLabels) {
          const panelLane = hPanel === 0 ? 'SN' : 'DX';
          const panelId = `${panelLane}${panelNum}`;
          const centerX = panelBaseX + GRID.PANEL_MARGIN_HORIZONTAL + (displayColumns.length - 1) * GRID.COLUMN_SPACING / 2;
          const centerY = panelBaseY + PANEL.HEIGHT / 2;
          lines.push(
            `<text x="${centerX}" y="${wallDimensions.height - centerY}" font-size="${options.labelFontSize * 3}" fill="#AAAAAA" text-anchor="middle" dominant-baseline="middle" opacity="0.4">${panelId}</text>`
          );
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
          for (let colIdx = 0; colIdx < displayColumns.length; colIdx++) {
            const x = panelBaseX + GRID.PANEL_MARGIN_HORIZONTAL + colIdx * GRID.COLUMN_SPACING;

            // Bottom margin labels (between bottom edge and row 1)
            const bottomY = wallDimensions.height - panelBaseY - GRID.PANEL_MARGIN_VERTICAL / 2;
            lines.push(
              `<text x="${x}" y="${bottomY}" font-size="${options.labelFontSize}" fill="#AAAAAA" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${displayColumns[colIdx]}</text>`
            );

            // Top margin labels (between row 10 and top edge)
            const topY = wallDimensions.height - panelBaseY - PANEL.HEIGHT + GRID.PANEL_MARGIN_VERTICAL / 2;
            lines.push(
              `<text x="${x}" y="${topY}" font-size="${options.labelFontSize}" fill="#AAAAAA" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${displayColumns[colIdx]}</text>`
            );
          }

          // Row labels (in left and right margins of each panel)
          for (const row of ROWS) {
            const y = panelBaseY + GRID.PANEL_MARGIN_VERTICAL + (row - 1) * GRID.ROW_SPACING;
            const svgY = wallDimensions.height - y;

            // Left margin labels (between left edge and column A)
            const leftX = panelBaseX + GRID.PANEL_MARGIN_HORIZONTAL / 2;
            lines.push(
              `<text x="${leftX}" y="${svgY}" font-size="${options.labelFontSize}" fill="#AAAAAA" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${row}</text>`
            );

            // Right margin labels (between column L and right edge)
            const rightX = panelBaseX + PANEL.WIDTH - GRID.PANEL_MARGIN_HORIZONTAL / 2;
            lines.push(
              `<text x="${rightX}" y="${svgY}" font-size="${options.labelFontSize}" fill="#AAAAAA" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${row}</text>`
            );
          }
        }
      }
    }

  }

  // Draw panel boundary lines (horizontal lines between panels)
  for (let p = 0; p <= panelsHeight; p++) {
    const y = wallDimensions.height - p * PANEL.HEIGHT;
    lines.push(
      `<line x1="0" y1="${y}" x2="${wallDimensions.width}" y2="${y}" stroke="#666666" stroke-width="2" />`
    );
  }

  // Draw lane boundary lines (vertical lines between lanes)
  for (let l = 0; l <= lanes; l++) {
    const x = l * PANELS_PER_LANE * PANEL.WIDTH;
    lines.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${wallDimensions.height}" stroke="#666666" stroke-width="2" />`
    );
  }

  return lines.join('\n');
}

/**
 * Generate SVG for a single hold
 */
async function generateHold(
  hold: ComposedHold,
  wallDimensions: Dimensions,
  holdLabelFontSize: number
): Promise<{ holdSvg: string; labelSvg: string; arrowSvg: string | null }> {
  // Get hold dimensions from central configuration
  const baseDimensions = getHoldDimensions(hold.type);
  // Apply hold scale factor
  const holdDimensions = {
    width: baseDimensions.width * hold.holdScale,
    height: baseDimensions.height * hold.holdScale,
  };

  // Load SVG data
  const svgData = await loadHoldSvg(hold.type);

  // Calculate position (coordinates are already converted to ABC system by parseHold)
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
  const rotation = calculateHoldRotation(
    hold.panel,
    hold.position,
    orientationPanel,
    hold.orientation,
    hold.type,
    hold.laneOffset
  );
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
  const elements: string[] = [];

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
    const adjustedFontSize = holdLabelFontSize / scale;

    // Replace the text content (inside <tspan> or directly in <text>)
    // First try to replace inside <tspan>
    if (labelElement.includes('<tspan')) {
      labelElement = labelElement.replace(/>([^<]*)<\/tspan>/g, `>${labelText}</tspan>`);
    } else {
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
      labelElement = labelElement.replace(
        /(<tspan[^>]*style\s*=\s*["'][^"']*)font-size\s*:\s*[^;}"'px]+(?:px)?/gi,
        `$1font-size:${adjustedFontSize}px`
      );
    }

    // Add dominant-baseline="hanging" for top alignment
    if (!labelElement.includes('dominant-baseline')) {
      labelElement = labelElement.replace(/<text/, '<text dominant-baseline="hanging"');
    }

    // Include the label in the same transform group as the hold
    labelSvg = `<g transform="${transform}">${labelElement}</g>`;
  } else {
    // Fallback: place label below the hold with a simple offset
    const fallbackOffset = Math.max(svgData.viewBox.width, svgData.viewBox.height) * scale * 0.6;
    const labelX = svgX;
    const labelY = svgY + fallbackOffset;
    labelSvg = `<text x="${labelX}" y="${labelY}" font-size="${holdLabelFontSize}" fill="${holdColor}" text-anchor="middle" dominant-baseline="hanging" font-weight="bold">${labelText}</text>`;
  }

  // Generate arrow SVG pointing to target insert (if hold type supports arrows)
  let arrowSvg: string | null = null;
  if (getHoldShowArrow(hold.type)) {
    // Get target insert position (orientation point)
    const targetPos = getInsertPosition(orientationPanel, hold.orientation, hold.laneOffset);

    // Apply the same anchor offset to target position
    // This ensures the arrow keeps the same length and direction when the route is moved
    if (hold.anchorOffset) {
      targetPos.x += hold.anchorOffset.x;
      targetPos.y += hold.anchorOffset.y;
    }

    // Convert to SVG coordinates
    const holdSvgPos = { x: svgX, y: svgY };
    const targetSvgPos = { x: targetPos.x, y: wallDimensions.height - targetPos.y };

    // Generate arrow from hold to target with circle around target
    const arrowElements = generateArrowToTarget(holdSvgPos, targetSvgPos, holdColor);
    if (arrowElements) {
      arrowSvg = arrowElements;
    }
  }

  return { holdSvg, labelSvg, arrowSvg };
}

/** Smearing zone rendering constants */
const SMEARING_ZONE_FILL_OPACITY = 0.2;
const SMEARING_ZONE_HATCH_OPACITY = 0.5;
const SMEARING_ZONE_HATCH_LINE_WIDTH = 0;
const SMEARING_ZONE_HATCH_SPACING = 40;
const SMEARING_ZONE_BORDER_WIDTH = 10;
const SMEARING_ZONE_BORDER_OPACITY = 0.3;
const SMEARING_ZONE_LABEL_MARGIN = 5; // Margin below the zone for the label

/**
 * Generate a unique pattern ID for a color (for hatched patterns)
 */
function getHatchPatternId(color: string): string {
  // Remove # and use the hex value
  return `smearing-hatch-${color.replace('#', '')}`;
}

/**
 * Generate SVG pattern definition for hatched fill
 */
function generateHatchPattern(color: string): string {
  const patternId = getHatchPatternId(color);
  return `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${SMEARING_ZONE_HATCH_SPACING}" height="${SMEARING_ZONE_HATCH_SPACING}" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="${SMEARING_ZONE_HATCH_SPACING}" stroke="${color}" stroke-width="${SMEARING_ZONE_HATCH_LINE_WIDTH}" stroke-opacity="${SMEARING_ZONE_HATCH_OPACITY}" />
  </pattern>`;
}

/**
 * Generate SVG for smearing zones
 */
function generateSmearingZones(
  zones: ComposedSmearingZone[],
  wallDimensions: Dimensions,
  labelFontSize: number
): { defs: string; elements: string } {
  if (zones.length === 0) {
    return { defs: '', elements: '' };
  }

  // Collect unique colors for pattern definitions
  const uniqueColors = new Set(zones.map(z => z.color));
  const patterns = Array.from(uniqueColors).map(generateHatchPattern);
  const defs = patterns.join('\n');

  // Generate zone rectangles and labels
  const elements: string[] = [];

  for (const zone of zones) {
    // Calculate position
    const panel = parsePanelId(zone.panel);
    // Use integer part of row for base position calculation
    const integerRow = Math.floor(zone.row) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    const basePos = getInsertPosition(panel, { column: zone.column, row: integerRow }, zone.laneOffset);

    // Apply fractional row offset
    const fractionalRowOffset = (zone.row - integerRow) * GRID.ROW_SPACING;
    basePos.y += fractionalRowOffset;

    // Apply columnOffset if present
    if (zone.columnOffset !== undefined) {
      basePos.x += zone.columnOffset * GRID.COLUMN_SPACING;
    }

    // Apply anchor offset if present
    if (zone.anchorOffset) {
      basePos.x += zone.anchorOffset.x;
      basePos.y += zone.anchorOffset.y;
    }

    // Calculate dimensions in mm
    const widthMm = zone.width * GRID.COLUMN_SPACING;
    const heightMm = zone.height * GRID.ROW_SPACING;

    // Convert to SVG coordinates (Y is inverted, origin at top-left)
    const svgX = basePos.x;
    const svgY = wallDimensions.height - basePos.y - heightMm; // Bottom-left corner in wall coords -> top-left in SVG

    const patternId = getHatchPatternId(zone.color);

    // Zone group with data attribute
    elements.push(`<g class="smearing-zone" data-label="${zone.label}">`);

    // Solid fill rectangle with opacity
    elements.push(`  <rect x="${svgX}" y="${svgY}" width="${widthMm}" height="${heightMm}" fill="${zone.color}" fill-opacity="${SMEARING_ZONE_FILL_OPACITY}" />`);

    // Hatched pattern overlay
    elements.push(`  <rect x="${svgX}" y="${svgY}" width="${widthMm}" height="${heightMm}" fill="url(#${patternId})" />`);

    // Border rectangle
    elements.push(`  <rect x="${svgX}" y="${svgY}" width="${widthMm}" height="${heightMm}" fill="none" stroke="${zone.color}" stroke-width="${SMEARING_ZONE_BORDER_WIDTH}" stroke-opacity="${SMEARING_ZONE_BORDER_OPACITY}" />`);

    // Label BELOW the zone (in SVG coords, y increases downward)
    const labelX = svgX;
    const labelY = svgY + heightMm + SMEARING_ZONE_LABEL_MARGIN; // Below the rectangle
    elements.push(`  <text x="${labelX}" y="${labelY}" font-size="${labelFontSize}" font-family="'Lucida Grande', sans-serif" fill="${zone.color}" text-anchor="start" dominant-baseline="text-before-edge" font-weight="bold">${zone.label}</text>`);

    elements.push(`</g>`);
  }

  return { defs, elements: elements.join('\n') };
}

/**
 * Generate full SVG document
 */
export async function generateSvg(
  config: Config,
  holds: ComposedHold[],
  options: SvgOptions = {},
  smearingZones: ComposedSmearingZone[] = []
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const wallDimensions = getWallDimensions(config.wall.lanes, config.wall.panelsHeight);

  // Add margin for labels (needs to accommodate font size + panel labels)
  const margin = opts.showCoordinateLabels ? 80 : 0;
  const svgWidth = wallDimensions.width + margin * 2;
  const svgHeight = wallDimensions.height + margin * 2;

  const parts: string[] = [];

  // SVG header
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}mm" height="${svgHeight}mm" viewBox="${-margin} ${-margin} ${svgWidth} ${svgHeight}">`);

  // Generate smearing zone patterns (need to be in defs before use)
  const zonesToRender = opts.showSmearingZones ? smearingZones : [];
  const { defs: zoneDefs, elements: zoneElements } = generateSmearingZones(
    zonesToRender,
    wallDimensions,
    opts.holdLabelFontSize
  );

  // Add defs section if we have patterns
  if (zoneDefs) {
    parts.push(`<defs>`);
    parts.push(zoneDefs);
    parts.push(`</defs>`);
  }

  // Background
  parts.push(`<rect x="0" y="0" width="${wallDimensions.width}" height="${wallDimensions.height}" fill="white" stroke="#333333" stroke-width="1" />`);

  // Grid
  if (opts.showGrid) {
    parts.push(`<g id="grid">`);
    parts.push(generateGrid(wallDimensions, config, opts));
    parts.push(`</g>`);
  }

  // Smearing zones (rendered after grid, before arrows and holds)
  if (zoneElements) {
    parts.push(`<g id="smearing-zones">`);
    parts.push(zoneElements);
    parts.push(`</g>`);
  }

  // Generate hold data first to collect all SVG elements
  const holdResults: { holdSvg: string; labelSvg: string; arrowSvg: string | null }[] = [];
  for (const hold of holds) {
    const result = await generateHold(hold, wallDimensions, opts.holdLabelFontSize);
    holdResults.push(result);
  }

  // Arrow indicators (rendered below holds)
  if (opts.showArrow) {
    parts.push(`<g id="arrows">`);
    for (const { arrowSvg } of holdResults) {
      if (arrowSvg) {
        parts.push(arrowSvg);
      }
    }
    parts.push(`</g>`);
  }

  // Holds
  parts.push(`<g id="holds">`);
  const labels: string[] = [];
  for (const { holdSvg, labelSvg } of holdResults) {
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
