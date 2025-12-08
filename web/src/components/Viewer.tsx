/**
 * SVG Viewer component with zoom and pan capabilities
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { generateSvg, composeAllRoutes, type Config } from '@voie-vitesse/core';
import { useShallow } from 'zustand/react/shallow';
import { useConfigStore, useRoutesStore, useViewerStore, DEFAULT_DISPLAY_OPTIONS } from '@/store';
import { sectionToSegment, normalizeSvgForWeb } from '@/utils/sectionMapper';
import { Birdview } from './Birdview';
import { ZoomIn, ZoomOut, Home } from 'lucide-react';

export function Viewer() {
  const config = useConfigStore((s) =>
    s.configurations.find((c) => c.id === s.activeConfigId) ?? null
  );
  const routes = useRoutesStore((s) => s.routes);
  const { zoom, panX, panY, zoomIn, zoomOut, pan, zoomAtPoint, resetToFit, setContainerDimensions: setStoreDimensions } = useViewerStore(
    useShallow((s) => ({
      zoom: s.zoom,
      panX: s.panX,
      panY: s.panY,
      zoomIn: s.zoomIn,
      zoomOut: s.zoomOut,
      pan: s.pan,
      zoomAtPoint: s.zoomAtPoint,
      resetToFit: s.resetToFit,
      setContainerDimensions: s.setContainerDimensions,
    }))
  );

  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [svgDataUrl, setSvgDataUrl] = useState<string | null>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const hasInitialFit = useRef(false);
  const rafPanId = useRef<number | null>(null);
  const pendingPan = useRef<{ deltaX: number; deltaY: number } | null>(null);
  const rafZoomId = useRef<number | null>(null);
  const pendingZoom = useRef<{ delta: number; pointX: number; pointY: number } | null>(null);

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

        // Merge display options with defaults
        const displayOptions = { ...DEFAULT_DISPLAY_OPTIONS, ...config.displayOptions };

        // Generate SVG
        const svg = await generateSvg(svgConfig, composedHolds, {
          showGrid: true,
          showPanelLabels: true,
          showCoordinateLabels: true,
          showArrow: config.showArrow ?? false,
          gridColor: displayOptions.gridColor,
          labelFontSize: displayOptions.labelFontSize,
          holdLabelFontSize: displayOptions.holdLabelFontSize,
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

  // Convert SVG to data URL for optimized rendering
  useEffect(() => {
    if (!svgContent) {
      setSvgDataUrl(null);
      return;
    }

    const encoded = encodeURIComponent(svgContent)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
    setSvgDataUrl(`data:image/svg+xml,${encoded}`);
  }, [svgContent]);

  // Track dimensions when SVG is generated - only fit to view on first load
  useEffect(() => {
    if (svgContent && containerRef.current) {
      const container = containerRef.current;
      // Parse viewBox from SVG string
      const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
      if (viewBoxMatch) {
        const viewBox = viewBoxMatch[1].split(/\s+/);
        if (viewBox.length === 4) {
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
          const { width, height } = entry.contentRect;
          setContainerDimensions({ width, height });
          setStoreDimensions(width, height); // Update store for pan constraints
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
  }, [setStoreDimensions]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafPanId.current) {
        cancelAnimationFrame(rafPanId.current);
      }
      if (rafZoomId.current) {
        cancelAnimationFrame(rafZoomId.current);
      }
    };
  }, []);

  // Handle wheel zoom toward pointer with RAF throttling
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;

    // Calculate mouse position relative to container center
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const pointX = e.clientX - rect.left - centerX;
    const pointY = e.clientY - rect.top - centerY;

    // Accumulate zoom deltas for RAF batch
    if (pendingZoom.current) {
      pendingZoom.current.delta += delta;
      // Update point to latest mouse position
      pendingZoom.current.pointX = pointX;
      pendingZoom.current.pointY = pointY;
    } else {
      pendingZoom.current = { delta, pointX, pointY };
    }

    // Schedule RAF if not already scheduled
    if (!rafZoomId.current) {
      rafZoomId.current = requestAnimationFrame(() => {
        if (pendingZoom.current) {
          zoomAtPoint(pendingZoom.current.delta, pendingZoom.current.pointX, pendingZoom.current.pointY);
          pendingZoom.current = null;
        }
        rafZoomId.current = null;
      });
    }
  }, [zoomAtPoint]);

  // Handle mouse down for pan
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) { // Left click
      setIsPanning(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  // Global mouse event listeners to handle pan even outside container
  useEffect(() => {
    if (!isPanning) return;

    const handleGlobalMouseUp = () => {
      if (rafPanId.current) {
        cancelAnimationFrame(rafPanId.current);
        rafPanId.current = null;
      }
      if (pendingPan.current) {
        pan(pendingPan.current.deltaX, pendingPan.current.deltaY);
        pendingPan.current = null;
      }
      setIsPanning(false);
    };

    // Also handle mouse move globally while panning
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - lastPos.current.x;
      const deltaY = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };

      if (pendingPan.current) {
        pendingPan.current.deltaX += deltaX;
        pendingPan.current.deltaY += deltaY;
      } else {
        pendingPan.current = { deltaX, deltaY };
      }

      if (!rafPanId.current) {
        rafPanId.current = requestAnimationFrame(() => {
          if (pendingPan.current) {
            pan(pendingPan.current.deltaX, pendingPan.current.deltaY);
            pendingPan.current = null;
          }
          rafPanId.current = null;
        });
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isPanning, pan]);

  // Handle zoom to fit button click
  const handleZoomToFit = useCallback(() => {
    if (svgDimensions.width > 0 && containerDimensions.width > 0) {
      resetToFit();
    }
  }, [svgDimensions.width, containerDimensions.width, resetToFit]);

  // Compute transform style with GPU acceleration hints
  const transformStyle = useMemo(() => ({
    transform: `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`,
    transformOrigin: 'center center',
    willChange: isPanning ? 'transform' : 'auto',
    contain: 'strict',
  }), [zoom, panX, panY, isPanning]);

  return (
    <main className="flex-1 bg-base-300 relative overflow-hidden">
      {/* Zoom controls */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
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
        style={{ contain: 'strict' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
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

        {svgDataUrl && !error && (
          <div
            ref={svgRef}
            className="absolute inset-0 flex items-center justify-center"
            style={transformStyle}
          >
            <img
              src={svgDataUrl}
              alt="Climbing wall"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
              draggable={false}
            />
          </div>
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
