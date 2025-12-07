/**
 * Viewer state store for zoom and pan
 */

import { create } from 'zustand';
import type { ViewerState } from './types';

/** Default zoom limits */
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.2;

interface ViewerStoreState extends ViewerState {
  // Actions
  /** Zoom in */
  zoomIn: () => void;
  /** Zoom out */
  zoomOut: () => void;
  /** Set zoom level */
  setZoom: (zoom: number) => void;
  /** Zoom by delta */
  zoomBy: (delta: number) => void;
  /** Pan by delta */
  pan: (deltaX: number, deltaY: number) => void;
  /** Set pan position */
  setPan: (x: number, y: number) => void;
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

  zoomIn: () => {
    set((state) => ({
      zoom: Math.min(MAX_ZOOM, state.zoom + ZOOM_STEP),
    }));
  },

  zoomOut: () => {
    set((state) => ({
      zoom: Math.max(MIN_ZOOM, state.zoom - ZOOM_STEP),
    }));
  },

  setZoom: (zoom: number) => {
    set({ zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) });
  },

  zoomBy: (delta: number) => {
    set((state) => ({
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.zoom + delta)),
    }));
  },

  pan: (deltaX: number, deltaY: number) => {
    set((state) => ({
      panX: state.panX + deltaX,
      panY: state.panY + deltaY,
    }));
  },

  setPan: (x: number, y: number) => {
    set({ panX: x, panY: y });
  },

  resetToFit: () => {
    set({
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  },
}));
