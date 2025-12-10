import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Birdview } from './Birdview';

// Track setPan calls
const mockSetPan = vi.fn();

// Mock the store
vi.mock('@/store', () => ({
  useViewerStore: vi.fn((selector) =>
    selector({
      zoom: 1,
      panX: 0,
      panY: 0,
      setPan: mockSetPan,
    })
  ),
}));

describe('Birdview', () => {
  const defaultProps = {
    svgContent: '<svg viewBox="0 0 100 100"></svg>',
    svgWidth: 100,
    svgHeight: 100,
    containerWidth: 500,
    containerHeight: 400,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the minimap container', () => {
      const { container } = render(<Birdview {...defaultProps} />);

      const minimap = container.querySelector('.absolute.bottom-4.right-4');
      expect(minimap).toBeInTheDocument();
    });

    it('should show placeholder text when no SVG content', () => {
      render(
        <Birdview
          {...defaultProps}
          svgContent={null}
        />
      );

      expect(screen.getByText("Vue d'ensemble")).toBeInTheDocument();
    });

    it('should render SVG content when provided', () => {
      const { container } = render(<Birdview {...defaultProps} />);

      // Should have an element with dangerouslySetInnerHTML containing SVG
      const svgContainer = container.querySelector('[style*="pointer-events: none"]');
      expect(svgContainer).toBeInTheDocument();
    });

    it('should render viewport indicator', () => {
      const { container } = render(<Birdview {...defaultProps} />);

      const viewport = container.querySelector('.border-primary.bg-primary\\/20');
      expect(viewport).toBeInTheDocument();
    });
  });

  describe('dimensions', () => {
    it('should render with correct max dimensions', () => {
      const { container } = render(
        <Birdview
          {...defaultProps}
          svgWidth={1000}
          svgHeight={500}
        />
      );

      const minimap = container.firstChild as HTMLElement;
      const style = window.getComputedStyle(minimap);

      // Width should be at most 120px, height at most 200px
      expect(parseInt(style.width)).toBeLessThanOrEqual(120);
      expect(parseInt(style.height)).toBeLessThanOrEqual(200);
    });

    it('should handle zero dimensions gracefully', () => {
      const { container } = render(
        <Birdview
          {...defaultProps}
          svgWidth={0}
          svgHeight={0}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should toggle cursor between grab and grabbing during drag', () => {
      const { container } = render(<Birdview {...defaultProps} />);

      const minimap = container.firstChild as HTMLElement;

      // Default state: grab cursor
      expect(minimap).toHaveClass('cursor-grab');

      // Mouse down: grabbing cursor
      fireEvent.mouseDown(minimap);
      expect(minimap).toHaveClass('cursor-grabbing');

      // Mouse up: back to grab cursor
      fireEvent.mouseUp(minimap);
      expect(minimap).toHaveClass('cursor-grab');
    });

    it('should stop dragging on mouse leave', () => {
      const { container } = render(<Birdview {...defaultProps} />);

      const minimap = container.firstChild as HTMLElement;
      fireEvent.mouseDown(minimap);
      expect(minimap).toHaveClass('cursor-grabbing');

      fireEvent.mouseLeave(minimap);
      expect(minimap).toHaveClass('cursor-grab');
    });

    it('should call setPan when clicking on minimap', () => {
      const { container } = render(<Birdview {...defaultProps} />);

      const minimap = container.firstChild as HTMLElement;

      // Simulate click on minimap (mouseDown triggers updatePanFromMinimap)
      fireEvent.mouseDown(minimap, { clientX: 50, clientY: 50 });

      expect(mockSetPan).toHaveBeenCalled();
    });
  });
});
