/**
 * Reference routes loader
 * Loads routes from JSON configuration files
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ReferenceRoute, ReferenceRoutes, Hold, PanelId, PanelSide, PanelNumber, InsertPosition, Column, Row, ColumnSystem } from '@voie-vitesse/core';
import { DEFAULT_COLUMN_SYSTEM, validateColumn } from '@voie-vitesse/core';

/**
 * Parse a panel ID string (e.g., "SN1", "DX2") into a PanelId object
 */
function parsePanelId(panelStr: string): PanelId {
  const match = panelStr.match(/^(SN|DX)(\d+)$/i);
  if (!match) {
    throw new Error(`Invalid panel ID: "${panelStr}". Expected format: SN1, DX2, etc.`);
  }
  return {
    side: match[1].toUpperCase() as PanelSide,
    number: parseInt(match[2], 10) as PanelNumber,
  };
}

/**
 * Parse an insert position string (e.g., "A1", "F10") into an InsertPosition object
 * @param posStr - Position string
 * @param columnSystem - Column coordinate system for validation
 */
function parseInsertPositionWithSystem(posStr: string, columnSystem: ColumnSystem): InsertPosition {
  const match = posStr.match(/^([A-M])(\d+)$/i);
  if (!match) {
    throw new Error(`Invalid position: "${posStr}". Expected format: A1, F10, etc.`);
  }
  const column = match[1].toUpperCase();
  const row = parseInt(match[2], 10) as Row;

  // Validate column against the coordinate system
  validateColumn(column, columnSystem);

  return {
    column: column as Column,
    row,
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Default routes directory */
const DEFAULT_ROUTES_DIR = join(__dirname, '../../../data/routes');

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

  return {
    color: data.color,
    holdScales: data.holdScales,
    columns: data.columns,
    holds: data.holds,
  };
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
 * Parse an orientation string that may include a panel reference
 * Format: "F4" (same panel) or "DX1:F4" (explicit panel)
 *
 * @param orientationStr - Orientation string
 * @param defaultPanel - Default panel if not specified
 * @param columnSystem - Column coordinate system for validation
 * @returns Object with position and optional panel
 */
function parseOrientation(
  orientationStr: string,
  defaultPanel: PanelId,
  columnSystem: ColumnSystem
): { position: InsertPosition; panel?: PanelId } {
  // Check if orientation includes a panel reference (e.g., "DX1:F4")
  const colonIndex = orientationStr.indexOf(':');
  if (colonIndex > 0) {
    const panelStr = orientationStr.substring(0, colonIndex);
    const posStr = orientationStr.substring(colonIndex + 1);
    return {
      position: parseInsertPositionWithSystem(posStr, columnSystem),
      panel: parsePanelId(panelStr),
    };
  }

  // No panel reference, use default (same panel)
  return {
    position: parseInsertPositionWithSystem(orientationStr, columnSystem),
  };
}

/**
 * Parse a compact hold string into a Hold object
 * Format: "PANEL TYPE POSITION ORIENTATION [@LABEL] [SCALE]"
 * - ORIENTATION can be "F4" (same panel) or "DX1:F4" (explicit panel)
 * - LABEL is optional, prefixed with @ (e.g., @M1, @P2)
 * - SCALE is optional (default: 1.0)
 * Example: "DX2 BIG F1 D3" or "DX2 BIG F10 DX1:C1 @M5 0.5"
 *
 * @param holdStr - Compact hold string
 * @param columnSystem - Column coordinate system for validation (default: ABC)
 * @returns Parsed Hold object
 */
export function parseHold(holdStr: string, columnSystem: ColumnSystem = DEFAULT_COLUMN_SYSTEM): Hold {
  const parts = holdStr.trim().split(/\s+/);
  if (parts.length < 4 || parts.length > 6) {
    throw new Error(`Invalid hold format: "${holdStr}". Expected "PANEL TYPE POSITION ORIENTATION [@LABEL] [SCALE]"`);
  }

  const [panelStr, type, positionStr, orientationStr, ...rest] = parts;
  const panel = parsePanelId(panelStr);
  const orientation = parseOrientation(orientationStr, panel, columnSystem);

  // Parse optional label and scale from remaining parts
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
 * @param route - Reference route
 * @returns Array of parsed Hold objects
 */
export function getRouteHolds(route: ReferenceRoute): Hold[] {
  const columnSystem = route.columns || DEFAULT_COLUMN_SYSTEM;
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
