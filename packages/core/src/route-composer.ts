/**
 * Route composition from segments of reference routes
 */

import { type Hold, type ReferenceRoute, type ReferenceRoutes, type RouteSegment, type GeneratedRoute, type AnchorPosition, type PanelId, type InsertPosition, type ColumnSystem, type SmearingZone, type ComposedSmearingZone, type Column, type Row, type RouteColorMap, DEFAULT_COLUMN_SYSTEM, CANONICAL_COLUMN_SYSTEM, DEFAULT_COLOR_TAG } from './types.js';
import { parsePanelId, getInsertPosition, getAnchorMmPosition, parseInsertPosition as parseInsertPositionCore, convertColumn, GRID } from './plate-grid.js';
import { getHoldTypeColor } from './hold-svg-parser.js';

/** Last-resort hold color, used only when a route declares no color at all */
const FALLBACK_COLOR = '#FF0000';

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
 * Format: "PANEL TYPE POSITION ORIENTATION [@LABEL] [SCALE] [#COLORTAG]"
 * @param holdStr - Compact hold string
 * @param columnSystem - Column coordinate system for validation (default: ABC)
 */
export function parseHold(holdStr: string, columnSystem: ColumnSystem = DEFAULT_COLUMN_SYSTEM): Hold {
  const parts = holdStr.trim().split(/\s+/);
  if (parts.length < 4 || parts.length > 7) {
    throw new Error(`Invalid hold format: "${holdStr}". Expected "PANEL TYPE POSITION ORIENTATION [@LABEL] [SCALE] [#COLORTAG]"`);
  }

  const [panelStr, type, positionStr, orientationStr, ...rest] = parts;
  const panel = parsePanelId(panelStr);
  const orientation = parseOrientation(orientationStr, panel, columnSystem);

  let label: string | undefined;
  let scale: number | undefined;
  let colorTag: string | undefined;

  // Rejecting duplicates rather than letting the last one win: the trailing
  // tokens are order-free, so a repeated token is always an authoring mistake
  // and silently keeping one of them hides it
  const rejectDuplicate = (seen: unknown, kind: string) => {
    if (seen !== undefined) {
      throw new Error(`Duplicate ${kind} in hold: "${holdStr}". Expected at most one.`);
    }
  };

  for (const part of rest) {
    if (part.startsWith('@')) {
      rejectDuplicate(label, 'label');
      label = part.substring(1);
      if (!label) {
        throw new Error(`Invalid label: "${part}". Expected "@LABEL".`);
      }
    } else if (part.startsWith('#')) {
      // Checked before the numeric branch, otherwise parseFloat("#GREEN") is NaN
      // and the scale error below would fire with a misleading message
      rejectDuplicate(colorTag, 'color tag');
      colorTag = part.substring(1);
      if (!colorTag) {
        throw new Error(`Invalid color tag: "${part}". Expected "#COLORTAG".`);
      }
    } else {
      rejectDuplicate(scale, 'scale');
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
    colorTag,
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
 * Normalize a route's color declaration into a tag -> color map.
 * A single color string becomes `{ DEFAULT: color }`.
 */
export function getRouteColorMap(route: Pick<ReferenceRoute, 'color'>): RouteColorMap {
  return typeof route.color === 'string' ? { [DEFAULT_COLOR_TAG]: route.color } : route.color;
}

/**
 * Get the tag used by holds that carry no explicit color tag.
 * This is the first key of the color map, so declaration order is significant.
 */
export function getDefaultColorTag(route: Pick<ReferenceRoute, 'color'>): string {
  if (typeof route.color === 'string') return DEFAULT_COLOR_TAG;
  return Object.keys(route.color)[0] ?? DEFAULT_COLOR_TAG;
}

/**
 * Check that every color tag used by a route's holds and zones is declared in its
 * color map. Undeclared tags fall back to the default color at render time rather
 * than throwing, so this exists to catch typos in route data via tests and the CLI.
 * @returns Human-readable problems, empty when the route is consistent
 */
export function validateRouteColorTags(route: ReferenceRoute): string[] {
  const problems: string[] = [];
  const colorMap = getRouteColorMap(route);
  const declared = new Set(Object.keys(colorMap));

  if (declared.size === 0) {
    problems.push('Color map is empty: at least one color must be declared.');
    return problems;
  }

  const reportUnknown = (tag: string, origin: string) => {
    if (!declared.has(tag)) {
      problems.push(
        `Unknown color tag "${tag}" in ${origin}. Declared tags: ${[...declared].join(', ')}.`
      );
    }
  };

  const columnSystem = route.columns || DEFAULT_COLUMN_SYSTEM;
  for (const holdStr of route.holds) {
    // Report an unparsable hold rather than throwing: this is a diagnostic
    // helper, and a caller that loads routes should not lose a whole route to
    // one bad line. Composition reports the same error again, precisely.
    let colorTag: string | undefined;
    try {
      ({ colorTag } = parseHold(holdStr, columnSystem));
    } catch (error) {
      problems.push(`Unparsable hold "${holdStr}": ${(error as Error).message}`);
      continue;
    }
    if (colorTag) reportUnknown(colorTag, `hold "${holdStr}"`);
  }
  for (const zone of route.smearingZones ?? []) {
    if (zone.colorTag) reportUnknown(zone.colorTag, `smearing zone "${zone.label}"`);
  }

  return problems;
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

/**
 * Resolve the color of a single hold or smearing zone.
 *
 * Precedence: an explicit color tag wins, then a color forced by the hold type
 * (finish pads), then the segment's overrides, then the route's own colors.
 *
 * The segment branches on the *presence* of `colors`, not its content: a merged
 * rule would let a stale uniform `color` bleed into the tags a partial override
 * map does not cover. As a result `colors: {}` means "route colors, no override".
 *
 * @param segment - Route segment, possibly carrying color overrides
 * @param routeMap - The route's normalized tag -> color map
 * @param defaultTag - Tag applied to items carrying no explicit tag
 * @param tag - The item's own color tag, if any
 * @param holdType - Hold type, omitted for smearing zones
 */
function resolveItemColor(
  segment: RouteSegment,
  routeMap: RouteColorMap,
  defaultTag: string,
  tag: string | undefined,
  holdType?: string
): string {
  if (!tag && holdType !== undefined) {
    const typeColor = getHoldTypeColor(holdType);
    if (typeColor) return typeColor;
  }

  const resolvedTag = tag ?? defaultTag;
  // The last fallback only fires on an empty color map, which the schema forbids
  // and validateRouteColorTags reports; render something rather than crash
  const routeColor =
    lookupColor(routeMap, resolvedTag) ?? lookupColor(routeMap, defaultTag) ?? FALLBACK_COLOR;

  return segment.colors === undefined
    ? segment.color ?? routeColor       // legacy uniform mode
    : lookupColor(segment.colors, resolvedTag) ?? routeColor;  // per-tag mode
}

/**
 * Read a color out of a tag map without ever reaching the prototype chain.
 * A plain `map[tag]` would return a Function for tags such as "constructor" or
 * "toString" - names the schema's tag pattern allows - and the `??` fallback
 * would not fire, injecting that Function into the SVG fill attribute.
 */
function lookupColor(map: RouteColorMap, tag: string): string | undefined {
  return Object.hasOwn(map, tag) ? map[tag] : undefined;
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
  const routeColorMap = getRouteColorMap(route);
  const defaultColorTag = getDefaultColorTag(route);

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
      color: resolveItemColor(segment, routeColorMap, defaultColorTag, hold.colorTag, hold.type),
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
  const routeColorMap = getRouteColorMap(route);
  const defaultColorTag = getDefaultColorTag(route);
  const routeColumnSystem = route.columns || DEFAULT_COLUMN_SYSTEM;

  // Calculate anchor offset if segment has anchor
  let anchorOffset: MmOffset | undefined;
  if (segment.anchor && selectedHolds.length > 0) {
    const [firstHold] = selectedHolds;
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
      colorTag: zone.colorTag,
      // Zones carry no hold type, so no type-forced color applies
      color: resolveItemColor(segment, routeColorMap, defaultColorTag, zone.colorTag),
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

  // Slice composed holds per segment using count from extractHolds,
  // rather than matching by source+laneOffset (which breaks when two segments
  // share the same source and laneOffset).
  let holdIndex = 0;
  for (const segment of segments) {
    const segmentHoldCount = extractHolds(segment, routes).length;
    const segmentHolds = composedHolds.slice(holdIndex, holdIndex + segmentHoldCount);
    holdIndex += segmentHoldCount;

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
    // Count holds for this route using extractHolds — the single source of truth
    // for fromHold/toHold resolution (including string labels) and excludeHolds filtering.
    const routeHoldCount = route.segments.reduce(
      (count, segment) => count + extractHolds(segment, routes).length,
      0
    );

    const routeHolds = allComposedHolds.slice(holdIndex, holdIndex + routeHoldCount);
    holdIndex += routeHoldCount;

    const zones = composeSmearingZones(route.segments, routes, routeHolds);
    allZones.push(...zones);
  }

  return allZones;
}
