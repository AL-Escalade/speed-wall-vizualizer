/**
 * Route composition from segments of reference routes
 */

import type { Hold, PanelSide, ReferenceRoute, RouteSegment, GeneratedRoute, AnchorPosition, Column, Row, PanelNumber, PanelId, InsertPosition, Point } from './types.js';
import { getReferenceRoute, getRouteHolds } from './reference-routes/index.js';
import { COLUMNS, COLUMN_INDEX, parsePanelId, getInsertPosition } from './plate-grid.js';

/** Offset in mm for anchor-based positioning */
interface MmOffset {
  x: number;
  y: number;
}

/**
 * Calculate offset in mm between a hold position and an anchor position
 * @param holdPanel - Panel of the first hold
 * @param holdPosition - Position of the first hold
 * @param anchor - Target anchor position
 * @param laneOffset - Lane offset of the segment
 * @returns Offset in mm to apply to all holds
 */
function calculateMmOffset(
  holdPanel: PanelId,
  holdPosition: InsertPosition,
  anchor: AnchorPosition,
  laneOffset: number
): MmOffset {
  const anchorPanel = parsePanelId(anchor.panel);

  // Calculate positions in mm
  const holdMm = getInsertPosition(holdPanel, holdPosition, laneOffset);
  const anchorMm = getInsertPosition(anchorPanel, { column: anchor.column, row: anchor.row }, laneOffset);

  return {
    x: anchorMm.x - holdMm.x,
    y: anchorMm.y - holdMm.y,
  };
}

/** A hold with its source route information */
export interface ComposedHold extends Hold {
  /** Source reference route name */
  sourceRoute: string;
  /** Original hold number in source route (1-based) */
  originalHoldNumber: number;
  /** Hold number in composed route (1-based) */
  composedHoldNumber: number;
  /** Lane offset for positioning (0 = leftmost lane) */
  laneOffset: number;
  /** Scale factor for this hold (1.0 = full size). Default: 1.0 */
  holdScale: number;
  /** Override color for this hold (from segment) */
  color?: string;
  /** Anchor offset in mm (applied after calculating base position) */
  anchorOffset?: MmOffset;
}

/**
 * Extract holds from a reference route for a given segment
 * @param segment - Route segment configuration
 * @returns Array of holds with source information
 */
export function extractHolds(segment: RouteSegment): ComposedHold[] {
  const route = getReferenceRoute(segment.source);
  if (!route) {
    throw new Error(`Unknown reference route: ${segment.source}`);
  }

  const holds = getRouteHolds(route);

  // Helper to find hold index by number or label
  const findHoldIndex = (ref: number | string | undefined, defaultValue: number): number => {
    if (ref === undefined) return defaultValue;
    if (typeof ref === 'number') return ref;
    // Search by label
    const idx = holds.findIndex(h => h.label === ref);
    if (idx === -1) {
      throw new Error(`Hold with label "${ref}" not found in route "${segment.source}"`);
    }
    return idx + 1; // Convert to 1-based
  };

  // Apply defaults
  const from = findHoldIndex(segment.fromHold, 1);
  const to = findHoldIndex(segment.toHold, holds.length);
  const laneOffset = segment.laneOffset ?? 0;

  // Build sets for excluded hold numbers and labels
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

  // Calculate mm offset if anchor is specified
  let anchorOffset: MmOffset | undefined;
  if (segment.anchor) {
    const firstHold = holds[from - 1];
    anchorOffset = calculateMmOffset(firstHold.panel, firstHold.position, segment.anchor, laneOffset);
  }

  const result: ComposedHold[] = [];
  for (let i = from - 1; i < to; i++) {
    const holdNumber = i + 1;
    const hold = holds[i];

    // Skip excluded holds (by number or label)
    if (excludeNumbers.has(holdNumber) || (hold.label && excludeLabels.has(hold.label))) {
      continue;
    }

    // Priority: per-hold scale > route holdScales[type] > 1.0
    const typeScale = route.holdScales?.[hold.type];
    const holdScale = hold.scale ?? typeScale ?? 1.0;

    result.push({
      ...hold,
      sourceRoute: segment.source,
      originalHoldNumber: holdNumber,
      composedHoldNumber: 0, // Will be set by composeRoute
      laneOffset,
      holdScale,
      color: segment.color, // Pass through segment color override
      anchorOffset, // Apply same mm offset to all holds
    });
  }

  return result;
}

/**
 * Compose a route from multiple segments
 * @param segments - Route segments to compose
 * @returns Array of composed holds
 */
export function composeRoute(segments: RouteSegment[]): ComposedHold[] {
  const composedHolds: ComposedHold[] = [];
  let holdNumber = 1;

  for (const segment of segments) {
    const holds = extractHolds(segment);

    for (const hold of holds) {
      // Update the composed hold number
      hold.composedHoldNumber = holdNumber++;
      composedHolds.push(hold);
    }
  }

  return composedHolds;
}

/**
 * Compose all routes from configuration
 * @param routes - Array of generated route configurations
 * @returns Array of all composed holds
 */
export function composeAllRoutes(routes: GeneratedRoute[]): ComposedHold[] {
  const allHolds: ComposedHold[] = [];

  for (const route of routes) {
    const composedHolds = composeRoute(route.segments);
    allHolds.push(...composedHolds);
  }

  return allHolds;
}
