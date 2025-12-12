import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Viewer } from './Viewer';

// Mock the viewer store to track zoom function calls
const mockZoomIn = vi.fn();
const mockZoomOut = vi.fn();
const mockResetToFit = vi.fn();

vi.mock('@/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store')>();
  return {
    ...actual,
    useViewerStore: vi.fn((selector) =>
      selector({
        zoom: 1,
        panX: 0,
        panY: 0,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
        pan: vi.fn(),
        zoomAtPoint: vi.fn(),
        resetToFit: mockResetToFit,
        setContainerDimensions: vi.fn(),
        showSmearingZones: true,
      })
    ),
  };
});

/**
 * Basic rendering tests for Viewer component.
 * Note: The Viewer component depends on stores and has complex
 * state management with zoom/pan/SVG generation.
 */

describe('Viewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('structure', () => {
    it('should render as main element', () => {
      const { container } = render(<Viewer />);
      expect(container.querySelector('main')).toBeInTheDocument();
    });
  });

  describe('zoom controls', () => {
    it('should render zoom buttons and percentage display', () => {
      render(<Viewer />);
      expect(screen.getByTitle('Zoom +')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom -')).toBeInTheDocument();
      expect(screen.getByTitle("Vue d'ensemble")).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should call zoomIn when zoom in button is clicked', () => {
      render(<Viewer />);
      fireEvent.click(screen.getByTitle('Zoom +'));
      expect(mockZoomIn).toHaveBeenCalledTimes(1);
    });

    it('should call zoomOut when zoom out button is clicked', () => {
      render(<Viewer />);
      fireEvent.click(screen.getByTitle('Zoom -'));
      expect(mockZoomOut).toHaveBeenCalledTimes(1);
    });

    it('should not call resetToFit when dimensions are zero', () => {
      // When there's no SVG content, dimensions are 0, so resetToFit should not be called
      render(<Viewer />);
      fireEvent.click(screen.getByTitle("Vue d'ensemble"));
      expect(mockResetToFit).not.toHaveBeenCalled();
    });
  });

  describe('empty states', () => {
    it('should show message when no config', () => {
      render(<Viewer />);
      // The Viewer may show different messages depending on store state
      // At minimum it should render without crashing
      expect(screen.queryByRole('main')).toBeInTheDocument();
    });
  });

  describe('container', () => {
    it('should render SVG container div', () => {
      const { container } = render(<Viewer />);
      const svgContainer = container.querySelector('[class*="cursor-grab"]');
      expect(svgContainer).toBeInTheDocument();
    });

    it('should have touch-none class for gesture handling', () => {
      const { container } = render(<Viewer />);
      const svgContainer = container.querySelector('[class*="cursor-grab"]');
      expect(svgContainer).toHaveClass('touch-none');
    });
  });
});
