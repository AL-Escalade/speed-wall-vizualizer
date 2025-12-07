/**
 * Route composition from segments of reference routes
 */
import type { Hold, ReferenceRoute, ReferenceRoutes, RouteSegment, GeneratedRoute } from './types.js';
/** Offset in mm for anchor-based positioning */
interface MmOffset {
    x: number;
    y: number;
}
/**
 * Parse a compact hold string into a Hold object
 * Format: "PANEL TYPE POSITION ORIENTATION [@LABEL] [SCALE]"
 */
export declare function parseHold(holdStr: string): Hold;
/**
 * Get all parsed holds from a reference route
 */
export declare function getRouteHolds(route: ReferenceRoute): Hold[];
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
export declare function extractHolds(segment: RouteSegment, routes: ReferenceRoutes): ComposedHold[];
/**
 * Compose a route from multiple segments
 * @param segments - Route segments to compose
 * @param routes - Available reference routes
 * @returns Array of composed holds
 */
export declare function composeRoute(segments: RouteSegment[], routes: ReferenceRoutes): ComposedHold[];
/**
 * Compose all routes from configuration
 * @param generatedRoutes - Array of generated route configurations
 * @param routes - Available reference routes
 * @returns Array of all composed holds
 */
export declare function composeAllRoutes(generatedRoutes: GeneratedRoute[], routes: ReferenceRoutes): ComposedHold[];
export {};
//# sourceMappingURL=route-composer.d.ts.map