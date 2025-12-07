/**
 * Route composition from segments of reference routes
 */
import { parsePanelId, getInsertPosition } from './plate-grid.js';
/**
 * Parse an insert position string (e.g., "A1", "F10") into an InsertPosition object
 */
function parseInsertPosition(posStr) {
    const match = posStr.match(/^([A-L])(\d+)$/i);
    if (!match) {
        throw new Error(`Invalid position: "${posStr}". Expected format: A1, F10, etc.`);
    }
    return {
        column: match[1].toUpperCase(),
        row: parseInt(match[2], 10),
    };
}
/**
 * Parse an orientation string that may include a panel reference
 * Format: "F4" (same panel) or "DX1:F4" (explicit panel)
 */
function parseOrientation(orientationStr, defaultPanel) {
    const colonIndex = orientationStr.indexOf(':');
    if (colonIndex > 0) {
        const panelStr = orientationStr.substring(0, colonIndex);
        const posStr = orientationStr.substring(colonIndex + 1);
        return {
            position: parseInsertPosition(posStr),
            panel: parsePanelId(panelStr),
        };
    }
    return {
        position: parseInsertPosition(orientationStr),
    };
}
/**
 * Parse a compact hold string into a Hold object
 * Format: "PANEL TYPE POSITION ORIENTATION [@LABEL] [SCALE]"
 */
export function parseHold(holdStr) {
    const parts = holdStr.trim().split(/\s+/);
    if (parts.length < 4 || parts.length > 6) {
        throw new Error(`Invalid hold format: "${holdStr}". Expected "PANEL TYPE POSITION ORIENTATION [@LABEL] [SCALE]"`);
    }
    const [panelStr, type, positionStr, orientationStr, ...rest] = parts;
    const panel = parsePanelId(panelStr);
    const orientation = parseOrientation(orientationStr, panel);
    let label;
    let scale;
    for (const part of rest) {
        if (part.startsWith('@')) {
            label = part.substring(1);
        }
        else {
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
        position: parseInsertPosition(positionStr),
        orientation: orientation.position,
        orientationPanel: orientation.panel,
        scale,
        label,
    };
}
/**
 * Get all parsed holds from a reference route
 */
export function getRouteHolds(route) {
    return route.holds.map(parseHold);
}
/**
 * Calculate offset in mm between a hold position and an anchor position
 */
function calculateMmOffset(holdPanel, holdPosition, anchor, laneOffset) {
    const anchorPanel = parsePanelId(anchor.panel);
    const holdMm = getInsertPosition(holdPanel, holdPosition, laneOffset);
    const anchorMm = getInsertPosition(anchorPanel, { column: anchor.column, row: anchor.row }, laneOffset);
    return {
        x: anchorMm.x - holdMm.x,
        y: anchorMm.y - holdMm.y,
    };
}
/**
 * Extract holds from a reference route for a given segment
 * @param segment - Route segment configuration
 * @param routes - Available reference routes
 * @returns Array of holds with source information
 */
export function extractHolds(segment, routes) {
    const route = routes[segment.source.toLowerCase()];
    if (!route) {
        throw new Error(`Unknown reference route: ${segment.source}`);
    }
    const holds = getRouteHolds(route);
    const findHoldIndex = (ref, defaultValue) => {
        if (ref === undefined)
            return defaultValue;
        if (typeof ref === 'number')
            return ref;
        const idx = holds.findIndex(h => h.label === ref);
        if (idx === -1) {
            throw new Error(`Hold with label "${ref}" not found in route "${segment.source}"`);
        }
        return idx + 1;
    };
    const from = findHoldIndex(segment.fromHold, 1);
    const to = findHoldIndex(segment.toHold, holds.length);
    const laneOffset = segment.laneOffset ?? 0;
    const excludeNumbers = new Set();
    const excludeLabels = new Set();
    for (const exc of segment.excludeHolds ?? []) {
        if (typeof exc === 'number') {
            excludeNumbers.add(exc);
        }
        else {
            excludeLabels.add(exc);
        }
    }
    if (from < 1 || to > holds.length) {
        throw new Error(`Hold range ${from}-${to} is out of bounds for route "${segment.source}" (has ${holds.length} holds)`);
    }
    let anchorOffset;
    if (segment.anchor) {
        const firstHold = holds[from - 1];
        anchorOffset = calculateMmOffset(firstHold.panel, firstHold.position, segment.anchor, laneOffset);
    }
    const result = [];
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
export function composeRoute(segments, routes) {
    const composedHolds = [];
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
export function composeAllRoutes(generatedRoutes, routes) {
    const allHolds = [];
    for (const route of generatedRoutes) {
        const composedHolds = composeRoute(route.segments, routes);
        allHolds.push(...composedHolds);
    }
    return allHolds;
}
//# sourceMappingURL=route-composer.js.map