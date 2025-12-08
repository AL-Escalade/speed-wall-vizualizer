/**
 * Hook to handle touch gestures for the viewer
 * Supports single-finger pan, pinch-to-zoom, and double-tap to reset
 */

import { useRef, useEffect } from 'react';

interface TouchGestureCallbacks {
  onPinchZoom: (delta: number, centerX: number, centerY: number) => void;
  onPan: (deltaX: number, deltaY: number) => void;
  onDoubleTap: () => void;
}

interface PinchState {
  lastDistance: number;
  lastCenterX: number;
  lastCenterY: number;
}

interface SingleTouchState {
  lastX: number;
  lastY: number;
  isPanning: boolean;
}

/**
 * Calculate distance between two touch points
 */
function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate center point between two touches
 */
function getCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
}

export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement | null>,
  callbacks: TouchGestureCallbacks
) {
  const pinchStateRef = useRef<PinchState | null>(null);
  const singleTouchRef = useRef<SingleTouchState | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const lastTapPosRef = useRef<{ x: number; y: number } | null>(null);

  // Store callbacks in refs to avoid re-attaching event listeners
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Two-finger gesture start - prevent default to stop page scroll/zoom
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = getDistance(touch1, touch2);
        const center = getCenter(touch1, touch2);

        pinchStateRef.current = {
          lastDistance: distance,
          lastCenterX: center.x,
          lastCenterY: center.y,
        };
        // Cancel single touch state when switching to pinch
        singleTouchRef.current = null;
      } else if (e.touches.length === 1) {
        // Single finger - check for double tap
        const now = Date.now();
        const touch = e.touches[0];
        const lastTap = lastTapPosRef.current;

        // Double tap: within 300ms and 50px of last tap
        if (
          lastTap &&
          now - lastTapTimeRef.current < 300 &&
          Math.abs(touch.clientX - lastTap.x) < 50 &&
          Math.abs(touch.clientY - lastTap.y) < 50
        ) {
          e.preventDefault();
          callbacksRef.current.onDoubleTap();
          lastTapTimeRef.current = 0;
          lastTapPosRef.current = null;
          singleTouchRef.current = null;
        } else {
          lastTapTimeRef.current = now;
          lastTapPosRef.current = { x: touch.clientX, y: touch.clientY };
          // Initialize single touch for potential panning
          singleTouchRef.current = {
            lastX: touch.clientX,
            lastY: touch.clientY,
            isPanning: false,
          };
        }
        pinchStateRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Two-finger pinch/zoom
      if (e.touches.length === 2 && pinchStateRef.current) {
        e.preventDefault();

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = getDistance(touch1, touch2);
        const center = getCenter(touch1, touch2);
        const state = pinchStateRef.current;

        // Calculate pinch zoom delta (as a ratio)
        const scale = currentDistance / state.lastDistance;
        const zoomDelta = scale - 1; // Convert to delta: 1.1 -> 0.1, 0.9 -> -0.1

        // Calculate pan delta
        const panDeltaX = center.x - state.lastCenterX;
        const panDeltaY = center.y - state.lastCenterY;

        // Update state for next move
        state.lastDistance = currentDistance;
        state.lastCenterX = center.x;
        state.lastCenterY = center.y;

        // Apply zoom if significant - zoomAtPoint keeps the pinch center fixed
        const isZooming = Math.abs(zoomDelta) > 0.005;
        if (isZooming) {
          callbacksRef.current.onPinchZoom(zoomDelta, center.x, center.y);
        }

        // Only apply pan when NOT zooming (pure two-finger pan)
        // When zooming, zoomAtPoint already handles keeping the pinch center fixed
        if (!isZooming && (panDeltaX !== 0 || panDeltaY !== 0)) {
          callbacksRef.current.onPan(panDeltaX, panDeltaY);
        }
        return;
      }

      // Single-finger pan
      if (e.touches.length === 1 && singleTouchRef.current) {
        const touch = e.touches[0];
        const state = singleTouchRef.current;

        const deltaX = touch.clientX - state.lastX;
        const deltaY = touch.clientY - state.lastY;

        // Start panning after a small movement threshold (5px) to avoid accidental pans
        if (!state.isPanning && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
          state.isPanning = true;
        }

        if (state.isPanning) {
          e.preventDefault();
          state.lastX = touch.clientX;
          state.lastY = touch.clientY;
          callbacksRef.current.onPan(deltaX, deltaY);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStateRef.current = null;
      }
      if (e.touches.length === 0) {
        singleTouchRef.current = null;
      }
    };

    // Use passive: false to allow preventDefault
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [elementRef]);
}
