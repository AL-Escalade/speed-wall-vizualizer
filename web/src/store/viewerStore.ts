/**
 * Viewer state store for zoom and pan
 */

import { create } from 'zustand';
import type { ViewerState } from './types';

/** Default zoom limits */
const MIN_ZOOM = 1; // Minimum = fit to screen (home button level)
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.2;

/**
 * Calculate max pan values based on zoom and container dimensions
 * At zoom=1, content fits exactly so pan should be 0
 * At zoom > 1, we can pan but content must always cover the viewport
 */
function getMaxPan(zoom: number, containerWidth: number, containerHeight: number) {
  // Max pan = container dimension * (zoom - 1) / 2
  return {
    x: containerWidth * (zoom - 1) / 2,
    y: containerHeight * (zoom - 1) / 2,
  };
}

/** Clamp pan values to valid range */
function clampPan(
  panX: number,
  panY: number,
  zoom: number,
  containerWidth: number,
  containerHeight: number
) {
  // Don't clamp if dimensions aren't set yet
  if (containerWidth === 0 || containerHeight === 0) {
    return { panX, panY };
  }
  const maxPan = getMaxPan(zoom, containerWidth, containerHeight);
  return {
    panX: Math.max(-maxPan.x, Math.min(maxPan.x, panX)),
    panY: Math.max(-maxPan.y, Math.min(maxPan.y, panY)),
  };
}

interface ViewerStoreState extends ViewerState {
  /** Container dimensions for pan constraints */
  containerWidth: number;
  containerHeight: number;
  // Actions
  /** Zoom in */
  zoomIn: () => void;
  /** Zoom out */
  zoomOut: () => void;
  /** Set zoom level */
  setZoom: (zoom: number) => void;
  /** Zoom by delta */
  zoomBy: (delta: number) => void;
  /** Zoom by delta at a specific point (for mouse wheel zoom) */
  zoomAtPoint: (delta: number, pointX: number, pointY: number) => void;
  /** Pan by delta */
  pan: (deltaX: number, deltaY: number) => void;
  /** Set pan position */
  setPan: (x: number, y: number) => void;
  /** Set container dimensions for pan constraints */
  setContainerDimensions: (width: number, height: number) => void;
  /**
   * Reset zoom and pan to fit content in viewport.
   * Since SVG uses 100% width/height with viewBox, it auto-fits at zoom=1.
   */
  resetToFit: () => void;
}

export const useViewerStore = create<ViewerStoreState>()((set) => ({
  zoom: 1,
  panX: 0,
  panY: 0,
  containerWidth: 0,
  containerHeight: 0,

  zoomIn: () => {
    set((state) => ({
      zoom: Math.min(MAX_ZOOM, state.zoom + ZOOM_STEP),
    }));
  },

  zoomOut: () => {
    set((state) => {
      const newZoom = Math.max(MIN_ZOOM, state.zoom - ZOOM_STEP);
      // Re-clamp pan values for new zoom level
      const clamped = clampPan(state.panX, state.panY, newZoom, state.containerWidth, state.containerHeight);
      return { zoom: newZoom, ...clamped };
    });
  },

  setZoom: (zoom: number) => {
    set((state) => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
      const clamped = clampPan(state.panX, state.panY, newZoom, state.containerWidth, state.containerHeight);
      return { zoom: newZoom, ...clamped };
    });
  },

  zoomBy: (delta: number) => {
    set((state) => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.zoom + delta));
      const clamped = clampPan(state.panX, state.panY, newZoom, state.containerWidth, state.containerHeight);
      return { zoom: newZoom, ...clamped };
    });
  },

  zoomAtPoint: (delta: number, pointX: number, pointY: number) => {
    set((state) => {
      const oldZoom = state.zoom;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom + delta));

      // If zoom didn't change (at limits), no need to adjust pan
      if (newZoom === oldZoom) return {};

      // Calculate new pan to keep the point under the cursor fixed
      // Formula: newPan = point * (1 - newZoom/oldZoom) + oldPan * (newZoom/oldZoom)
      const zoomRatio = newZoom / oldZoom;
      const newPanX = pointX * (1 - zoomRatio) + state.panX * zoomRatio;
      const newPanY = pointY * (1 - zoomRatio) + state.panY * zoomRatio;

      const clamped = clampPan(newPanX, newPanY, newZoom, state.containerWidth, state.containerHeight);
      return { zoom: newZoom, ...clamped };
    });
  },

  pan: (deltaX: number, deltaY: number) => {
    set((state) => {
      const newPanX = state.panX + deltaX;
      const newPanY = state.panY + deltaY;
      return clampPan(newPanX, newPanY, state.zoom, state.containerWidth, state.containerHeight);
    });
  },

  setPan: (x: number, y: number) => {
    set((state) => clampPan(x, y, state.zoom, state.containerWidth, state.containerHeight));
  },

  setContainerDimensions: (width: number, height: number) => {
    set((state) => {
      // Re-clamp pan values for new dimensions
      const clamped = clampPan(state.panX, state.panY, state.zoom, width, height);
      return { containerWidth: width, containerHeight: height, ...clamped };
    });
  },

  resetToFit: () => {
    set({
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  },
}));
