/**
 * Section mapping utilities for converting between web app and core formats
 */

import type { RouteSegment } from '@voie-vitesse/core';
import type { AnchorPosition } from '@/store/types';

/** Web app section format */
export interface WebSection {
  source: string;
  lane: number;
  fromHold: number | string;
  toHold: number | string;
  color: string;
  anchor?: AnchorPosition;
}

/** Core column type */
type CoreColumn = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'K' | 'L';

/** Core row type */
type CoreRow = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Convert web app section to core RouteSegment format.
 * Panel number is always 1 (bottom panel) since first hold starts at the bottom.
 *
 * @param section - The web app section to convert
 * @returns The core RouteSegment format
 */
export function sectionToSegment(section: WebSection): RouteSegment {
  const anchor = section.anchor
    ? {
        panel: `${section.anchor.side}1`,
        column: section.anchor.column as CoreColumn,
        row: section.anchor.row as CoreRow,
      }
    : undefined;

  return {
    source: section.source,
    fromHold: section.fromHold,
    toHold: section.toHold,
    laneOffset: section.lane,
    color: section.color,
    anchor,
  };
}

/**
 * Normalize SVG for web display.
 * The SVG generator uses mm units and large dimensions for print output.
 * For web display, we replace width/height with 100% to fill container
 * while the viewBox defines the coordinate system and aspect ratio.
 *
 * @param svgContent - The SVG content string to normalize
 * @returns The normalized SVG content with 100% width and height
 */
export function normalizeSvgForWeb(svgContent: string): string {
  return svgContent
    .replace(/width="[^"]*"/, 'width="100%"')
    .replace(/height="[^"]*"/, 'height="100%"');
}
