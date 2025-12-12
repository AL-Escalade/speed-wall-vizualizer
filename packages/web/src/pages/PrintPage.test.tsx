import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PrintPage } from './PrintPage';
import type { SavedConfiguration } from '@/store';
import { generateSvg } from '@voie-vitesse/core';
import { generateAndDownloadPdf } from '@/utils/pdfGenerator';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the core library
vi.mock('@voie-vitesse/core', () => ({
  generateSvg: vi.fn(),
  composeAllRoutes: vi.fn().mockReturnValue([]),
}));

// Mock useIsMobile hook
vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn().mockReturnValue(false),
}));

// Mock pdfGenerator
vi.mock('@/utils/pdfGenerator', () => ({
  generateAndDownloadPdf: vi.fn().mockResolvedValue(undefined),
}));

// Mock sectionMapper
vi.mock('@/utils/sectionMapper', () => ({
  sectionToSegment: vi.fn().mockReturnValue({}),
  normalizeSvgForWeb: vi.fn((svg: string) => svg),
}));

// Mock child components to simplify testing
vi.mock('@/components/print', () => ({
  PrintConfig: vi.fn(({ onExport, isExporting, totalPages }) => (
    <div data-testid="print-config">
      <button onClick={onExport} disabled={isExporting || totalPages === 0}>
        {isExporting ? 'Exporting...' : 'Export PDF'}
      </button>
      <span data-testid="total-pages">{totalPages}</span>
    </div>
  )),
  PageGrid: vi.fn(() => <div data-testid="page-grid">Page Grid</div>),
  PageDetail: vi.fn(() => <div data-testid="page-detail">Page Detail</div>),
}));

// Note: PrintPage uses inline header and state components, not imported ones
// The data-testid attributes are set directly in PrintPage.tsx

// Store mock setup
const createMockConfig = (overrides: Partial<SavedConfiguration> = {}): SavedConfiguration => ({
  id: 'test-config-id',
  name: 'Test Configuration',
  wall: { lanes: 2, panelsHeight: 10 },
  sections: [
    {
      id: 'section-1',
      name: 'Section 1',
      source: 'ifsc',
      lane: 0,
      fromHold: 'P1',
      toHold: 'PAD',
      color: '#ff0000',
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

let mockConfigStoreState: {
  configurations: SavedConfiguration[];
  activeConfigId: string | null;
};

let mockRoutesStoreState: {
  routes: Record<string, unknown>;
};

vi.mock('@/store', () => ({
  useConfigStore: vi.fn((selector) => selector(mockConfigStoreState)),
  useRoutesStore: vi.fn((selector) => selector(mockRoutesStoreState)),
  DEFAULT_DISPLAY_OPTIONS: {
    gridColor: '#999999',
    labelFontSize: 40,
    holdLabelFontSize: 40,
  },
}));

// Typed mock references
const generateSvgMock = vi.mocked(generateSvg);
const generatePdfMock = vi.mocked(generateAndDownloadPdf);

describe('PrintPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store states
    const config = createMockConfig();
    mockConfigStoreState = {
      configurations: [config],
      activeConfigId: config.id,
    };
    mockRoutesStoreState = {
      routes: {},
    };

    // Default mock implementation - resolves immediately
    generateSvgMock.mockResolvedValue('<svg viewBox="0 0 200 400"></svg>');
    generatePdfMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering states', () => {
    it('should render header with back button', async () => {
      render(<PrintPage />);

      // Wait for async effect to complete
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('print-header')).toBeInTheDocument();
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    it('should show loading state while generating SVG', async () => {
      // Setup: SVG generation takes time
      let resolveSvg: (value: string) => void;
      generateSvgMock.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSvg = resolve;
          })
      );

      render(<PrintPage />);

      // Initially shows loading
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Cleanup: resolve to complete the effect
      await act(async () => {
        resolveSvg!('<svg viewBox="0 0 200 400"></svg>');
      });
    });

    it('should show error state when SVG generation fails', async () => {
      // Mock console.error to suppress expected error output
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      generateSvgMock.mockRejectedValueOnce(new Error('Generation failed'));

      render(<PrintPage />);

      // Wait for the rejected promise to be processed
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByText('Generation failed')).toBeInTheDocument();

      consoleError.mockRestore();
    });

    it('should show empty state when no configuration is active', () => {
      mockConfigStoreState = {
        configurations: [],
        activeConfigId: null,
      };

      render(<PrintPage />);

      expect(screen.getByTestId('empty')).toBeInTheDocument();
      expect(screen.getByText('Aucune configuration sélectionnée')).toBeInTheDocument();
    });

    it('should show empty state when configuration has no sections', async () => {
      const emptyConfig = createMockConfig({ sections: [] });
      mockConfigStoreState = {
        configurations: [emptyConfig],
        activeConfigId: emptyConfig.id,
      };

      render(<PrintPage />);

      // Wait for effect to run (even though it returns early)
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('empty')).toBeInTheDocument();
      expect(
        screen.getByText('La configuration ne contient aucune section')
      ).toBeInTheDocument();
    });

    it('should render preview content after successful SVG generation', async () => {
      render(<PrintPage />);

      // Wait for SVG generation to complete
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('page-grid')).toBeInTheDocument();
      expect(screen.getByTestId('page-detail')).toBeInTheDocument();
    });

    it('should display config name in header', async () => {
      render(<PrintPage />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('config-name')).toHaveTextContent('Test Configuration');
    });
  });

  describe('navigation', () => {
    it('should navigate back when back button is clicked', async () => {
      render(<PrintPage />);

      await act(async () => {
        await Promise.resolve();
      });

      fireEvent.click(screen.getByTestId('back-button'));

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('export functionality', () => {
    it('should trigger PDF export when export button is clicked', async () => {
      render(<PrintPage />);

      // Wait for SVG generation
      await act(async () => {
        await Promise.resolve();
      });

      // Find and click export button
      const exportButton = screen.getByText('Export PDF');

      await act(async () => {
        fireEvent.click(exportButton);
        await Promise.resolve();
      });

      expect(generatePdfMock).toHaveBeenCalled();
    });

    it('should show export error alert on failure', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      generatePdfMock.mockRejectedValueOnce(new Error('Export failed'));

      render(<PrintPage />);

      // Wait for SVG generation
      await act(async () => {
        await Promise.resolve();
      });

      // Click export button
      await act(async () => {
        fireEvent.click(screen.getByText('Export PDF'));
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(alertMock).toHaveBeenCalledWith('Export failed');

      alertMock.mockRestore();
      consoleError.mockRestore();
    });
  });

  describe('SVG generation effect', () => {
    it('should regenerate SVG when config changes', async () => {
      const { rerender } = render(<PrintPage />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(generateSvgMock).toHaveBeenCalledTimes(1);

      // Change config
      const newConfig = createMockConfig({
        id: 'new-config',
        name: 'New Config',
      });
      mockConfigStoreState = {
        configurations: [newConfig],
        activeConfigId: newConfig.id,
      };

      rerender(<PrintPage />);

      await act(async () => {
        await Promise.resolve();
      });

      // Should have been called again after config change
      expect(generateSvgMock).toHaveBeenCalledTimes(2);
    });

    it('should cleanup and cancel pending generation on unmount', async () => {
      let resolveSvg: (value: string) => void;
      generateSvgMock.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSvg = resolve;
          })
      );

      const { unmount } = render(<PrintPage />);

      // Unmount while generation is pending
      unmount();

      // Resolve after unmount - should not cause errors due to isCancelled flag
      await act(async () => {
        resolveSvg!('<svg viewBox="0 0 200 400"></svg>');
      });

      // Test passes if no errors occur
    });
  });

  describe('print config component integration', () => {
    it('should render PrintConfig component', async () => {
      render(<PrintPage />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('print-config')).toBeInTheDocument();
      expect(screen.getByTestId('total-pages')).toBeInTheDocument();
    });
  });

  describe('mobile support', () => {
    it('should use mobile hooks value', async () => {
      const { useIsMobile } = await import('@/hooks/useMediaQuery');
      vi.mocked(useIsMobile).mockReturnValue(true);

      render(<PrintPage />);

      await act(async () => {
        await Promise.resolve();
      });

      // Component renders successfully with mobile flag
      expect(screen.getByTestId('print-header')).toBeInTheDocument();
    });
  });
});
