/**
 * SVG Viewer component with zoom and pan capabilities
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { generateSvg, composeAllRoutes, type Config } from '@voie-vitesse/core';
import { useShallow } from 'zustand/react/shallow';
import { useConfigStore, useRoutesStore, useViewerStore, useSelectionStore } from '@/store';
import { sectionToSegment, normalizeSvgForWeb } from '@/utils/sectionMapper';
import { Birdview } from './Birdview';
import { ZoomIn, ZoomOut, Home } from 'lucide-react';

export function Viewer() {
  const config = useConfigStore((s) =>
    s.configurations.find((c) => c.id === s.activeConfigId) ?? null
  );
  const updateSection = useConfigStore((s) => s.updateSection);
  const routes = useRoutesStore((s) => s.routes);
  const { zoom, panX, panY, zoomIn, zoomOut, pan, zoomBy, resetToFit } = useViewerStore(
    useShallow((s) => ({
      zoom: s.zoom,
      panX: s.panX,
      panY: s.panY,
      zoomIn: s.zoomIn,
      zoomOut: s.zoomOut,
      pan: s.pan,
      zoomBy: s.zoomBy,
      resetToFit: s.resetToFit,
    }))
  );
  const { mode: selectionMode, sectionId: selectionSectionId, clearSelection } = useSelectionStore(
    useShallow((s) => ({
      mode: s.mode,
      sectionId: s.sectionId,
      clearSelection: s.clearSelection,
    }))
  );

  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const hasInitialFit = useRef(false);

  // Generate SVG when config changes
  useEffect(() => {
    if (!config || config.sections.length === 0) {
      setSvgContent(null);
      return;
    }

    let isCancelled = false;

    const generateWallSvg = async () => {
      setIsGenerating(true);
      setError(null);

      try {
        // Build config for SVG generation
        const svgConfig: Config = {
          wall: config.wall,
          routes: [{
            segments: config.sections.map(sectionToSegment),
          }],
        };

        // Compose all routes
        const composedHolds = composeAllRoutes(svgConfig.routes, routes);

        // Generate SVG
        const svg = await generateSvg(svgConfig, composedHolds, {
          showGrid: true,
          showPanelLabels: true,
          showCoordinateLabels: true,
        });

        if (!isCancelled) {
          setSvgContent(normalizeSvgForWeb(svg));
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

  // Track dimensions when SVG is generated - only fit to view on first load
  useEffect(() => {
    if (svgContent && containerRef.current && svgRef.current) {
      const container = containerRef.current;
      const svg = svgRef.current.querySelector('svg');
      if (svg) {
        const viewBox = svg.getAttribute('viewBox')?.split(' ');
        if (viewBox && viewBox.length === 4) {
          const contentWidth = parseFloat(viewBox[2]);
          const contentHeight = parseFloat(viewBox[3]);
          setSvgDimensions({ width: contentWidth, height: contentHeight });
          setContainerDimensions({ width: container.clientWidth, height: container.clientHeight });

          // Only zoom to fit on first render
          if (!hasInitialFit.current) {
            hasInitialFit.current = true;
            resetToFit();
          }
        }
      }
    }
  }, [svgContent, resetToFit]);

  // Update container dimensions on resize (debounced with requestAnimationFrame)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | undefined;

    const resizeObserver = new ResizeObserver((entries) => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        for (const entry of entries) {
          setContainerDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
    });

    resizeObserver.observe(container);
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver.disconnect();
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectionMode) {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionMode, clearSelection]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoomBy(delta);
  }, [zoomBy]);

  // Handle mouse down for pan
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) { // Left click
      setIsPanning(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  // Handle mouse move for pan
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPos.current.x;
      const deltaY = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      pan(deltaX, deltaY);
    }
  }, [isPanning, pan]);

  // Handle mouse up for pan
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle mouse leave for pan
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle zoom to fit button click
  const handleZoomToFit = useCallback(() => {
    if (svgDimensions.width > 0 && containerDimensions.width > 0) {
      resetToFit();
    }
  }, [svgDimensions.width, containerDimensions.width, resetToFit]);

  // Handle click on SVG for hold selection
  const handleSvgClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectionMode || !selectionSectionId) return;

    // Find the clicked hold element
    const target = e.target as Element;
    const holdGroup = target.closest('g.hold');
    if (!holdGroup) return;

    // Get hold data from attributes
    const holdNumber = holdGroup.getAttribute('data-hold');
    if (!holdNumber) return;

    const holdNum = parseInt(holdNumber, 10);

    // Update the section
    if (selectionMode === 'from') {
      updateSection(selectionSectionId, { fromHold: holdNum });
    } else if (selectionMode === 'to') {
      updateSection(selectionSectionId, { toHold: holdNum });
    }

    clearSelection();
  }, [selectionMode, selectionSectionId, updateSection, clearSelection]);

  // Compute transform style
  const transformStyle = useMemo(() => ({
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
    transformOrigin: 'center center',
  }), [zoom, panX, panY]);

  return (
    <main className="flex-1 bg-base-300 relative overflow-hidden">
      {/* Selection mode indicator */}
      {selectionMode && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-primary text-primary-content py-2 px-4 flex items-center justify-between">
          <span>
            {selectionMode === 'from'
              ? 'Cliquez sur une prise pour définir le début'
              : 'Cliquez sur une prise pour définir la fin'}
          </span>
          <button className="btn btn-sm btn-ghost" onClick={clearSelection}>
            Annuler
          </button>
        </div>
      )}

      {/* Zoom controls */}
      <div className={`absolute right-4 z-10 flex flex-col gap-2 ${selectionMode ? 'top-16' : 'top-4'}`}>
        <button
          className="btn btn-sm btn-square btn-neutral"
          title="Zoom +"
          onClick={zoomIn}
        >
          <ZoomIn size={18} />
        </button>
        <button
          className="btn btn-sm btn-square btn-neutral"
          title="Zoom -"
          onClick={zoomOut}
        >
          <ZoomOut size={18} />
        </button>
        <button
          className="btn btn-sm btn-square btn-neutral"
          title="Vue d'ensemble"
          onClick={handleZoomToFit}
        >
          <Home size={18} />
        </button>
        <div className="text-xs text-center bg-base-100 rounded px-1">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* SVG Container */}
      <div
        ref={containerRef}
        className={`absolute inset-0 overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-300/50 z-20">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="alert alert-error max-w-md">
              <span>{error}</span>
            </div>
          </div>
        )}

        {!config && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-base-content/40 text-lg text-center">
              <p>Créez une configuration pour commencer</p>
              <p className="text-sm mt-2">Cliquez sur + dans la sidebar</p>
            </div>
          </div>
        )}

        {config && config.sections.length === 0 && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-base-content/40 text-lg text-center">
              <p>Ajoutez des sections pour visualiser le mur</p>
              <p className="text-sm mt-2">Cliquez sur "Ajouter" dans la sidebar</p>
            </div>
          </div>
        )}

        {svgContent && !error && (
          <div
            ref={svgRef}
            className={`absolute inset-0 flex items-center justify-center ${selectionMode ? 'selection-mode' : ''}`}
            style={transformStyle}
            dangerouslySetInnerHTML={{ __html: svgContent }}
            onClick={handleSvgClick}
          />
        )}
      </div>

      {/* Birdview minimap */}
      <Birdview
        svgContent={svgContent}
        svgWidth={svgDimensions.width}
        svgHeight={svgDimensions.height}
        containerWidth={containerDimensions.width}
        containerHeight={containerDimensions.height}
      />
    </main>
  );
}
