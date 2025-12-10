/**
 * Hook for calculating print layout
 * Handles page splitting, margins, overlap, and scale calculations
 */

import { useMemo } from 'react';

/** Print orientation */
export type PrintOrientation = 'portrait' | 'landscape';

/** Print mode */
export type PrintMode = 'full-wall' | 'lane-by-lane';

/** A4 dimensions in mm */
const A4 = {
  portrait: { width: 210, height: 297 },
  landscape: { width: 297, height: 210 },
};

/** Default print margin in mm */
const DEFAULT_MARGIN = 10;

/** Configuration for print layout */
export interface PrintConfig {
  /** Print mode */
  mode: PrintMode;
  /** Page orientation */
  orientation: PrintOrientation;
  /** Number of pages in height */
  pagesInHeight: number;
  /** Overlap between pages in mm */
  overlap: number;
  /** Print margin in mm */
  margin?: number;
}

/** Content dimensions */
export interface ContentDimensions {
  /** Width in mm */
  width: number;
  /** Height in mm */
  height: number;
  /** X offset of the content (from SVG viewBox minX) */
  offsetX?: number;
  /** Y offset of the content (from SVG viewBox minY) */
  offsetY?: number;
}

/** A single page in the layout */
export interface PageLayout {
  /** Page index (0-based) */
  index: number;
  /** Row in the grid (0-based) */
  row: number;
  /** Column in the grid (0-based) */
  col: number;
  /** X coordinate in content space (mm) */
  contentX: number;
  /** Y coordinate in content space (mm) */
  contentY: number;
  /** Width of content visible on this page (mm) */
  contentWidth: number;
  /** Height of content visible on this page (mm) */
  contentHeight: number;
}

/** Lane (couloir) definition */
export interface Lane {
  /** Lane number (1-based, corresponds to panel number) */
  number: number;
  /** X coordinate in content space (mm) */
  x: number;
  /** Width of the lane (mm) */
  width: number;
}

/** Result of layout calculation */
export interface PrintLayoutResult {
  /** Page dimensions */
  page: {
    /** Full page width in mm */
    width: number;
    /** Full page height in mm */
    height: number;
    /** Printable area width in mm (page - margins) */
    printableWidth: number;
    /** Printable area height in mm (page - margins) */
    printableHeight: number;
    /** Margin in mm */
    margin: number;
  };
  /** Layout metrics */
  layout: {
    /** Number of pages in width */
    pagesInWidth: number;
    /** Number of pages in height */
    pagesInHeight: number;
    /** Total number of pages */
    totalPages: number;
    /** Scale factor (content mm to page mm) */
    scale: number;
    /** Overlap in mm */
    overlap: number;
  };
  /** All pages */
  pages: PageLayout[];
  /** Lanes (for lane-by-lane mode) */
  lanes?: {
    /** Lane info */
    lane: Lane;
    /** Pages for this lane */
    pages: PageLayout[];
  }[];
}

/**
 * Calculate print layout for given content and configuration
 */
export function calculatePrintLayout(
  content: ContentDimensions,
  config: PrintConfig
): PrintLayoutResult {
  const margin = config.margin ?? DEFAULT_MARGIN;
  const pageSize = A4[config.orientation];
  const offsetX = content.offsetX ?? 0;
  const offsetY = content.offsetY ?? 0;

  const printableWidth = pageSize.width - 2 * margin;
  const printableHeight = pageSize.height - 2 * margin;

  // Calculate scale based on pages in height
  // Each page must be completely filled - overlap is a MINIMUM
  const pagesInHeight = config.pagesInHeight;
  const minOverlap = config.overlap;

  // Calculate scale using minimum overlap
  const totalPrintableHeightWithMinOverlap =
    pagesInHeight * printableHeight - (pagesInHeight - 1) * minOverlap;
  const scaleWithMinOverlap = totalPrintableHeightWithMinOverlap / content.height;

  // Each page shows contentHeightPerPage of content
  const contentHeightPerPage = printableHeight / scaleWithMinOverlap;

  // Calculate actual overlap needed to exactly cover content with N pages
  // content.height = N * contentHeightPerPage - (N-1) * actualOverlapInContent
  // actualOverlapInContent = (N * contentHeightPerPage - content.height) / (N - 1)
  let actualOverlapInContent = 0;
  if (pagesInHeight > 1) {
    actualOverlapInContent = (pagesInHeight * contentHeightPerPage - content.height) / (pagesInHeight - 1);
  }

  // Ensure actual overlap is at least the minimum
  const minOverlapInContent = minOverlap / scaleWithMinOverlap;
  if (actualOverlapInContent < minOverlapInContent) {
    actualOverlapInContent = minOverlapInContent;
  }

  // Use the scale that ensures pages are filled
  const scale = scaleWithMinOverlap;
  const overlap = actualOverlapInContent * scale;

  // Calculate pages in width based on scale
  const scaledContentWidth = content.width * scale;
  let pagesInWidth = 1;
  if (scaledContentWidth > printableWidth) {
    // Need more than one page in width
    // scaledWidth = pagesInWidth * printableWidth - (pagesInWidth - 1) * overlap
    // pagesInWidth = (scaledWidth + (pagesInWidth - 1) * overlap) / printableWidth
    // This is iterative, but we can solve it:
    // scaledWidth = pagesInWidth * printableWidth - pagesInWidth * overlap + overlap
    // scaledWidth - overlap = pagesInWidth * (printableWidth - overlap)
    // pagesInWidth = (scaledWidth - overlap) / (printableWidth - overlap) + 1
    pagesInWidth = Math.ceil(
      (scaledContentWidth - overlap) / (printableWidth - overlap)
    );
    if (pagesInWidth < 1) pagesInWidth = 1;
  }

  // Calculate content dimensions per page (in content space, not page space)
  const contentWidthPerPage = printableWidth / scale;
  // contentHeightPerPage already calculated above
  const overlapInContentWidth = minOverlap / scale; // Use minimum overlap for width

  // Generate page layouts (column-major order: top to bottom, then left to right)
  const pages: PageLayout[] = [];
  let pageIndex = 0;

  for (let col = 0; col < pagesInWidth; col++) {
    for (let row = 0; row < pagesInHeight; row++) {
      // Calculate position relative to content, then add SVG viewBox offset
      const relativeX = col * (contentWidthPerPage - overlapInContentWidth);
      const relativeY = row * (contentHeightPerPage - actualOverlapInContent);
      const contentX = relativeX + offsetX;
      const contentY = relativeY + offsetY;

      // Clip width to content bounds (for last column)
      const actualContentWidth = Math.min(
        contentWidthPerPage,
        Math.max(0, content.width - relativeX)
      );

      // Height is always full - pages must be completely filled
      // This ensures each page uses the full printable height
      const actualContentHeight = contentHeightPerPage;

      pages.push({
        index: pageIndex++,
        row,
        col,
        contentX,
        contentY,
        contentWidth: actualContentWidth,
        contentHeight: actualContentHeight,
      });
    }
  }

  return {
    page: {
      width: pageSize.width,
      height: pageSize.height,
      printableWidth,
      printableHeight,
      margin,
    },
    layout: {
      pagesInWidth,
      pagesInHeight,
      totalPages: pages.length,
      scale,
      overlap,
    },
    pages,
  };
}

/**
 * Calculate print layout for lane-by-lane mode
 */
export function calculateLaneLayout(
  content: ContentDimensions,
  lanes: Lane[],
  config: PrintConfig
): PrintLayoutResult {
  const margin = config.margin ?? DEFAULT_MARGIN;
  const pageSize = A4[config.orientation];
  const offsetX = content.offsetX ?? 0;
  const offsetY = content.offsetY ?? 0;

  const printableWidth = pageSize.width - 2 * margin;
  const printableHeight = pageSize.height - 2 * margin;

  const pagesInHeight = config.pagesInHeight;
  const minOverlap = config.overlap;

  // For lane-by-lane, each lane has its own layout
  // Scale is based on content height (same for all lanes)
  // Each page must be completely filled - overlap is a MINIMUM
  const totalPrintableHeightWithMinOverlap =
    pagesInHeight * printableHeight - (pagesInHeight - 1) * minOverlap;
  const scaleWithMinOverlap = totalPrintableHeightWithMinOverlap / content.height;

  const contentHeightPerPage = printableHeight / scaleWithMinOverlap;

  // Calculate actual overlap needed to exactly cover content with N pages
  let actualOverlapInContent = 0;
  if (pagesInHeight > 1) {
    actualOverlapInContent = (pagesInHeight * contentHeightPerPage - content.height) / (pagesInHeight - 1);
  }

  // Ensure actual overlap is at least the minimum
  const minOverlapInContent = minOverlap / scaleWithMinOverlap;
  if (actualOverlapInContent < minOverlapInContent) {
    actualOverlapInContent = minOverlapInContent;
  }

  const scale = scaleWithMinOverlap;
  const overlap = actualOverlapInContent * scale;
  const overlapInContentWidth = minOverlap / scale;

  const laneLayouts: { lane: Lane; pages: PageLayout[] }[] = [];
  let globalPageIndex = 0;

  for (const lane of lanes) {
    const scaledLaneWidth = lane.width * scale;

    // Calculate pages in width for this lane
    let pagesInWidth = 1;
    if (scaledLaneWidth > printableWidth) {
      pagesInWidth = Math.ceil(
        (scaledLaneWidth - overlap) / (printableWidth - overlap)
      );
      if (pagesInWidth < 1) pagesInWidth = 1;
    }

    const contentWidthPerPage = printableWidth / scale;

    const lanePages: PageLayout[] = [];

    // Column-major order: top to bottom, then left to right
    for (let col = 0; col < pagesInWidth; col++) {
      for (let row = 0; row < pagesInHeight; row++) {
        // Calculate position relative to lane, then add SVG viewBox offset
        const relativeX = lane.x + col * (contentWidthPerPage - overlapInContentWidth);
        const relativeY = row * (contentHeightPerPage - actualOverlapInContent);
        const contentX = relativeX + offsetX;
        const contentY = relativeY + offsetY;

        // Clip width to lane bounds (for last column)
        const actualContentWidth = Math.min(
          contentWidthPerPage,
          Math.max(0, lane.x + lane.width - relativeX)
        );

        // Height is always full - pages must be completely filled
        const actualContentHeight = contentHeightPerPage;

        lanePages.push({
          index: globalPageIndex++,
          row,
          col,
          contentX,
          contentY,
          contentWidth: actualContentWidth,
          contentHeight: actualContentHeight,
        });
      }
    }

    laneLayouts.push({ lane, pages: lanePages });
  }

  // Flatten all pages
  const allPages = laneLayouts.flatMap(l => l.pages);

  // Calculate average pages in width (for summary)
  const avgPagesInWidth = laneLayouts.length > 0
    ? Math.round(laneLayouts.reduce((sum, l) => sum + Math.sqrt(l.pages.length / pagesInHeight), 0) / laneLayouts.length)
    : 1;

  return {
    page: {
      width: pageSize.width,
      height: pageSize.height,
      printableWidth,
      printableHeight,
      margin,
    },
    layout: {
      pagesInWidth: avgPagesInWidth,
      pagesInHeight,
      totalPages: allPages.length,
      scale,
      overlap,
    },
    pages: allPages,
    lanes: laneLayouts,
  };
}

/**
 * Hook for print layout calculations
 */
export function usePrintLayout(
  content: ContentDimensions | null,
  config: PrintConfig,
  lanes?: Lane[]
): PrintLayoutResult | null {
  return useMemo(() => {
    if (!content || content.width === 0 || content.height === 0) {
      return null;
    }

    if (config.mode === 'lane-by-lane' && lanes && lanes.length > 0) {
      return calculateLaneLayout(content, lanes, config);
    }

    return calculatePrintLayout(content, config);
  }, [content, config, lanes]);
}

export default usePrintLayout;
