/**
 * Print page for multi-page PDF export
 * Allows configuring and previewing the print layout
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { generateSvg, composeAllRoutes, type Config } from '@voie-vitesse/core';
import { useConfigStore, useRoutesStore } from '@/store';
import { sectionToSegment, normalizeSvgForWeb } from '@/utils/sectionMapper';
import { generateAndDownloadPdf } from '@/utils/pdfGenerator';
import { usePrintLayout, type PrintConfig as PrintConfigType, type Lane } from '@/hooks/usePrintLayout';
import { PrintConfig, PageGrid, PageDetail } from '@/components/print';

export function PrintPage() {
  const navigate = useNavigate();
  const config = useConfigStore((s) =>
    s.configurations.find((c) => c.id === s.activeConfigId) ?? null
  );
  const routes = useRoutesStore((s) => s.routes);

  // SVG state
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const [svgViewBoxOffset, setSvgViewBoxOffset] = useState({ x: 0, y: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Print config state
  const [printConfig, setPrintConfig] = useState<PrintConfigType>({
    mode: 'full-wall',
    orientation: 'portrait',
    pagesInHeight: 4,
    overlap: 10,
  });

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | undefined>();

  // Selected page for preview
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(0);

  // Calculate lanes for lane-by-lane mode
  const lanes = useMemo((): Lane[] | undefined => {
    if (!config || printConfig.mode !== 'lane-by-lane') return undefined;

    const numLanes = config.wall.lanes;
    const lanesArr: Lane[] = [];

    for (let i = 0; i < numLanes; i++) {
      // Each lane consists of SN panel + DX panel
      // In SVG coordinates, lane i starts at x = i * (panelWidth * 2) approximately
      // We need to calculate based on actual content dimensions
      const laneWidthFraction = svgDimensions.width / numLanes;
      lanesArr.push({
        number: i + 1,
        x: i * laneWidthFraction,
        width: laneWidthFraction,
      });
    }

    return lanesArr;
  }, [config, printConfig.mode, svgDimensions.width]);

  // Calculate layout - include viewBox offset for correct positioning
  const layout = usePrintLayout(
    svgDimensions.width > 0 ? {
      ...svgDimensions,
      offsetX: svgViewBoxOffset.x,
      offsetY: svgViewBoxOffset.y,
    } : null,
    printConfig,
    lanes
  );

  // Generate SVG when config changes
  useEffect(() => {
    if (!config || config.sections.length === 0) {
      setSvgContent(null);
      setSvgDimensions({ width: 0, height: 0 });
      return;
    }

    let isCancelled = false;

    const generateWallSvg = async () => {
      setIsGenerating(true);
      setError(null);

      try {
        const svgConfig: Config = {
          wall: config.wall,
          routes: [{
            segments: config.sections.map(sectionToSegment),
          }],
        };

        const composedHolds = composeAllRoutes(svgConfig.routes, routes);

        const svg = await generateSvg(svgConfig, composedHolds, {
          showGrid: true,
          showPanelLabels: true,
          showCoordinateLabels: true,
          showArrow: config.showArrow ?? false,
        });

        if (!isCancelled) {
          const normalizedSvg = normalizeSvgForWeb(svg);
          setSvgContent(normalizedSvg);

          // Parse viewBox to get dimensions and offset
          // The SVG generator adds margins for coordinate labels: viewBox="-margin -margin svgWidth svgHeight"
          // The actual wall content starts at (0, 0), so we need to calculate the real wall dimensions
          const viewBoxMatch = normalizedSvg.match(/viewBox=["']([^"']+)["']/);
          if (viewBoxMatch) {
            const [minX, minY, totalWidth, totalHeight] = viewBoxMatch[1].split(/\s+/).map(parseFloat);
            // minX and minY are negative when there's margin (e.g., -80)
            // The margin is -minX on each side, so actual wall = totalWidth + 2*minX (since minX < 0)
            const wallWidth = totalWidth + 2 * minX;
            const wallHeight = totalHeight + 2 * minY;
            // Wall content starts at (0, 0), not at (minX, minY)
            setSvgDimensions({ width: wallWidth, height: wallHeight });
            setSvgViewBoxOffset({ x: 0, y: 0 });
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('SVG generation error:', err);
          setError(err instanceof Error ? err.message : 'Erreur de génération');
        }
      } finally {
        if (!isCancelled) {
          setIsGenerating(false);
        }
      }
    };

    generateWallSvg();

    return () => {
      isCancelled = true;
    };
  }, [config, routes]);

  // Reset selected page only when total pages changes or layout becomes null
  const totalPages = layout?.layout.totalPages ?? 0;
  useEffect(() => {
    if (totalPages > 0) {
      setSelectedPageIndex((prev) => {
        // Keep current selection if valid, otherwise reset to 0
        if (prev !== null && prev < totalPages) {
          return prev;
        }
        return 0;
      });
    } else {
      setSelectedPageIndex(null);
    }
  }, [totalPages]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!svgContent || !layout || !config) return;

    setIsExporting(true);
    setExportProgress(undefined);

    try {
      const filename = `${config.name.replace(/\s+/g, '_')}_${printConfig.mode === 'lane-by-lane' ? 'couloirs' : 'mur'}.pdf`;

      await generateAndDownloadPdf(
        {
          configName: config.name,
          svgContent,
          layout,
          lanes: layout.lanes,
        },
        filename,
        (current, total) => setExportProgress({ current, total })
      );
    } catch (err) {
      console.error('PDF export error:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
      setExportProgress(undefined);
    }
  }, [svgContent, layout, config, printConfig.mode]);

  // Go back to main view
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col bg-base-300">
      {/* Header */}
      <header className="navbar bg-base-200 border-b border-base-300">
        <div className="flex-1 flex items-center gap-4">
          <button
            className="btn btn-sm btn-ghost gap-2"
            onClick={handleBack}
          >
            <ArrowLeft size={16} />
            Retour
          </button>
          <span className="text-xl font-bold">Impression multi-pages</span>
        </div>
        {config && (
          <div className="flex-none">
            <span className="text-base-content/70">{config.name}</span>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 p-4 gap-4">
        {/* Left panel - Configuration */}
        <div className="w-72 flex-shrink-0">
          <PrintConfig
            config={printConfig}
            onChange={setPrintConfig}
            onExport={handleExport}
            isExporting={isExporting}
            exportProgress={exportProgress}
            totalPages={layout?.layout.totalPages ?? 0}
          />
        </div>

        {/* Right panel - Preview */}
        <div className="flex-1 flex flex-col min-w-0 gap-4">
          {/* Loading / Error states */}
          {isGenerating && (
            <div className="flex-1 flex items-center justify-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="alert alert-error max-w-md">
                <span>{error}</span>
              </div>
            </div>
          )}

          {!config && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-base-content/40 text-lg text-center">
                <p>Aucune configuration sélectionnée</p>
              </div>
            </div>
          )}

          {config && config.sections.length === 0 && !isGenerating && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-base-content/40 text-lg text-center">
                <p>La configuration ne contient aucune section</p>
              </div>
            </div>
          )}

          {/* Preview content */}
          {svgContent && !error && !isGenerating && (
            <>
              {/* Page grid */}
              <div className="bg-base-200 rounded-lg p-4">
                <PageGrid
                  layout={layout}
                  selectedPageIndex={selectedPageIndex}
                  onSelectPage={setSelectedPageIndex}
                  svgContent={svgContent}
                />
              </div>

              {/* Page detail */}
              <PageDetail
                layout={layout}
                selectedPageIndex={selectedPageIndex}
                svgContent={svgContent}
                configName={config?.name ?? ''}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PrintPage;
