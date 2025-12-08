/**
 * Page grid component showing miniature page thumbnails
 * Displays the cutting layout and allows page selection
 */

import { useMemo, memo, useState, useEffect, useCallback } from 'react';
import type { PrintLayoutResult, PageLayout, Lane } from '@/hooks/usePrintLayout';
import { calculateViewBox, applyViewBoxToSvg, serializeSvgToDataUrl, calculatePagesInWidth } from '@/utils/svgViewBox';

interface PageGridProps {
  layout: PrintLayoutResult | null;
  selectedPageIndex: number | null;
  onSelectPage: (index: number) => void;
  svgContent: string | null;
}

interface PageThumbnailProps {
  page: PageLayout;
  printableSize: { width: number; height: number };
  scale: number;
  pagesInWidth: number;
  isSelected: boolean;
  pageIndex: number;
  onSelectPage: (index: number) => void;
  svgContent: string;
}

const PageThumbnail = memo(function PageThumbnail({
  page,
  printableSize,
  scale,
  pagesInWidth,
  isSelected,
  pageIndex,
  onSelectPage,
  svgContent,
}: PageThumbnailProps) {
  const handleClick = useCallback(() => {
    onSelectPage(pageIndex);
  }, [onSelectPage, pageIndex]);
  // Create a data URL for the SVG portion shown in this page - async to not block UI
  const [thumbnailSvg, setThumbnailSvg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!svgContent) {
      setThumbnailSvg(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Defer heavy calculation to allow UI to update first
    const timeoutId = setTimeout(() => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      // Calculate and apply viewBox with centering
      const viewBox = calculateViewBox({
        contentX: page.contentX,
        contentY: page.contentY,
        contentWidth: page.contentWidth,
        printableWidth: printableSize.width,
        printableHeight: printableSize.height,
        scale,
        pagesInWidth,
      });
      applyViewBoxToSvg(svgElement, viewBox, 'xMidYMid meet');

      setThumbnailSvg(serializeSvgToDataUrl(svgElement));
      setIsLoading(false);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [svgContent, page.contentX, page.contentY, page.contentWidth, printableSize.width, printableSize.height, scale, pagesInWidth]);

  // Calculate thumbnail dimensions (maintain aspect ratio)
  // Use printableSize ratio to match the SVG viewBox aspect ratio
  const thumbnailHeight = 80;
  const aspectRatio = printableSize.width / printableSize.height;
  const thumbnailWidth = thumbnailHeight * aspectRatio;

  return (
    <button
      type="button"
      className={`relative rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${
        isSelected
          ? 'border-primary shadow-lg ring-2 ring-primary/30'
          : 'border-base-300 hover:border-base-content/30'
      }`}
      style={{
        width: thumbnailWidth,
        height: thumbnailHeight,
      }}
      onClick={handleClick}
      title={`Page ${page.index + 1}`}
    >
      {/* Thumbnail content */}
      <div className="absolute inset-1 bg-white rounded overflow-hidden pointer-events-none flex items-center justify-center">
        {isLoading ? (
          <span className="loading loading-spinner loading-xs text-base-content/30"></span>
        ) : thumbnailSvg ? (
          <img
            src={thumbnailSvg}
            alt={`Page ${page.index + 1}`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : null}
      </div>

      {/* Page number */}
      <div className="absolute bottom-0 right-0 bg-base-300/80 text-xs px-1 rounded-tl pointer-events-none">
        {page.index + 1}
      </div>
    </button>
  );
});

interface LaneGroupProps {
  lane: Lane;
  pages: PageLayout[];
  printableSize: { width: number; height: number };
  scale: number;
  pagesInWidth: number;
  selectedPageIndex: number | null;
  onSelectPage: (index: number) => void;
  svgContent: string;
}

const LaneGroup = memo(function LaneGroup({
  lane,
  pages,
  printableSize,
  scale,
  pagesInWidth,
  selectedPageIndex,
  onSelectPage,
  svgContent,
}: LaneGroupProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-base-content/70">
        Couloir {lane.number}
      </h3>
      <div className="flex flex-wrap gap-2">
        {pages.map((page) => (
          <PageThumbnail
            key={page.index}
            page={page}
            printableSize={printableSize}
            scale={scale}
            pagesInWidth={pagesInWidth}
            isSelected={selectedPageIndex === page.index}
            pageIndex={page.index}
            onSelectPage={onSelectPage}
            svgContent={svgContent}
          />
        ))}
      </div>
    </div>
  );
});

export function PageGrid({
  layout,
  selectedPageIndex,
  onSelectPage,
  svgContent,
}: PageGridProps) {
  if (!layout || !svgContent) {
    return (
      <div className="flex items-center justify-center h-32 text-base-content/50">
        Aucune page à afficher
      </div>
    );
  }

  const { page, layout: layoutMetrics, pages, lanes } = layout;

  // Memoize to prevent triggering unnecessary thumbnail recalculations
  const printableSize = useMemo(
    () => ({ width: page.printableWidth, height: page.printableHeight }),
    [page.printableWidth, page.printableHeight]
  );

  // Full wall mode - organize by columns (since pages are numbered column-major)
  // Must be called before any conditional returns to respect hooks rules
  const pagesByCol = useMemo(() => {
    const result: PageLayout[][] = [];
    for (const p of pages) {
      if (!result[p.col]) {
        result[p.col] = [];
      }
      result[p.col].push(p);
    }
    return result;
  }, [pages]);

  // If lane-by-lane mode with lanes data
  if (lanes && lanes.length > 0) {
    return (
      <div className="space-y-4">
        <h2 className="font-semibold">Aperçu des pages</h2>
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {lanes.map(({ lane, pages: lanePages }) => {
            const lanePagesInWidth = calculatePagesInWidth(lanePages);
            return (
              <LaneGroup
                key={lane.number}
                lane={lane}
                pages={lanePages}
                printableSize={printableSize}
                scale={layoutMetrics.scale}
                pagesInWidth={lanePagesInWidth}
                selectedPageIndex={selectedPageIndex}
                onSelectPage={onSelectPage}
                svgContent={svgContent}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Aperçu des pages</h2>
      <div className="flex gap-4 max-h-64 overflow-x-auto">
        {pagesByCol.map((colPages, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-2 shrink-0">
            {colPages.map((p) => (
              <PageThumbnail
                key={p.index}
                page={p}
                printableSize={printableSize}
                scale={layoutMetrics.scale}
                pagesInWidth={layoutMetrics.pagesInWidth}
                isSelected={selectedPageIndex === p.index}
                pageIndex={p.index}
                onSelectPage={onSelectPage}
                svgContent={svgContent}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PageGrid;
