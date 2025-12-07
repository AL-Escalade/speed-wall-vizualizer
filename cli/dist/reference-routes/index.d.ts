/**
 * Reference routes loader
 * Loads routes from JSON configuration files
 */
import type { ReferenceRoute, ReferenceRoutes, Hold } from '@voie-vitesse/core';
/**
 * Load all routes from a directory
 * @param routesDir - Directory containing route JSON files
 * @returns Map of route names to route definitions
 */
export declare function loadRoutes(routesDir?: string): ReferenceRoutes;
/**
 * Clear the routes cache (useful for testing or reloading)
 */
export declare function clearRoutesCache(): void;
/**
 * Get all available reference routes
 */
export declare function getReferenceRoutes(): ReferenceRoutes;
/**
 * Parse a compact hold string into a Hold object
 * Format: "PANEL TYPE POSITION ORIENTATION [@LABEL] [SCALE]"
 * - ORIENTATION can be "F4" (same panel) or "DX1:F4" (explicit panel)
 * - LABEL is optional, prefixed with @ (e.g., @M1, @P2)
 * - SCALE is optional (default: 1.0)
 * Example: "DX2 BIG F1 D3" or "DX2 BIG F10 DX1:C1 @M5 0.5"
 *
 * @param holdStr - Compact hold string
 * @returns Parsed Hold object
 */
export declare function parseHold(holdStr: string): Hold;
/**
 * Get all parsed holds from a reference route
 * @param route - Reference route
 * @returns Array of parsed Hold objects
 */
export declare function getRouteHolds(route: ReferenceRoute): Hold[];
/**
 * Get a reference route by name
 * @param name - Route name (e.g., "ifsc", "u15", "u11-u13")
 * @returns Reference route or undefined
 */
export declare function getReferenceRoute(name: string): ReferenceRoute | undefined;
/**
 * Get list of available route names
 * @returns Array of route names
 */
export declare function getAvailableRouteNames(): string[];
