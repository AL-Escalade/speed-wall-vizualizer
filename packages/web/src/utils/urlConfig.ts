/**
 * URL Configuration encoding/decoding utilities
 * Encodes configuration state to a URL-safe string for sharing
 */

import type { SavedConfiguration } from '@/store';
import { ROUTES } from './routes';

/**
 * Shareable configuration data (subset of SavedConfiguration)
 * Excludes id, name, createdAt, updatedAt which are local-only
 */
export interface ShareableConfig {
  wall: {
    lanes: number;
    panelsHeight: number;
  };
  sections: Array<{
    name: string;
    source: string;
    lane: number;
    fromHold: number | string;
    toHold: number | string;
    color: string;
    anchor?: {
      side: 'SN' | 'DX';
      column: string;
      row: number;
    };
  }>;
  showArrow?: boolean;
  displayOptions?: {
    gridColor?: string;
    labelFontSize?: number;
    holdLabelFontSize?: number;
  };
}

/**
 * Extract shareable data from a SavedConfiguration
 */
export function extractShareableConfig(config: SavedConfiguration): ShareableConfig {
  return {
    wall: config.wall,
    sections: config.sections.map((s) => ({
      name: s.name,
      source: s.source,
      lane: s.lane,
      fromHold: s.fromHold,
      toHold: s.toHold,
      color: s.color,
      anchor: s.anchor,
    })),
    showArrow: config.showArrow,
    displayOptions: config.displayOptions,
  };
}

/**
 * Encode configuration to URL-safe base64 string
 */
export function encodeConfig(config: ShareableConfig): string {
  try {
    const json = JSON.stringify(config);
    // Use TextEncoder for UTF-8 support
    const bytes = new TextEncoder().encode(json);
    // Convert to base64
    const base64 = btoa(String.fromCharCode(...bytes));
    // Make URL-safe: replace + with -, / with _, remove padding =
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    console.error('Failed to encode config');
    return '';
  }
}

/**
 * Validate that parsed data matches ShareableConfig structure
 */
function isValidShareableConfig(data: unknown): data is ShareableConfig {
  if (!data || typeof data !== 'object') return false;

  const config = data as Record<string, unknown>;

  // Validate wall
  if (!config.wall || typeof config.wall !== 'object') return false;
  const wall = config.wall as Record<string, unknown>;
  if (typeof wall.lanes !== 'number' || typeof wall.panelsHeight !== 'number') return false;

  // Validate sections
  if (!Array.isArray(config.sections)) return false;
  for (const section of config.sections) {
    if (!section || typeof section !== 'object') return false;
    const s = section as Record<string, unknown>;
    if (typeof s.name !== 'string') return false;
    if (typeof s.source !== 'string') return false;
    if (typeof s.lane !== 'number') return false;
    if (s.fromHold === undefined || s.toHold === undefined) return false;
    if (typeof s.color !== 'string') return false;
  }

  return true;
}

/**
 * Decode URL-safe base64 string to configuration
 */
export function decodeConfig(encoded: string): ShareableConfig | null {
  try {
    // Restore base64 format: replace - with +, _ with /
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    // Decode base64
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);

    // Validate structure
    if (!isValidShareableConfig(parsed)) {
      console.error('Invalid config structure');
      return null;
    }

    return parsed;
  } catch {
    console.error('Failed to decode config');
    return null;
  }
}

/**
 * Hydrate a ShareableConfig into a full SavedConfiguration
 * Generates new IDs and timestamps for local storage
 */
export function hydrateShareableConfig(config: ShareableConfig): SavedConfiguration {
  return {
    id: crypto.randomUUID(),
    name: 'Configuration partagée',
    wall: config.wall,
    sections: config.sections.map((s) => ({
      ...s,
      id: crypto.randomUUID(),
    })),
    showArrow: config.showArrow,
    displayOptions: config.displayOptions,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Generate a shareable URL for a configuration
 */
export function generateShareUrl(config: SavedConfiguration): string {
  const shareable = extractShareableConfig(config);
  const encoded = encodeConfig(shareable);
  const baseUrl = window.location.origin;
  return `${baseUrl}${ROUTES.SHARE(encoded)}`;
}

/**
 * Generate a fingerprint for a configuration based on its content
 * Used to detect duplicate configurations
 * Ignores: id, name, timestamps, displayOptions (view preferences)
 */
export function getConfigFingerprint(config: SavedConfiguration | ShareableConfig): string {
  // Normalize sections for consistent comparison
  // Sort by lane first, then by source
  const normalizedSections = [...config.sections]
    .sort((a, b) => a.lane - b.lane || a.source.localeCompare(b.source))
    .map(s => ({
      source: s.source,
      lane: s.lane,
      fromHold: s.fromHold,
      toHold: s.toHold,
      color: s.color,
      anchor: s.anchor,
    }));

  const normalized = {
    wall: config.wall,
    sections: normalizedSections,
    showArrow: config.showArrow ?? false,
  };

  return JSON.stringify(normalized);
}
