/**
 * Page detail component showing a larger preview of the selected page
 * Displays the exact content that will be exported
 */

import { useMemo, useState, useEffect } from 'react';
import type { PrintLayoutResult } from '@/hooks/usePrintLayout';
import { calculateViewBox, applyViewBoxToSvg, serializeSvgToDataUrl } from '@/utils/svgViewBox';

interface PageDetailProps {
  layout: PrintLayoutResult | null;
  selectedPageIndex: number | null;
  svgContent: string | null;
  configName: string;
}

export function PageDetail({
  layout,
  selectedPageIndex,
  svgContent,
  configName,
}: PageDetailProps) {
  // Find the selected page
  const selectedPage = useMemo(() => {
    if (!layout || selectedPageIndex === null) return null;
    return layout.pages.find((p) => p.index === selectedPageIndex) ?? null;
  }, [layout, selectedPageIndex]);

  // Loading state for SVG generation
  const [isLoadingSvg, setIsLoadingSvg] = useState(false);
  const [pageSvgUrl, setPageSvgUrl] = useState<string | null>(null);

  // Generate SVG data URL asynchronously to allow UI to update first
  useEffect(() => {
    // Clear immediately to show loading state right away
    setPageSvgUrl(null);

    if (!svgContent || !selectedPage || !layout) {
      setIsLoadingSvg(false);
      return;
    }

    setIsLoadingSvg(true);

    // Use setTimeout to push heavy calculation to next event loop tick
    // This ensures React can paint the loading state before we block
    const timeoutId = setTimeout(() => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      // Calculate and apply viewBox with centering
      const viewBox = calculateViewBox({
        contentX: selectedPage.contentX,
        contentY: selectedPage.contentY,
        contentWidth: selectedPage.contentWidth,
        printableWidth: layout.page.printableWidth,
        printableHeight: layout.page.printableHeight,
        scale: layout.layout.scale,
        pagesInWidth: layout.layout.pagesInWidth,
      });
      applyViewBoxToSvg(svgElement, viewBox, 'xMidYMid meet');

      setPageSvgUrl(serializeSvgToDataUrl(svgElement));
      setIsLoadingSvg(false);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [svgContent, selectedPage, layout]);

  // Format current date
  const dateStr = useMemo(() => {
    return new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  if (!layout || selectedPageIndex === null || !selectedPage) {
    return (
      <div className="h-full flex items-center justify-center bg-base-200 rounded-lg p-4">
        <p className="text-base-content/50 text-sm md:text-base text-center">
          Sélectionnez une page pour voir l'aperçu
        </p>
      </div>
    );
  }

  const { page } = layout;

  return (
    <div className="h-full flex flex-col bg-base-200 rounded-lg p-3 md:p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-sm md:text-base">Page {selectedPageIndex + 1}</h2>
        <span className="text-xs md:text-sm text-base-content/70">
          {page.width} × {page.height} mm
        </span>
      </div>

      {/* Page preview container */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        <div className="absolute inset-4 flex items-center justify-center" style={{ containerType: 'size' }}>
          {/* Page wrapper with aspect ratio - uses container-based sizing */}
          <div
            className="relative bg-white shadow-lg border border-base-300"
            style={{
              // Container dimensions for aspect ratio calculation
              '--container-ratio': page.width / page.height,
              aspectRatio: `${page.width} / ${page.height}`,
              // Fill container while respecting aspect ratio
              width: `min(100%, calc(100cqh * ${page.width} / ${page.height}))`,
              height: `min(100%, calc(100cqw * ${page.height} / ${page.width}))`,
            } as React.CSSProperties}
          >
            {/* Metadata header */}
            <div className="absolute top-2 left-0 right-0 flex justify-between px-3 text-xs text-gray-400 z-10">
              <span>{configName}</span>
              <span>{dateStr}</span>
            </div>

            {/* Margin indicator */}
            <div
              className="absolute border border-dashed border-blue-200 pointer-events-none"
              style={{
                top: `${(page.margin / page.height) * 100}%`,
                left: `${(page.margin / page.width) * 100}%`,
                right: `${(page.margin / page.width) * 100}%`,
                bottom: `${(page.margin / page.height) * 100}%`,
              }}
            />

            {/* Content area - printable zone */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                top: `${(page.margin / page.height) * 100}%`,
                left: `${(page.margin / page.width) * 100}%`,
                right: `${(page.margin / page.width) * 100}%`,
                bottom: `${(page.margin / page.height) * 100}%`,
              }}
            >
              {isLoadingSvg ? (
                <span className="loading loading-spinner loading-md text-base-content/30"></span>
              ) : pageSvgUrl ? (
                <img
                  src={pageSvgUrl}
                  alt={`Page ${selectedPageIndex + 1}`}
                  style={{ width: '100%', height: '100%' }}
                  draggable={false}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Page coordinates info - hidden on mobile for space */}
      <div className="hidden md:block mt-2 text-xs text-base-content/50 text-center">
        Contenu : {Math.round(selectedPage.contentX)} - {Math.round(selectedPage.contentX + selectedPage.contentWidth)} mm (x)
        {' | '}
        {Math.round(selectedPage.contentY)} - {Math.round(selectedPage.contentY + selectedPage.contentHeight)} mm (y)
      </div>
    </div>
  );
}

export default PageDetail;
