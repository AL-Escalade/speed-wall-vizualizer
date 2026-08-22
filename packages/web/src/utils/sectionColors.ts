/**
 * Per-color-tag section colors, and migration of sections saved before routes
 * could declare several colors.
 *
 * A section stores two related fields:
 * - `colors`: sparse per-tag overrides. `{}` means "follow the route".
 *   `undefined` means the section predates multi-color routes.
 * - `color`: a mirror of the default tag's effective color, kept only so that
 *   older builds of the app can still read exports and shared links.
 */

import { type RouteColorMap, getDefaultColorTag } from '@voie-vitesse/core';
import type { Section } from '@/store/types';
import { LEGACY_ROUTE_COLORS } from '@/constants/legacyRouteColors';

/** Looks up a route's normalized color map, or undefined for an unknown source */
export type RouteColorMapLookup = (source: string) => RouteColorMap | undefined;

/** Whether the user has overridden at least one color of this section */
export function isSectionColorCustomized(section: Section): boolean {
  return Object.keys(section.colors ?? {}).length > 0;
}

/**
 * Effective color per tag: the route's colors with the section's overrides applied.
 * @param section - The section to resolve
 * @param routeColorMap - Its source route's normalized color map
 */
export function resolveSectionColors(
  section: Section,
  routeColorMap: RouteColorMap
): Record<string, string> {
  return { ...routeColorMap, ...(section.colors ?? {}) };
}

/**
 * Decide the `colors` map of a section saved before multi-color routes existed.
 *
 * Called only when `section.colors` is undefined, i.e. exactly once per section.
 *
 * @param storedColor - The single color the section has always carried
 * @param routeColorMap - Its source route's colors, as declared today
 * @param legacyColor - The single color that route declared before this feature,
 *   or undefined when the route is unknown to the frozen snapshot
 * @returns The section's overrides: `{}` to follow the route's colors, or an
 *   entry per tag to pin them
 */
function decideMigratedColors(
  storedColor: string,
  routeColorMap: RouteColorMap,
  legacyColor: string | undefined
): Record<string, string> {
  // Case-insensitive: <input type="color"> emits lowercase, so a user who
  // reopened the picker on the identical color stores a different string
  const wasNeverCustomized =
    legacyColor !== undefined && storedColor.toLowerCase() === legacyColor.toLowerCase();

  // Follow the route, and keep following it if its colors are corrected later
  if (wasNeverCustomized) return {};

  // A deliberate color must stay uniform: leaving tags unpinned would turn the
  // section multi-color against the user's choice. Unknown legacy color lands
  // here too, so an unrecognized route never silently loses a chosen color.
  return Object.fromEntries(Object.keys(routeColorMap).map((tag) => [tag, storedColor]));
}

/**
 * Bring a section up to the per-tag color model.
 *
 * Idempotent: it runs on every load, at all three entry points (localStorage
 * rehydration, file import, shared link decoding), so running it twice must be
 * indistinguishable from running it once.
 *
 * @param section - The section to migrate
 * @param getRouteColorMap - Route color map lookup, injected to keep this pure
 * @param legacyColors - Frozen pre-feature route colors, overridable for tests
 */
export function migrateSectionColors(
  section: Section,
  getRouteColorMap: RouteColorMapLookup,
  legacyColors: Record<string, string> = LEGACY_ROUTE_COLORS
): Section {
  const routeColorMap = getRouteColorMap(section.source);

  // Unknown source: mark it migrated so the decision is not retried against a
  // route map that may appear later, but leave the stored color untouched
  if (!routeColorMap) {
    return { ...section, colors: section.colors ?? {} };
  }

  const colors =
    section.colors ??
    decideMigratedColors(
      section.color,
      routeColorMap,
      legacyColors[section.source.toLowerCase()]
    );

  const defaultTag = getDefaultColorTag({ color: routeColorMap });

  // Recomputed on every call, not just on migration, so the mirror never goes stale
  return { ...section, colors, color: colors[defaultTag] ?? routeColorMap[defaultTag] };
}
