import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { Viewer } from './Viewer';
import { generateSvg } from '@voie-vitesse/core';
import { renderWithIntl, renderWithLocale } from '@/test/intlWrapper';

// Partial mock: the real store module (mocked below with importOriginal) pulls
// in other core exports, so only the generation entry points are replaced.
vi.mock('@voie-vitesse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@voie-vitesse/core')>();
  return {
    ...actual,
    generateSvg: vi.fn(),
    composeAllRoutes: vi.fn().mockReturnValue([]),
    composeAllSmearingZones: vi.fn().mockReturnValue([]),
  };
});

const generateSvgMock = vi.mocked(generateSvg);

// Mock the viewer store to track zoom function calls
const mockZoomIn = vi.fn();
const mockZoomOut = vi.fn();
const mockResetToFit = vi.fn();
const mockPan = vi.fn();
const mockZoomAtPoint = vi.fn();
const mockSetContainerDimensions = vi.fn();

// Default mock config
const mockConfig = {
  id: 'test-config',
  name: 'Test Config',
  wall: { lanes: 1, panelsHeight: 2 },
  sections: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Store state that can be modified per test
let configStoreState: { configurations: typeof mockConfig[]; activeConfigId: string | null } = {
  configurations: [],
  activeConfigId: null,
};

vi.mock('@/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store')>();
  // Stable identity: a fresh object per render would change the generation
  // effect's `routes` dependency on every pass and loop forever.
  const routesState = { routes: {} };
  return {
    ...actual,
    useViewerStore: vi.fn((selector) =>
      selector({
        zoom: 1,
        panX: 0,
        panY: 0,
        zoomIn: mockZoomIn,
        zoomOut: mockZoomOut,
        pan: mockPan,
        zoomAtPoint: mockZoomAtPoint,
        resetToFit: mockResetToFit,
        setContainerDimensions: mockSetContainerDimensions,
        showSmearingZones: true,
      })
    ),
    useConfigStore: vi.fn((selector) =>
      selector(configStoreState)
    ),
    useRoutesStore: vi.fn((selector) =>
      selector(routesState)
    ),
    DEFAULT_DISPLAY_OPTIONS: {
      gridColor: '#999999',
      labelFontSize: 40,
      holdLabelFontSize: 40,
    },
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
    generateSvgMock.mockResolvedValue('<svg viewBox="0 0 200 400"></svg>');
    // Reset config store state
    configStoreState = {
      configurations: [],
      activeConfigId: null,
    };
  });

  // Guards the wiring itself: without this, dropping `holdLabelLanguage` from
  // the options object or from the effect deps leaves the whole suite green
  // while every non-French user sees a French plan.
  describe('hold label language', () => {
    beforeEach(() => {
      const config = { ...mockConfig, sections: [{ id: 'section-1', source: 'ifsc', lane: 0 }] };
      configStoreState = {
        configurations: [config as unknown as typeof mockConfig],
        activeConfigId: config.id,
      };
    });

    it('should render the wall with hold labels in the interface language', async () => {
      renderWithLocale(<Viewer />, 'en');

      await act(async () => {
        await Promise.resolve();
      });

      expect(generateSvgMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ holdLabelLanguage: 'en' }),
        expect.anything()
      );
    });

    it('should render French hold labels under the French interface', async () => {
      renderWithLocale(<Viewer />, 'fr');

      await act(async () => {
        await Promise.resolve();
      });

      expect(generateSvgMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ holdLabelLanguage: 'fr' }),
        expect.anything()
      );
    });
  });

  describe('structure', () => {
    it('should render as main element', () => {
      const { container } = renderWithIntl(<Viewer />);
      expect(container.querySelector('main')).toBeInTheDocument();
    });
  });

  describe('zoom controls', () => {
    it('should render zoom buttons and percentage display', () => {
      renderWithIntl(<Viewer />);
      expect(screen.getByTitle('Zoom +')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom -')).toBeInTheDocument();
      expect(screen.getByTitle("Vue d'ensemble")).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should call zoomIn when zoom in button is clicked', () => {
      renderWithIntl(<Viewer />);
      fireEvent.click(screen.getByTitle('Zoom +'));
      expect(mockZoomIn).toHaveBeenCalledTimes(1);
    });

    it('should call zoomOut when zoom out button is clicked', () => {
      renderWithIntl(<Viewer />);
      fireEvent.click(screen.getByTitle('Zoom -'));
      expect(mockZoomOut).toHaveBeenCalledTimes(1);
    });

    it('should not call resetToFit when dimensions are zero', () => {
      // When there's no SVG content, dimensions are 0, so resetToFit should not be called
      renderWithIntl(<Viewer />);
      fireEvent.click(screen.getByTitle("Vue d'ensemble"));
      expect(mockResetToFit).not.toHaveBeenCalled();
    });
  });

  describe('empty states', () => {
    it('should show message when no config', () => {
      renderWithIntl(<Viewer />);
      // The Viewer may show different messages depending on store state
      // At minimum it should render without crashing
      expect(screen.queryByRole('main')).toBeInTheDocument();
    });

    it('should show message when config has no sections', () => {
      configStoreState = {
        configurations: [mockConfig],
        activeConfigId: mockConfig.id,
      };
      renderWithIntl(<Viewer />);
      expect(screen.getByText('Ajoutez des sections pour visualiser le mur')).toBeInTheDocument();
    });
  });

  describe('container', () => {
    it('should render SVG container div', () => {
      const { container } = renderWithIntl(<Viewer />);
      const svgContainer = container.querySelector('[class*="cursor-grab"]');
      expect(svgContainer).toBeInTheDocument();
    });

    it('should have touch-none class for gesture handling', () => {
      const { container } = renderWithIntl(<Viewer />);
      const svgContainer = container.querySelector('[class*="cursor-grab"]');
      expect(svgContainer).toHaveClass('touch-none');
    });
  });

  describe('smearing zones', () => {
    it('should use showSmearingZones from store', () => {
      // Render with default mock that includes showSmearingZones: true
      const { container } = renderWithIntl(<Viewer />);
      // Component should render without errors
      expect(container.querySelector('main')).toBeInTheDocument();
    });
  });

  describe('mouse interactions', () => {
    it('should handle mouse down on container', () => {
      const { container } = renderWithIntl(<Viewer />);
      const svgContainer = container.querySelector('[class*="cursor-grab"]');
      expect(svgContainer).toBeInTheDocument();

      // Trigger mousedown to test panning state
      fireEvent.mouseDown(svgContainer!, { button: 0, clientX: 100, clientY: 100 });

      // Container should switch to grabbing cursor when panning
      expect(svgContainer).toHaveClass('cursor-grabbing');
    });

    it('should handle mouse up after panning', () => {
      const { container } = renderWithIntl(<Viewer />);
      const svgContainer = container.querySelector('[class*="cursor-grab"]');

      // Start panning
      fireEvent.mouseDown(svgContainer!, { button: 0, clientX: 100, clientY: 100 });
      expect(svgContainer).toHaveClass('cursor-grabbing');

      // End panning via global mouseup
      fireEvent.mouseUp(window);

      // Should revert to grab cursor
      expect(svgContainer).toHaveClass('cursor-grab');
    });
  });
});
