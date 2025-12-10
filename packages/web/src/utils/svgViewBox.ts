/**
 * SVG ViewBox utilities for print layout
 * Centralizes viewBox calculation and SVG serialization logic
 */

import type { PageLayout } from '@/hooks/usePrintLayout';

/** Parameters for viewBox calculation */
export interface ViewBoxParams {
  /** X coordinate of content start */
  contentX: number;
  /** Y coordinate of content start */
  contentY: number;
  /** Actual width of content on this page */
  contentWidth: number;
  /** Printable width in mm */
  printableWidth: number;
  /** Printable height in mm */
  printableHeight: number;
  /** Scale factor */
  scale: number;
  /** Number of pages in width */
  pagesInWidth: number;
}

/** ViewBox result */
export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate viewBox dimensions with optional horizontal centering
 * Centers content when there's only one page in width and content doesn't fill the page
 */
export function calculateViewBox(params: ViewBoxParams): ViewBox {
  const expectedWidth = params.printableWidth / params.scale;
  const expectedHeight = params.printableHeight / params.scale;

  let x = params.contentX;

  // Center horizontally when there's only one page in width
  if (params.pagesInWidth === 1 && params.contentWidth < expectedWidth) {
    const centerOffset = (expectedWidth - params.contentWidth) / 2;
    x = params.contentX - centerOffset;
  }

  return {
    x,
    y: params.contentY,
    width: expectedWidth,
    height: expectedHeight,
  };
}

/**
 * Apply viewBox to an SVG element
 */
export function applyViewBoxToSvg(
  svgElement: Element,
  viewBox: ViewBox,
  preserveAspectRatio: string = 'none'
): void {
  svgElement.setAttribute(
    'viewBox',
    `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
  );
  svgElement.setAttribute('width', '100%');
  svgElement.setAttribute('height', '100%');
  svgElement.setAttribute('preserveAspectRatio', preserveAspectRatio);
}

/**
 * Serialize an SVG element to a data URL
 */
export function serializeSvgToDataUrl(svgElement: Element): string {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const encoded = encodeURIComponent(svgString)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Calculate the number of pages in width from a list of pages
 */
export function calculatePagesInWidth(pages: PageLayout[]): number {
  if (pages.length === 0) return 1;
  return Math.max(...pages.map(p => p.col)) + 1;
}

/**
 * Get pagesInWidth for a specific page, considering lane-by-lane mode
 */
export function getPagesInWidthForPage(
  pageIndex: number,
  lanes: { pages: PageLayout[] }[] | undefined,
  defaultPagesInWidth: number
): number {
  if (lanes && lanes.length > 0) {
    for (const { pages: lanePages } of lanes) {
      if (lanePages.some(p => p.index === pageIndex)) {
        return calculatePagesInWidth(lanePages);
      }
    }
  }
  return defaultPagesInWidth;
}
