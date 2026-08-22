/**
 * URL Configuration encoding/decoding utilities
 * Encodes configuration state to a URL-safe string for sharing
 */

import type { SavedConfiguration } from '@/store';
import type { HoldLabel } from '@/store/types';
import { ROUTES } from './routes';
import { migrateSectionColors } from '@/utils/sectionColors';
import { useRoutesStore } from '@/store/routesStore';

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
    /** Per-color-tag overrides. Absent in links shared before multi-color routes. */
    colors?: Record<string, string>;
    anchor?: {
      side: 'SN' | 'DX';
      column: string;
      row: number;
    };
    excludeHolds?: HoldLabel[];
  }>;
  showArrow?: boolean;
  displayOptions?: {
    gridColor?: string;
    labelFontSize?: number;
    holdLabelFontSize?: number;
  };
  language?: 'auto' | 'fr' | 'de' | 'it' | 'en';
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
      colors: s.colors,
      anchor: s.anchor,
      excludeHolds: s.excludeHolds?.length ? s.excludeHolds : undefined,
    })),
    showArrow: config.showArrow,
    displayOptions: config.displayOptions,
    language: config.language,
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
    if (s.excludeHolds !== undefined) {
      if (!Array.isArray(s.excludeHolds)) return false;
      if (!s.excludeHolds.every((h: unknown) => typeof h === 'string')) return false;
    }
    // Additive: links shared before multi-color routes carry no `colors` at all
    if (s.colors !== undefined) {
      if (typeof s.colors !== 'object' || s.colors === null || Array.isArray(s.colors)) return false;
      if (Object.values(s.colors).some((v) => typeof v !== 'string')) return false;
    }
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
  // Migrate here, before importConfiguration fingerprints the result, so an old
  // shared link and its already-migrated localStorage twin still deduplicate
  const { getRouteColorMap } = useRoutesStore.getState();

  return {
    id: crypto.randomUUID(),
    name: 'Configuration partagée',
    wall: config.wall,
    sections: config.sections.map((s) =>
      migrateSectionColors({ ...s, id: crypto.randomUUID() }, getRouteColorMap)
    ),
    showArrow: config.showArrow,
    displayOptions: config.displayOptions,
    language: config.language,
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
/** Rebuild an object with its keys in sorted order, so JSON.stringify is stable */
function sortObjectKeys(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

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
      // Normalized so an unmigrated config and its migrated twin still match.
      // Keys are sorted because JSON.stringify preserves insertion order, and
      // that order is user-driven: it follows whichever picker was touched first.
      colors: sortObjectKeys(s.colors ?? {}),
      anchor: s.anchor,
      excludeHolds: s.excludeHolds?.length ? [...s.excludeHolds].sort() : undefined,
    }));

  const normalized = {
    wall: config.wall,
    sections: normalizedSections,
    showArrow: config.showArrow ?? false,
  };

  return JSON.stringify(normalized);
}
