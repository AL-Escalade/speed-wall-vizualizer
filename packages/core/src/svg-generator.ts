/**
 * SVG Generator for speed climbing wall visualization
 */

import { type Config, type Dimensions, type ArrowDirection, type ColumnSystem, type ComposedSmearingZone, type HoldSvgData, type LabelZone, type Point, DEFAULT_COLUMN_SYSTEM } from './types.js';
import { GRID, PANEL, PANELS_PER_LANE, ROWS, PANEL_NUMBERS, getInsertPosition, getWallDimensions, getColumnsForSystem, parsePanelId } from './plate-grid.js';
import { calculateHoldRotation } from './rotation.js';
import { loadHoldSvg, getHoldDimensions, getHoldDefaultOrientation, getHoldShowArrow } from './hold-svg-parser.js';
import type { ComposedHold } from './route-composer.js';
import { formatHoldLabel, type HoldLabelLanguage } from './hold-label.js';
import { formatSmearingZoneLabel } from './smearing-zone-label.js';
import { applyMatrix, multiplyMatrices, rotateMatrix, scaleMatrix, translateMatrix, type Matrix } from './svg-transform.js';
import {
  placeHoldLabels,
  placeZoneLabels,
  labelBox,
  type LabelPlacement,
  type LabelRequest,
  type ZoneLabelPlacement,
  type ZoneLabelRequest,
} from './label-placement.js';

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
  /** Language for hold and smearing zone labels, not for coordinates (default: 'fr') */
  holdLabelLanguage?: HoldLabelLanguage;
}

/** Hold label font size used when the option is missing or invalid */
const DEFAULT_HOLD_LABEL_FONT_SIZE = 40;
/** Largest hold label font size: the web slider maximum. Placement cost explodes above it — most labels fall back and each fallback scans every direction. */
const MAX_HOLD_LABEL_FONT_SIZE = 200;
/** Color of a hold (and its label) whose route gives none */
const FALLBACK_HOLD_COLOR = '#FF0000';

/**
 * Clamp the hold label font size: it reaches generateSvg unvalidated from
 * URLs, imports and localStorage.
 */
function normalizeHoldLabelFontSize(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return DEFAULT_HOLD_LABEL_FONT_SIZE;
  return Math.min(value, MAX_HOLD_LABEL_FONT_SIZE);
}

const DEFAULT_OPTIONS: Required<SvgOptions> = {
  showGrid: true,
  showPanelLabels: true,
  showCoordinateLabels: true,
  gridColor: '#999999',
  gridLineWidth: 0.5,
  insertRadius: 4,
  labelFontSize: 40,
  holdLabelFontSize: DEFAULT_HOLD_LABEL_FONT_SIZE,
  showArrow: false,
  coordinateDisplaySystem: DEFAULT_COLUMN_SYSTEM,
  showSmearingZones: true,
  holdLabelLanguage: 'fr',
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

/** Where a hold lands on the wall, shared by its rendering and its label placement */
interface HoldGeometry {
  svgData: HoldSvgData;
  /** Asset frame → wall frame: the same chain as `transform` */
  matrix: Matrix;
  transform: string;
  /** Rotation from calculateHoldRotation (counterclockwise, wall y-up) */
  rotation: number;
  /** Insert position on the wall (SVG coordinates) */
  insert: Point;
  labelZone: LabelZone | undefined;
}

/**
 * Compute where a hold lands on the wall
 */
async function computeHoldGeometry(hold: ComposedHold, wallDimensions: Dimensions): Promise<HoldGeometry> {
  // Get hold dimensions from central configuration, with the hold scale factor
  const baseDimensions = getHoldDimensions(hold.type);
  const holdDimensions = {
    width: baseDimensions.width * hold.holdScale,
    height: baseDimensions.height * hold.holdScale,
  };

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

  // Uniform scale to maintain aspect ratio
  const scale = Math.min(
    holdDimensions.width / svgData.viewBox.width,
    holdDimensions.height / svgData.viewBox.height
  );

  // Calculate rotation (use orientation panel if specified, otherwise same as hold panel).
  // The SVG's embedded transform already positions the hold with its arrow in the
  // default orientation, which DEFAULT_ORIENTATIONS describes: no svgRotation compensation.
  const rotation = calculateHoldRotation(
    hold.panel,
    hold.position,
    hold.orientationPanel ?? hold.panel,
    hold.orientation,
    hold.type,
    hold.laneOffset
  );

  // Translate to position, rotate around it (negated: SVG Y is inverted), scale,
  // then translate back by the insert center so the insert lands on the position
  const transform = [
    `translate(${svgX}, ${svgY})`,
    `rotate(${-rotation})`,
    `scale(${scale})`,
    `translate(${-svgData.insertCenter.x}, ${-svgData.insertCenter.y})`,
  ].join(' ');
  const matrix = [
    translateMatrix(svgX, svgY),
    rotateMatrix(-rotation),
    scaleMatrix(scale),
    translateMatrix(-svgData.insertCenter.x, -svgData.insertCenter.y),
  ].reduce((product, factor) => multiplyMatrices(product, factor));

  const labelZone = svgData.labelZones[getArrowDirection(hold.type, rotation)] ?? svgData.labelZones['default'];

  return { svgData, matrix, transform, rotation, insert: { x: svgX, y: svgY }, labelZone };
}

/**
 * Compute the geometry of every hold.
 * Sequential is fine: loadHoldSvg reads from an in-memory cache and parseHoldSvg
 * is synchronous CPU work, so Promise.all would not parallelize anything in practice.
 */
async function computeAllHoldGeometries(holds: ComposedHold[], wallDimensions: Dimensions): Promise<HoldGeometry[]> {
  const geometries: HoldGeometry[] = [];
  for (const hold of holds) {
    // eslint-disable-next-line no-await-in-loop -- see the comment above: intentionally sequential
    geometries.push(await computeHoldGeometry(hold, wallDimensions));
  }
  return geometries;
}

/**
 * Generate the SVG of a single hold and of its orientation arrow
 */
function generateHold(
  hold: ComposedHold,
  geometry: HoldGeometry,
  wallDimensions: Dimensions
): { holdSvg: string; arrowSvg: string | null } {
  const { svgData, transform, insert } = geometry;
  const elements: string[] = [];

  // Colored path element (hold color already includes the route default from composeRoute)
  const holdColor = hold.color ?? FALLBACK_HOLD_COLOR;
  if (svgData.pathElement !== null) {
    elements.push(svgData.pathElement.replace(/<(path)/, `<$1 fill="${holdColor}"`));
  }

  // Additional elements (circles, or all visual elements for uncolored holds)
  elements.push(...svgData.additionalElements);

  // Data attributes for interactive selection
  const dataAttrs = [
    `data-source="${hold.sourceRoute}"`,
    `data-hold="${hold.originalHoldNumber}"`,
    `data-composed="${hold.composedHoldNumber}"`,
  ].join(' ');
  const holdSvg = `<g transform="${transform}" ${dataAttrs} class="hold">${elements.join('\n')}</g>`;

  // Arrow pointing to the target insert (if the hold type supports arrows)
  let arrowSvg: string | null = null;
  if (getHoldShowArrow(hold.type)) {
    const targetPos = getInsertPosition(hold.orientationPanel ?? hold.panel, hold.orientation, hold.laneOffset);

    // Same anchor offset as the hold: the arrow keeps its length and direction when the route moves
    if (hold.anchorOffset) {
      targetPos.x += hold.anchorOffset.x;
      targetPos.y += hold.anchorOffset.y;
    }

    const targetSvgPos = { x: targetPos.x, y: wallDimensions.height - targetPos.y };
    const arrowElements = generateArrowToTarget(insert, targetSvgPos, holdColor);
    if (arrowElements) {
      arrowSvg = arrowElements;
    }
  }

  return { holdSvg, arrowSvg };
}

/** Displayed text of a hold label: its translated label, else its composed number */
function holdLabelText(hold: ComposedHold, language: HoldLabelLanguage): string {
  return hold.label === undefined ? String(hold.composedHoldNumber) : formatHoldLabel(hold.label, language);
}

/** A zone rectangle's edges in wall SVG coordinates (mm), shared by rendering and label placement */
interface ZoneRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Where a smearing zone's rectangle lands on the wall. The single source of
 * geometry for both `generateSmearingZones` (rendering) and `layoutLabels`
 * (placement), so the two never drift apart.
 */
function computeZoneRect(zone: ComposedSmearingZone, wallDimensions: Dimensions): ZoneRect {
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

  const widthMm = zone.width * GRID.COLUMN_SPACING;
  const heightMm = zone.height * GRID.ROW_SPACING;

  // Convert to SVG coordinates (Y is inverted, origin at top-left)
  const left = basePos.x;
  const top = wallDimensions.height - basePos.y - heightMm; // Bottom-left corner in wall coords -> top-left in SVG

  return { left, right: left + widthMm, top, bottom: top + heightMm };
}

/**
 * Build the labels to place for the holds whose geometry is known.
 * @param holds - Composed holds, in the same order as `geometries`
 * @param geometries - Geometry of every hold (`computeAllHoldGeometries`)
 * @param outlines - Every hold's outline in wall coordinates, indexed like `geometries`
 * @param language - Language the displayed text is translated into
 */
function buildHoldLabelRequests(
  holds: ComposedHold[],
  geometries: HoldGeometry[],
  outlines: Point[][][],
  language: HoldLabelLanguage
): LabelRequest[] {
  const requests: LabelRequest[] = [];
  holds.forEach((hold, holdIndex) => {
    const text = holdLabelText(hold, language);
    // An empty label shows nothing, so it takes no room
    if (text === '') return;
    const geometry = geometries[holdIndex];
    requests.push({
      holdIndex,
      text,
      ownOutline: outlines[holdIndex],
      insert: geometry.insert,
      anchor: geometry.labelZone ? applyMatrix(geometry.matrix, geometry.labelZone.anchor) : geometry.insert,
      // Zone angle is an SVG rotate (clockwise); the hold rotation is counterclockwise
      angle: (geometry.labelZone?.angle ?? 0) - geometry.rotation,
    });
  });
  return requests;
}

/**
 * Place hold labels, then zone labels against them: shared by `layoutLabels`
 * and `generateSvg`, which both already have `geometries` in hand and must
 * not compute it twice.
 */
function computeLayout(
  holds: ComposedHold[],
  geometries: HoldGeometry[],
  wallDimensions: Dimensions,
  fontSize: number,
  language: HoldLabelLanguage,
  smearingZones: ComposedSmearingZone[]
): { holds: LabelPlacement[]; zones: ZoneLabelPlacement[] } {
  const outlines = geometries.map((geometry) =>
    geometry.svgData.outline.map((polygon) => polygon.map((p) => applyMatrix(geometry.matrix, p)))
  );

  const holdRequests = buildHoldLabelRequests(holds, geometries, outlines, language);
  const holdPlacements = placeHoldLabels(holdRequests, outlines, fontSize, {
    inserts: geometries.map((geometry) => geometry.insert),
    wall: wallDimensions,
  });

  const zoneRequests: ZoneLabelRequest[] = smearingZones.map((zone, zoneIndex) => {
    const rect = computeZoneRect(zone, wallDimensions);
    return {
      zoneIndex,
      text: formatSmearingZoneLabel(zone.label, language),
      zoneLeft: rect.left,
      zoneRight: rect.right,
      zoneBottom: rect.bottom,
    };
  });
  const zonePlacements = placeZoneLabels(zoneRequests, outlines, fontSize, {
    fixedLabels: holdPlacements.map((placement) => labelBox(placement.center, placement.width, placement.height, placement.angle)),
    wall: wallDimensions,
  });

  return { holds: holdPlacements, zones: zonePlacements };
}

/**
 * Place every hold label and smearing-zone label on the wall, in wall
 * coordinates. Hold labels are placed first, exactly as if zones did not
 * exist; zone labels are placed second and treat the placed hold-label boxes
 * as fixed obstacles. Exposed so placement can be tested and inspected
 * without parsing SVG.
 * @param smearingZones - Zones to place labels for (e.g. `zonesToRender` in `generateSvg`); no zone label is placed when `options.showSmearingZones` is `false`
 */
export async function layoutLabels(
  config: Config,
  holds: ComposedHold[],
  options: SvgOptions = {},
  smearingZones: ComposedSmearingZone[] = []
): Promise<{ holds: LabelPlacement[]; zones: ZoneLabelPlacement[] }> {
  const wallDimensions = getWallDimensions(config.wall.lanes, config.wall.panelsHeight);
  const geometries = await computeAllHoldGeometries(holds, wallDimensions);
  const showSmearingZones = options.showSmearingZones ?? DEFAULT_OPTIONS.showSmearingZones;
  return computeLayout(
    holds,
    geometries,
    wallDimensions,
    normalizeHoldLabelFontSize(options.holdLabelFontSize),
    options.holdLabelLanguage ?? DEFAULT_OPTIONS.holdLabelLanguage,
    showSmearingZones ? smearingZones : []
  );
}

/**
 * Place every hold label on the wall, in wall coordinates.
 * Exposed so placement can be tested and inspected without parsing SVG.
 */
export async function layoutHoldLabels(
  config: Config,
  holds: ComposedHold[],
  options: SvgOptions = {},
  smearingZones: ComposedSmearingZone[] = []
): Promise<LabelPlacement[]> {
  return (await layoutLabels(config, holds, options, smearingZones)).holds;
}

/**
 * Render a placed label in wall coordinates, outside the hold's group
 */
function renderHoldLabel(placement: LabelPlacement, color: string, fontSize: number): string {
  const { center, angle, text } = placement;
  return `<text x="${center.x}" y="${center.y}" transform="rotate(${angle}, ${center.x}, ${center.y})" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" font-family="'Lucida Grande', sans-serif" font-weight="500" fill="${color}">${text}</text>`;
}

/** Smearing zone rendering constants */
const SMEARING_ZONE_FILL_OPACITY = 0.2;
const SMEARING_ZONE_HATCH_OPACITY = 0.5;
const SMEARING_ZONE_HATCH_LINE_WIDTH = 0;
const SMEARING_ZONE_HATCH_SPACING = 40;
const SMEARING_ZONE_BORDER_WIDTH = 10;
const SMEARING_ZONE_BORDER_OPACITY = 0.3;

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
 * @param labelPlacements - One placement per zone, same order as `zones` (`computeLayout().zones`); its `text` is already translated, so the label is rendered from it rather than recomputed
 */
function generateSmearingZones(
  zones: ComposedSmearingZone[],
  wallDimensions: Dimensions,
  labelFontSize: number,
  labelPlacements: ZoneLabelPlacement[]
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

  zones.forEach((zone, zoneIndex) => {
    const rect = computeZoneRect(zone, wallDimensions);
    const widthMm = rect.right - rect.left;
    const heightMm = rect.bottom - rect.top;
    const patternId = getHatchPatternId(zone.color);
    const { center, text } = labelPlacements[zoneIndex];

    // Zone group with data attribute
    elements.push(`<g class="smearing-zone" data-label="${zone.label}">`);

    // Solid fill rectangle with opacity
    elements.push(`  <rect x="${rect.left}" y="${rect.top}" width="${widthMm}" height="${heightMm}" fill="${zone.color}" fill-opacity="${SMEARING_ZONE_FILL_OPACITY}" />`);

    // Hatched pattern overlay
    elements.push(`  <rect x="${rect.left}" y="${rect.top}" width="${widthMm}" height="${heightMm}" fill="url(#${patternId})" />`);

    // Border rectangle
    elements.push(`  <rect x="${rect.left}" y="${rect.top}" width="${widthMm}" height="${heightMm}" fill="none" stroke="${zone.color}" stroke-width="${SMEARING_ZONE_BORDER_WIDTH}" stroke-opacity="${SMEARING_ZONE_BORDER_OPACITY}" />`);

    // Label, placed by placeZoneLabels (slide right along the bottom edge, then drop)
    elements.push(`  <text x="${center.x}" y="${center.y}" text-anchor="middle" dominant-baseline="central" font-size="${labelFontSize}" font-family="'Lucida Grande', sans-serif" fill="${zone.color}" font-weight="bold">${text}</text>`);

    elements.push(`</g>`);
  });

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
  const holdLabelFontSize = normalizeHoldLabelFontSize(opts.holdLabelFontSize);
  const holdLabelLanguage = opts.holdLabelLanguage ?? DEFAULT_OPTIONS.holdLabelLanguage;
  const wallDimensions = getWallDimensions(config.wall.lanes, config.wall.panelsHeight);

  // Add margin for labels (needs to accommodate font size + panel labels)
  const margin = opts.showCoordinateLabels ? 80 : 0;
  const svgWidth = wallDimensions.width + margin * 2;
  const svgHeight = wallDimensions.height + margin * 2;

  const parts: string[] = [];

  // SVG header
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}mm" height="${svgHeight}mm" viewBox="${-margin} ${-margin} ${svgWidth} ${svgHeight}">`);

  // Hold geometry first: rendering and label placement (zone labels included) share it
  const geometries = await computeAllHoldGeometries(holds, wallDimensions);
  const holdResults = holds.map((hold, index) => generateHold(hold, geometries[index], wallDimensions));

  // Hold labels placed first, exactly as if zones did not exist; zone labels
  // placed second and treat the placed hold-label boxes as fixed obstacles
  const zonesToRender = opts.showSmearingZones ? smearingZones : [];
  const layout = computeLayout(holds, geometries, wallDimensions, holdLabelFontSize, holdLabelLanguage, zonesToRender);

  // Generate smearing zone patterns (need to be in defs before use)
  const { defs: zoneDefs, elements: zoneElements } = generateSmearingZones(
    zonesToRender,
    wallDimensions,
    holdLabelFontSize,
    layout.zones
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
  for (const { holdSvg } of holdResults) {
    parts.push(holdSvg);
  }
  parts.push(`</g>`);

  // Hold labels (separate layer so they appear on top)
  parts.push(`<g id="hold-labels">`);
  for (const placement of layout.holds) {
    parts.push(renderHoldLabel(placement, holds[placement.holdIndex].color ?? FALLBACK_HOLD_COLOR, holdLabelFontSize));
  }
  parts.push(`</g>`);

  // Close SVG
  parts.push(`</svg>`);

  return parts.join('\n');
}
