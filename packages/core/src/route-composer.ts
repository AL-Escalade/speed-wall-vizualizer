/**
 * Route composition from segments of reference routes
 */

import type { Hold, ReferenceRoute, ReferenceRoutes, RouteSegment, GeneratedRoute, AnchorPosition, PanelId, InsertPosition, ColumnSystem } from './types.js';
import { DEFAULT_COLUMN_SYSTEM } from './types.js';
import { parsePanelId, getInsertPosition, parseInsertPosition as parseInsertPositionCore, validateColumn } from './plate-grid.js';

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
  const anchorMm = getInsertPosition(anchorPanel, { column: anchor.column, row: anchor.row }, laneOffset);

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
