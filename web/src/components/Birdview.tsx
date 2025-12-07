/**
 * Vue d'ensemble (minimap) component showing overview and viewport position
 */

import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useViewerStore } from '@/store';

interface BirdviewProps {
  svgContent: string | null;
  svgWidth: number;
  svgHeight: number;
  containerWidth: number;
  containerHeight: number;
}

const MAX_MINIMAP_WIDTH = 120;
const MAX_MINIMAP_HEIGHT = 200;
const PADDING = 4;

export function Birdview({
  svgContent,
  svgWidth,
  svgHeight,
  containerWidth,
  containerHeight,
}: BirdviewProps) {
  const { zoom, panX, panY, setPan } = useViewerStore(
    useShallow((s) => ({
      zoom: s.zoom,
      panX: s.panX,
      panY: s.panY,
      setPan: s.setPan,
    }))
  );
  const minimapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const rafId = useRef<number | null>(null);
  const pendingUpdate = useRef<{ clientX: number; clientY: number } | null>(null);

  // Global mouseup listener to handle drag release outside component
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseUp = () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      pendingUpdate.current = null;
      setIsDragging(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  // Calculate minimap dimensions based on SVG aspect ratio
  const minimapDimensions = useMemo(() => {
    if (svgWidth === 0 || svgHeight === 0) {
      return { width: MAX_MINIMAP_WIDTH, height: MAX_MINIMAP_HEIGHT };
    }

    const aspectRatio = svgWidth / svgHeight;
    let width: number;
    let height: number;

    if (aspectRatio > MAX_MINIMAP_WIDTH / MAX_MINIMAP_HEIGHT) {
      // SVG is wider than minimap max ratio - constrain by width
      width = MAX_MINIMAP_WIDTH;
      height = width / aspectRatio;
    } else {
      // SVG is taller than minimap max ratio - constrain by height
      height = MAX_MINIMAP_HEIGHT;
      width = height * aspectRatio;
    }

    return { width, height };
  }, [svgWidth, svgHeight]);

  // Calculate scale to fit SVG in minimap
  const minimapScale = useMemo(() => {
    if (svgWidth === 0 || svgHeight === 0) return 1;
    const availableWidth = minimapDimensions.width - PADDING * 2;
    const availableHeight = minimapDimensions.height - PADDING * 2;
    const scaleX = availableWidth / svgWidth;
    const scaleY = availableHeight / svgHeight;
    return Math.min(scaleX, scaleY);
  }, [svgWidth, svgHeight, minimapDimensions]);

  // Calculate viewport rectangle in minimap coordinates
  const viewportRect = useMemo(() => {
    if (svgWidth === 0 || svgHeight === 0 || containerWidth === 0 || containerHeight === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    // At zoom=1, the SVG fits the container while maintaining aspect ratio
    // The fitScale tells us how the SVG is scaled to fit
    const fitScaleX = containerWidth / svgWidth;
    const fitScaleY = containerHeight / svgHeight;
    const fitScale = Math.min(fitScaleX, fitScaleY);

    // The effective scale at current zoom
    const effectiveScale = fitScale * zoom;

    // Visible area in SVG coordinates
    const visibleWidth = containerWidth / effectiveScale;
    const visibleHeight = containerHeight / effectiveScale;

    // Center of container in SVG coordinates
    // At pan (0,0) and zoom 1, the SVG center is at container center
    // Pan moves the SVG (in screen pixels), so convert to SVG units
    const centerX = svgWidth / 2 - panX / effectiveScale;
    const centerY = svgHeight / 2 - panY / effectiveScale;

    // Top-left of visible area in SVG coordinates
    const visibleLeft = centerX - visibleWidth / 2;
    const visibleTop = centerY - visibleHeight / 2;

    // Convert to minimap coordinates and clamp to SVG bounds
    const rawX = PADDING + visibleLeft * minimapScale;
    const rawY = PADDING + visibleTop * minimapScale;
    const rawWidth = visibleWidth * minimapScale;
    const rawHeight = visibleHeight * minimapScale;

    // Clamp to minimap bounds (SVG area)
    const svgMinimapWidth = svgWidth * minimapScale;
    const svgMinimapHeight = svgHeight * minimapScale;

    const clampedX = Math.max(PADDING, Math.min(PADDING + svgMinimapWidth - 4, rawX));
    const clampedY = Math.max(PADDING, Math.min(PADDING + svgMinimapHeight - 4, rawY));
    const clampedWidth = Math.min(rawWidth, svgMinimapWidth - (clampedX - PADDING));
    const clampedHeight = Math.min(rawHeight, svgMinimapHeight - (clampedY - PADDING));

    return {
      x: clampedX,
      y: clampedY,
      width: Math.max(4, clampedWidth),
      height: Math.max(4, clampedHeight),
    };
  }, [svgWidth, svgHeight, containerWidth, containerHeight, zoom, panX, panY, minimapScale]);

  // Helper to update pan from minimap position
  const updatePanFromMinimap = useCallback(
    (clientX: number, clientY: number) => {
      if (!minimapRef.current || svgWidth === 0 || svgHeight === 0 || containerWidth === 0 || containerHeight === 0) return;

      const rect = minimapRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left - PADDING;
      const clickY = clientY - rect.top - PADDING;

      // Convert click position to SVG coordinates
      const svgClickX = clickX / minimapScale;
      const svgClickY = clickY / minimapScale;

      // Clamp to SVG bounds
      const clampedSvgX = Math.max(0, Math.min(svgWidth, svgClickX));
      const clampedSvgY = Math.max(0, Math.min(svgHeight, svgClickY));

      // Calculate effective scale (same as in viewportRect)
      const fitScaleX = containerWidth / svgWidth;
      const fitScaleY = containerHeight / svgHeight;
      const fitScale = Math.min(fitScaleX, fitScaleY);
      const effectiveScale = fitScale * zoom;

      // Calculate visible area size in SVG coordinates
      const visibleWidth = containerWidth / effectiveScale;
      const visibleHeight = containerHeight / effectiveScale;

      // Calculate pan limits to keep viewport within SVG bounds
      const maxPanX = Math.max(0, (svgWidth - visibleWidth) / 2) * effectiveScale;
      const maxPanY = Math.max(0, (svgHeight - visibleHeight) / 2) * effectiveScale;

      // Calculate new pan to center on clicked position
      let newPanX = (svgWidth / 2 - clampedSvgX) * effectiveScale;
      let newPanY = (svgHeight / 2 - clampedSvgY) * effectiveScale;

      // Clamp pan values
      newPanX = Math.max(-maxPanX, Math.min(maxPanX, newPanX));
      newPanY = Math.max(-maxPanY, Math.min(maxPanY, newPanY));

      setPan(newPanX, newPanY);
    },
    [svgWidth, svgHeight, containerWidth, containerHeight, minimapScale, zoom, setPan]
  );

  // Handle mouse down on minimap
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
      updatePanFromMinimap(e.clientX, e.clientY);
    },
    [updatePanFromMinimap]
  );

  // Handle mouse move for drag with RAF throttling
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      // Store latest position for RAF batch
      pendingUpdate.current = { clientX: e.clientX, clientY: e.clientY };

      // Schedule RAF if not already scheduled
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(() => {
          if (pendingUpdate.current) {
            updatePanFromMinimap(pendingUpdate.current.clientX, pendingUpdate.current.clientY);
            pendingUpdate.current = null;
          }
          rafId.current = null;
        });
      }
    },
    [isDragging, updatePanFromMinimap]
  );

  // Handle mouse up with RAF cleanup
  const handleMouseUp = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    pendingUpdate.current = null;
    setIsDragging(false);
  }, []);

  // Handle mouse leave with RAF cleanup
  const handleMouseLeave = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    pendingUpdate.current = null;
    setIsDragging(false);
  }, []);

  // Calculate the actual SVG display size in the minimap
  const svgDisplaySize = useMemo(() => {
    if (svgWidth === 0 || svgHeight === 0) return { width: 0, height: 0 };
    return {
      width: svgWidth * minimapScale,
      height: svgHeight * minimapScale,
    };
  }, [svgWidth, svgHeight, minimapScale]);

  // SVG container style for minimap - force SVG to fit
  const svgContainerStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: PADDING,
      left: PADDING,
      width: svgDisplaySize.width,
      height: svgDisplaySize.height,
      pointerEvents: 'none' as const,
    }),
    [svgDisplaySize]
  );

  return (
    <div
      ref={minimapRef}
      className={`absolute bottom-4 right-4 bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
      style={{
        width: minimapDimensions.width,
        height: minimapDimensions.height,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {svgContent ? (
        <>
          {/* SVG thumbnail - force SVG to fill container */}
          <div
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={svgContainerStyle}
            className="[&>svg]:w-full [&>svg]:h-full"
          />
          {/* Viewport indicator */}
          <div
            className={`absolute border-2 border-primary bg-primary/20 pointer-events-none ${isDragging ? 'opacity-50' : ''}`}
            style={{
              left: viewportRect.x,
              top: viewportRect.y,
              width: Math.max(viewportRect.width, 4),
              height: Math.max(viewportRect.height, 4),
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-base-content/40">
          Vue d'ensemble
        </div>
      )}
    </div>
  );
}
