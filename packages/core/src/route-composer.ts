/**
 * Route composition from segments of reference routes
 */

import type { Hold, ReferenceRoute, ReferenceRoutes, RouteSegment, GeneratedRoute, AnchorPosition, PanelId, InsertPosition, ColumnSystem, SmearingZone, ComposedSmearingZone, Column, Row } from './types.js';
import { DEFAULT_COLUMN_SYSTEM, CANONICAL_COLUMN_SYSTEM } from './types.js';
import { parsePanelId, getInsertPosition, getAnchorMmPosition, parseInsertPosition as parseInsertPositionCore, convertColumn, GRID } from './plate-grid.js';

/** Offset in mm for anchor-based positioning */
interface MmOffset {
  x: number;
  y: number;
}

/**
 * Parse an insert position string (e.g., "A1", "F10") into an InsertPosition object
 * @param posStr - Position string
 * @param columnSystem - Column coordinate system for validation
 */
function parseInsertPositionWithSystem(posStr: string, columnSystem: ColumnSystem): InsertPosition {
  return parseInsertPositionCore(posStr, columnSystem);
}

/**
 * Parse an orientation string that may include a panel reference
 * Format: "F4" (same panel) or "DX1:F4" (explicit panel)
 * @param orientationStr - Orientation string
 * @param defaultPanel - Default panel if not specified
 * @param columnSystem - Column coordinate system for validation
 */
function parseOrientation(
  orientationStr: string,
  defaultPanel: PanelId,
  columnSystem: ColumnSystem
): { position: InsertPosition; panel?: PanelId } {
  const colonIndex = orientationStr.indexOf(':');
  if (colonIndex > 0) {
    const panelStr = orientationStr.substring(0, colonIndex);
    const posStr = orientationStr.substring(colonIndex + 1);
    return {
      position: parseInsertPositionWithSystem(posStr, columnSystem),
      panel: parsePanelId(panelStr),
    };
  }
  return {
    position: parseInsertPositionWithSystem(orientationStr, columnSystem),
  };
}

/**
 * Parse a compact hold string into a Hold object
 * Format: "PANEL TYPE POSITION ORIENTATION [@LABEL] [SCALE]"
 * @param holdStr - Compact hold string
 * @param columnSystem - Column coordinate system for validation (default: ABC)
 */
export function parseHold(holdStr: string, columnSystem: ColumnSystem = DEFAULT_COLUMN_SYSTEM): Hold {
  const parts = holdStr.trim().split(/\s+/);
  if (parts.length < 4 || parts.length > 6) {
    throw new Error(`Invalid hold format: "${holdStr}". Expected "PANEL TYPE POSITION ORIENTATION [@LABEL] [SCALE]"`);
  }

  const [panelStr, type, positionStr, orientationStr, ...rest] = parts;
  const panel = parsePanelId(panelStr);
  const orientation = parseOrientation(orientationStr, panel, columnSystem);

  let label: string | undefined;
  let scale: number | undefined;

  for (const part of rest) {
    if (part.startsWith('@')) {
      label = part.substring(1);
    } else {
      const parsed = parseFloat(part);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error(`Invalid scale value: "${part}". Expected a positive number.`);
      }
      scale = parsed;
    }
  }

  return {
    panel,
    type: type.toUpperCase(),
    position: parseInsertPositionWithSystem(positionStr, columnSystem),
    orientation: orientation.position,
    orientationPanel: orientation.panel,
    scale,
    label,
  };
}

/**
 * Get all parsed holds from a reference route
 */
export function getRouteHolds(route: ReferenceRoute): Hold[] {
  const columnSystem = route.columns || DEFAULT_COLUMN_SYSTEM;
  return route.holds.map(holdStr => parseHold(holdStr, columnSystem));
}

/**
 * Calculate offset in mm between a hold position and an anchor position
 */
function calculateMmOffset(
  holdPanel: PanelId,
  holdPosition: InsertPosition,
  anchor: AnchorPosition,
  laneOffset: number
): MmOffset {
  const anchorPanel = parsePanelId(anchor.panel);
  const holdMm = getInsertPosition(holdPanel, holdPosition, laneOffset);
  const anchorMm = getAnchorMmPosition(anchorPanel, { column: anchor.column, row: anchor.row }, laneOffset);

  return {
    x: anchorMm.x - holdMm.x,
    y: anchorMm.y - holdMm.y,
  };
}

/** A hold with its source route information */
export interface ComposedHold extends Hold {
  sourceRoute: string;
  originalHoldNumber: number;
  composedHoldNumber: number;
  laneOffset: number;
  holdScale: number;
  color?: string;
  anchorOffset?: MmOffset;
}

/**
 * Extract holds from a reference route for a given segment
 * @param segment - Route segment configuration
 * @param routes - Available reference routes
 * @returns Array of holds with source information
 */
export function extractHolds(segment: RouteSegment, routes: ReferenceRoutes): ComposedHold[] {
  const route = routes[segment.source.toLowerCase()];
  if (!route) {
    throw new Error(`Unknown reference route: ${segment.source}`);
  }

  const holds = getRouteHolds(route);

  const findHoldIndex = (ref: number | string | undefined, defaultValue: number): number => {
    if (ref === undefined) return defaultValue;
    if (typeof ref === 'number') return ref;
    const idx = holds.findIndex(h => h.label === ref);
    if (idx === -1) {
      throw new Error(`Hold with label "${ref}" not found in route "${segment.source}"`);
    }
    return idx + 1;
  };

  const from = findHoldIndex(segment.fromHold, 1);
  const to = findHoldIndex(segment.toHold, holds.length);
  const laneOffset = segment.laneOffset ?? 0;

  const excludeNumbers = new Set<number>();
  const excludeLabels = new Set<string>();
  for (const exc of segment.excludeHolds ?? []) {
    if (typeof exc === 'number') {
      excludeNumbers.add(exc);
    } else {
      excludeLabels.add(exc);
    }
  }

  if (from < 1 || to > holds.length) {
    throw new Error(
      `Hold range ${from}-${to} is out of bounds for route "${segment.source}" (has ${holds.length} holds)`
    );
  }

  let anchorOffset: MmOffset | undefined;
  if (segment.anchor) {
    const firstHold = holds[from - 1];
    anchorOffset = calculateMmOffset(firstHold.panel, firstHold.position, segment.anchor, laneOffset);
  }

  const result: ComposedHold[] = [];
  for (let i = from - 1; i < to; i++) {
    const holdNumber = i + 1;
    const hold = holds[i];

    if (excludeNumbers.has(holdNumber) || (hold.label && excludeLabels.has(hold.label))) {
      continue;
    }

    const typeScale = route.holdScales?.[hold.type];
    const holdScale = hold.scale ?? typeScale ?? 1.0;

    result.push({
      ...hold,
      sourceRoute: segment.source,
      originalHoldNumber: holdNumber,
      composedHoldNumber: 0,
      laneOffset,
      holdScale,
      color: segment.color ?? route.color, // Use segment color override or route's default color
      anchorOffset,
    });
  }

  return result;
}

/**
 * Compose a route from multiple segments
 * @param segments - Route segments to compose
 * @param routes - Available reference routes
 * @returns Array of composed holds
 */
export function composeRoute(segments: RouteSegment[], routes: ReferenceRoutes): ComposedHold[] {
  const composedHolds: ComposedHold[] = [];
  let holdNumber = 1;

  for (const segment of segments) {
    const holds = extractHolds(segment, routes);

    for (const hold of holds) {
      hold.composedHoldNumber = holdNumber++;
      composedHolds.push(hold);
    }
  }

  return composedHolds;
}

/**
 * Compose all routes from configuration
 * @param generatedRoutes - Array of generated route configurations
 * @param routes - Available reference routes
 * @returns Array of all composed holds
 */
export function composeAllRoutes(generatedRoutes: GeneratedRoute[], routes: ReferenceRoutes): ComposedHold[] {
  const allHolds: ComposedHold[] = [];

  for (const route of generatedRoutes) {
    const composedHolds = composeRoute(route.segments, routes);
    allHolds.push(...composedHolds);
  }

  return allHolds;
}

/**
 * Check if a smearing zone overlaps vertically with the selected holds
 * Zone is included if it starts before the highest hold AND ends after the lowest hold
 * @param zone - Smearing zone to check (column must be in canonical system)
 * @param holds - Selected holds to check overlap with
 * @param laneOffset - Lane offset for position calculation
 * @returns true if zone should be included
 */
function shouldIncludeZone(zone: SmearingZone & { canonicalColumn: Column }, holds: Hold[], laneOffset: number): boolean {
  if (holds.length === 0) return false;

  // Get Y positions of all holds
  const holdYPositions = holds.map(h => getInsertPosition(h.panel, h.position, laneOffset).y);
  const minHoldY = Math.min(...holdYPositions);
  const maxHoldY = Math.max(...holdYPositions);

  // Get Y range of zone (using canonical column)
  const zonePanel = parsePanelId(zone.panel);
  // Handle decimal row values: use integer part for base position, add fractional offset
  const integerRow = Math.floor(zone.row) as Row;
  const fractionalRowOffset = (zone.row - integerRow) * GRID.ROW_SPACING;
  const zoneBaseY = getInsertPosition(zonePanel, { column: zone.canonicalColumn, row: integerRow }, laneOffset).y + fractionalRowOffset;
  const zoneTopY = zoneBaseY + zone.height * GRID.ROW_SPACING;

  // Zone overlaps if it starts before highest hold AND ends after lowest hold
  return zoneBaseY <= maxHoldY && zoneTopY >= minHoldY;
}

/**
 * Extract smearing zones from a reference route for a given segment
 * Zones are filtered based on vertical overlap with selected holds
 * @param segment - Route segment configuration
 * @param routes - Available reference routes
 * @param selectedHolds - Holds that were selected for this segment
 * @returns Array of composed smearing zones
 */
export function extractSmearingZones(
  segment: RouteSegment,
  routes: ReferenceRoutes,
  selectedHolds: Hold[]
): ComposedSmearingZone[] {
  const route = routes[segment.source.toLowerCase()];
  if (!route) {
    return [];
  }

  const zones = route.smearingZones ?? [];
  if (zones.length === 0) {
    return [];
  }

  const laneOffset = segment.laneOffset ?? 0;
  const color = segment.color ?? route.color;
  const routeColumnSystem = route.columns || DEFAULT_COLUMN_SYSTEM;

  // Calculate anchor offset if segment has anchor
  let anchorOffset: MmOffset | undefined;
  if (segment.anchor && selectedHolds.length > 0) {
    const firstHold = selectedHolds[0];
    anchorOffset = calculateMmOffset(firstHold.panel, firstHold.position, segment.anchor, laneOffset);
  }

  // Filter zones by vertical overlap with selected holds
  // If no fromHold/toHold specified (full route), include all zones
  const hasHoldFilter = segment.fromHold !== undefined || segment.toHold !== undefined;

  // First convert zone columns to canonical system (needed for filtering)
  const zonesWithCanonicalColumn = zones.map(zone => ({
    ...zone,
    canonicalColumn: convertColumn(zone.column, routeColumnSystem, CANONICAL_COLUMN_SYSTEM),
  }));

  // Filter and convert zone columns from route's coordinate system to canonical system
  return zonesWithCanonicalColumn
    .filter(zone => !hasHoldFilter || shouldIncludeZone(zone, selectedHolds, laneOffset))
    .map(zone => ({
      label: zone.label,
      panel: zone.panel,
      row: zone.row,
      width: zone.width,
      height: zone.height,
      // Use the canonical column
      column: zone.canonicalColumn,
      // Pass through columnOffset if present
      columnOffset: zone.columnOffset,
      color,
      anchorOffset,
      laneOffset,
    }));
}

/**
 * Compose smearing zones from a route's segments
 * @param segments - Route segments to compose
 * @param routes - Available reference routes
 * @param composedHolds - Already composed holds (used for filtering)
 * @returns Array of composed smearing zones
 */
export function composeSmearingZones(
  segments: RouteSegment[],
  routes: ReferenceRoutes,
  composedHolds: ComposedHold[]
): ComposedSmearingZone[] {
  const allZones: ComposedSmearingZone[] = [];

  // Group composed holds by segment source and lane offset for filtering
  let holdIndex = 0;
  for (const segment of segments) {
    // Count how many holds came from this segment
    const segmentHolds: ComposedHold[] = [];
    while (holdIndex < composedHolds.length) {
      const hold = composedHolds[holdIndex];
      if (hold.sourceRoute.toLowerCase() === segment.source.toLowerCase() &&
          hold.laneOffset === (segment.laneOffset ?? 0)) {
        segmentHolds.push(hold);
        holdIndex++;
      } else {
        break;
      }
    }

    const zones = extractSmearingZones(segment, routes, segmentHolds);
    allZones.push(...zones);
  }

  return allZones;
}

/**
 * Compose all smearing zones from configuration
 * @param generatedRoutes - Array of generated route configurations
 * @param routes - Available reference routes
 * @param allComposedHolds - All composed holds (for filtering)
 * @returns Array of all composed smearing zones
 */
export function composeAllSmearingZones(
  generatedRoutes: GeneratedRoute[],
  routes: ReferenceRoutes,
  allComposedHolds: ComposedHold[]
): ComposedSmearingZone[] {
  const allZones: ComposedSmearingZone[] = [];
  let holdIndex = 0;

  for (const route of generatedRoutes) {
    // Count holds for this route
    const routeHoldCount = route.segments.reduce((count, segment) => {
      const sourceRoute = routes[segment.source.toLowerCase()];
      if (!sourceRoute) return count;
      const holds = getRouteHolds(sourceRoute);
      const from = typeof segment.fromHold === 'number' ? segment.fromHold : 1;
      const to = typeof segment.toHold === 'number' ? segment.toHold : holds.length;
      const excludeCount = segment.excludeHolds?.length ?? 0;
      return count + (to - from + 1) - excludeCount;
    }, 0);

    const routeHolds = allComposedHolds.slice(holdIndex, holdIndex + routeHoldCount);
    holdIndex += routeHoldCount;

    const zones = composeSmearingZones(route.segments, routes, routeHolds);
    allZones.push(...zones);
  }

  return allZones;
}
