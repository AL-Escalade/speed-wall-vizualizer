import { describe, it, expect, beforeEach } from 'vitest';
import { useViewerStore } from './viewerStore';

describe('viewerStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useViewerStore.setState({
      zoom: 1,
      panX: 0,
      panY: 0,
      containerWidth: 0,
      containerHeight: 0,
    });
  });

  describe('initial state', () => {
    it('should have default zoom of 1', () => {
      expect(useViewerStore.getState().zoom).toBe(1);
    });

    it('should have default pan of 0', () => {
      const state = useViewerStore.getState();
      expect(state.panX).toBe(0);
      expect(state.panY).toBe(0);
    });
  });

  describe('zoomIn', () => {
    it('should increase zoom by 0.2', () => {
      useViewerStore.getState().zoomIn();
      expect(useViewerStore.getState().zoom).toBe(1.2);
    });

    it('should not exceed max zoom of 5', () => {
      useViewerStore.setState({ zoom: 4.9 });
      useViewerStore.getState().zoomIn();
      expect(useViewerStore.getState().zoom).toBe(5);
    });
  });

  describe('zoomOut', () => {
    it('should decrease zoom by 0.2', () => {
      useViewerStore.setState({ zoom: 2 });
      useViewerStore.getState().zoomOut();
      expect(useViewerStore.getState().zoom).toBe(1.8);
    });

    it('should not go below min zoom of 1', () => {
      useViewerStore.setState({ zoom: 1.1 });
      useViewerStore.getState().zoomOut();
      expect(useViewerStore.getState().zoom).toBe(1);
    });

    it('should clamp pan values when zooming out', () => {
      useViewerStore.setState({
        zoom: 2,
        panX: 100,
        panY: 100,
        containerWidth: 200,
        containerHeight: 200,
      });
      useViewerStore.getState().zoomOut();
      // At zoom 1.8, max pan = 200 * (1.8 - 1) / 2 = 80
      expect(useViewerStore.getState().panX).toBe(80);
      expect(useViewerStore.getState().panY).toBe(80);
    });
  });

  describe('setZoom', () => {
    it('should set zoom to specified value', () => {
      useViewerStore.getState().setZoom(2.5);
      expect(useViewerStore.getState().zoom).toBe(2.5);
    });

    it('should clamp zoom to min value', () => {
      useViewerStore.getState().setZoom(0.5);
      expect(useViewerStore.getState().zoom).toBe(1);
    });

    it('should clamp zoom to max value', () => {
      useViewerStore.getState().setZoom(10);
      expect(useViewerStore.getState().zoom).toBe(5);
    });
  });

  describe('zoomBy', () => {
    it('should add delta to current zoom', () => {
      useViewerStore.setState({ zoom: 2 });
      useViewerStore.getState().zoomBy(0.5);
      expect(useViewerStore.getState().zoom).toBe(2.5);
    });

    it('should handle negative delta', () => {
      useViewerStore.setState({ zoom: 3 });
      useViewerStore.getState().zoomBy(-1);
      expect(useViewerStore.getState().zoom).toBe(2);
    });

    it('should clamp result to valid range', () => {
      useViewerStore.setState({ zoom: 4.5 });
      useViewerStore.getState().zoomBy(1);
      expect(useViewerStore.getState().zoom).toBe(5);
    });
  });

  describe('zoomAtPoint', () => {
    beforeEach(() => {
      useViewerStore.setState({
        zoom: 2,
        panX: 0,
        panY: 0,
        containerWidth: 400,
        containerHeight: 300,
      });
    });

    it('should zoom and adjust pan to keep point fixed', () => {
      useViewerStore.getState().zoomAtPoint(0.5, 100, 75);
      const state = useViewerStore.getState();
      expect(state.zoom).toBe(2.5);
      // Point should be offset to maintain position under cursor
      expect(state.panX).not.toBe(0);
      expect(state.panY).not.toBe(0);
    });

    it('should not change state when at zoom limits', () => {
      useViewerStore.setState({ zoom: 5 });
      useViewerStore.getState().zoomAtPoint(0.5, 100, 75);
      expect(useViewerStore.getState().zoom).toBe(5);
    });

    it('should clamp pan values after zoom', () => {
      useViewerStore.setState({
        zoom: 1,
        panX: 0,
        panY: 0,
        containerWidth: 100,
        containerHeight: 100,
      });
      // Zooming at a corner with large delta
      useViewerStore.getState().zoomAtPoint(2, 50, 50);
      const state = useViewerStore.getState();
      // Pan should be clamped within valid range
      const maxPan = 100 * (state.zoom - 1) / 2;
      expect(Math.abs(state.panX)).toBeLessThanOrEqual(maxPan);
      expect(Math.abs(state.panY)).toBeLessThanOrEqual(maxPan);
    });
  });

  describe('pan', () => {
    it('should add delta to current pan', () => {
      useViewerStore.setState({
        zoom: 2,
        panX: 10,
        panY: 20,
        containerWidth: 400,
        containerHeight: 300,
      });
      useViewerStore.getState().pan(5, 10);
      expect(useViewerStore.getState().panX).toBe(15);
      expect(useViewerStore.getState().panY).toBe(30);
    });

    it('should clamp pan to valid range', () => {
      useViewerStore.setState({
        zoom: 2,
        panX: 0,
        panY: 0,
        containerWidth: 200,
        containerHeight: 200,
      });
      // At zoom 2, max pan = 200 * (2 - 1) / 2 = 100
      useViewerStore.getState().pan(150, 150);
      expect(useViewerStore.getState().panX).toBe(100);
      expect(useViewerStore.getState().panY).toBe(100);
    });

    it('should allow negative pan values within limits', () => {
      useViewerStore.setState({
        zoom: 2,
        panX: 0,
        panY: 0,
        containerWidth: 200,
        containerHeight: 200,
      });
      useViewerStore.getState().pan(-50, -50);
      expect(useViewerStore.getState().panX).toBe(-50);
      expect(useViewerStore.getState().panY).toBe(-50);
    });
  });

  describe('setPan', () => {
    it('should set pan to specified values', () => {
      useViewerStore.setState({
        zoom: 3,
        containerWidth: 400,
        containerHeight: 300,
      });
      useViewerStore.getState().setPan(50, 30);
      expect(useViewerStore.getState().panX).toBe(50);
      expect(useViewerStore.getState().panY).toBe(30);
    });

    it('should clamp values to valid range', () => {
      useViewerStore.setState({
        zoom: 1.5,
        containerWidth: 200,
        containerHeight: 200,
      });
      // At zoom 1.5, max pan = 200 * (1.5 - 1) / 2 = 50
      useViewerStore.getState().setPan(100, -100);
      expect(useViewerStore.getState().panX).toBe(50);
      expect(useViewerStore.getState().panY).toBe(-50);
    });
  });

  describe('setContainerDimensions', () => {
    it('should set container dimensions', () => {
      useViewerStore.getState().setContainerDimensions(800, 600);
      expect(useViewerStore.getState().containerWidth).toBe(800);
      expect(useViewerStore.getState().containerHeight).toBe(600);
    });

    it('should re-clamp pan when dimensions change', () => {
      useViewerStore.setState({
        zoom: 2,
        panX: 200,
        panY: 200,
        containerWidth: 500,
        containerHeight: 500,
      });
      // Reducing dimensions should clamp pan
      useViewerStore.getState().setContainerDimensions(100, 100);
      // At zoom 2, max pan = 100 * (2 - 1) / 2 = 50
      expect(useViewerStore.getState().panX).toBe(50);
      expect(useViewerStore.getState().panY).toBe(50);
    });
  });

  describe('resetToFit', () => {
    it('should reset zoom to 1 and pan to 0', () => {
      useViewerStore.setState({
        zoom: 3,
        panX: 100,
        panY: -50,
        containerWidth: 400,
        containerHeight: 300,
      });
      useViewerStore.getState().resetToFit();
      const state = useViewerStore.getState();
      expect(state.zoom).toBe(1);
      expect(state.panX).toBe(0);
      expect(state.panY).toBe(0);
    });
  });

  describe('pan clamping with zero dimensions', () => {
    it('should not clamp when container dimensions are zero', () => {
      useViewerStore.setState({
        zoom: 2,
        panX: 0,
        panY: 0,
        containerWidth: 0,
        containerHeight: 0,
      });
      useViewerStore.getState().pan(1000, 1000);
      // Should not be clamped since dimensions are 0
      expect(useViewerStore.getState().panX).toBe(1000);
      expect(useViewerStore.getState().panY).toBe(1000);
    });
  });

  describe('setShowSmearingZones', () => {
    it('should set showSmearingZones to true', () => {
      useViewerStore.setState({ showSmearingZones: false });
      useViewerStore.getState().setShowSmearingZones(true);
      expect(useViewerStore.getState().showSmearingZones).toBe(true);
    });

    it('should set showSmearingZones to false', () => {
      useViewerStore.setState({ showSmearingZones: true });
      useViewerStore.getState().setShowSmearingZones(false);
      expect(useViewerStore.getState().showSmearingZones).toBe(false);
    });
  });
});
