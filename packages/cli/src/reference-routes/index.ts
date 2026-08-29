/**
 * Reference routes loader
 * Loads routes from JSON configuration files
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { type ReferenceRoute, type ReferenceRoutes, type Hold, type ColumnSystem, COLUMN_SYSTEMS, parseHold as coreParseHold, validateRouteColorTags } from '@voie-vitesse/core';

/**
 * Column system assumed when a route declares none.
 * Differs from core's default (FFME) for backwards compatibility with CLI callers.
 */
const CLI_DEFAULT_COLUMN_SYSTEM: ColumnSystem = COLUMN_SYSTEMS.ABC;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Default routes directory */
const DEFAULT_ROUTES_DIR = join(__dirname, '../../../../data/routes');

/** Cache for loaded routes */
let routesCache: ReferenceRoutes | null = null;
let routesDirCache: string | null = null;

/**
 * Load a single route from a JSON file
 * @param filePath - Path to the JSON file
 * @returns Parsed reference route
 */
function loadRouteFromFile(filePath: string): ReferenceRoute {
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  const route: ReferenceRoute = {
    color: data.color,
    holdScales: data.holdScales,
    columns: data.columns,
    holds: data.holds,
    // Was dropped, so CLI output never showed smearing zones while the web app
    // did, and validateRouteColorTags below could not see their color tags
    smearingZones: data.smearingZones,
    reference: data.reference,
  };

  // Undeclared tags fall back to the default color rather than throwing, so
  // surface them here where the author can act on them
  for (const problem of validateRouteColorTags(route)) {
    console.error(`Route ${filePath}: ${problem}`);
  }

  return route;
}

/**
 * Load all routes from a directory
 * @param routesDir - Directory containing route JSON files
 * @returns Map of route names to route definitions
 */
export function loadRoutes(routesDir: string = DEFAULT_ROUTES_DIR): ReferenceRoutes {
  // Return cached routes if same directory
  if (routesCache && routesDirCache === routesDir) {
    return routesCache;
  }

  const routes: ReferenceRoutes = {};

  if (!existsSync(routesDir)) {
    console.warn(`Routes directory not found: ${routesDir}`);
    return routes;
  }

  const files = readdirSync(routesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = join(routesDir, file);
    const routeName = file.replace('.json', '');

    try {
      routes[routeName] = loadRouteFromFile(filePath);
    } catch (error) {
      console.error(`Error loading route ${file}:`, error);
    }
  }

  // Cache the loaded routes
  routesCache = routes;
  routesDirCache = routesDir;

  return routes;
}

/**
 * Clear the routes cache (useful for testing or reloading)
 */
export function clearRoutesCache(): void {
  routesCache = null;
  routesDirCache = null;
}

/**
 * Get all available reference routes
 */
export function getReferenceRoutes(): ReferenceRoutes {
  return loadRoutes();
}

/**
 * Parse a compact hold string into a Hold object
 * Format: "PANEL TYPE POSITION ORIENTATION [@LABEL] [SCALE] [#COLORTAG]"
 *
 * Delegates to the core parser; the only CLI-specific behavior is the default
 * column system, which is ABC here and FFME in core.
 *
 * @param holdStr - Compact hold string
 * @param columnSystem - Column coordinate system for validation (default: ABC)
 * @returns Parsed Hold object
 */
export function parseHold(holdStr: string, columnSystem: ColumnSystem = CLI_DEFAULT_COLUMN_SYSTEM): Hold {
  return coreParseHold(holdStr, columnSystem);
}

/**
 * Get all parsed holds from a reference route
 * @param route - Reference route
 * @returns Array of parsed Hold objects
 */
export function getRouteHolds(route: ReferenceRoute): Hold[] {
  const columnSystem = route.columns || CLI_DEFAULT_COLUMN_SYSTEM;
  return route.holds.map(holdStr => parseHold(holdStr, columnSystem));
}

/**
 * Get a reference route by name
 * @param name - Route name (e.g., "ifsc", "u15", "u11-u13")
 * @returns Reference route or undefined
 */
export function getReferenceRoute(name: string): ReferenceRoute | undefined {
  const routes = loadRoutes();
  return routes[name.toLowerCase()];
}

/**
 * Get list of available route names
 * @returns Array of route names
 */
export function getAvailableRouteNames(): string[] {
  const routes = loadRoutes();
  return Object.keys(routes);
}
