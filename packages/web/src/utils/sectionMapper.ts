/**
 * Section mapping utilities for converting between web app and core formats
 */

import type { RouteSegment, AnchorColumn, AnchorRow } from '@voie-vitesse/core';
import { VIRTUAL_COLUMNS, VIRTUAL_ROWS, CANONICAL_COLUMN_SYSTEM } from '@voie-vitesse/core';
import type { AnchorPosition } from '@/store/types';

function isValidAnchorColumn(value: string): value is AnchorColumn {
  if (value === VIRTUAL_COLUMNS.BEFORE_FIRST || value === VIRTUAL_COLUMNS.AFTER_LAST) return true;
  return value.length === 1 && CANONICAL_COLUMN_SYSTEM.includes(value);
}

function isValidAnchorRow(value: number): value is AnchorRow {
  return Number.isInteger(value) && value >= VIRTUAL_ROWS.BELOW_FIRST && value <= VIRTUAL_ROWS.ABOVE_LAST;
}

function validateAnchorColumn(column: string): AnchorColumn {
  if (isValidAnchorColumn(column)) return column;
  console.warn(`Invalid anchor column "${column}", defaulting to "A"`);
  return 'A' as AnchorColumn;
}

function validateAnchorRow(row: number): AnchorRow {
  if (isValidAnchorRow(row)) return row;
  console.warn(`Invalid anchor row ${row}, defaulting to 1`);
  return 1 as AnchorRow;
}

/** Web app section format */
export interface WebSection {
  source: string;
  lane: number;
  fromHold: number | string;
  toHold: number | string;
  color: string;
  anchor?: AnchorPosition;
}

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
        column: validateAnchorColumn(section.anchor.column),
        row: validateAnchorRow(section.anchor.row),
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
