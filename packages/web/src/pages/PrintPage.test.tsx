import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { PrintPage } from './PrintPage';
import type { SavedConfiguration } from '@/store';
import { generateSvg } from '@voie-vitesse/core';
import { generateAndDownloadPdf } from '@/utils/pdfGenerator';
import { renderWithIntl } from '@/test/intlWrapper';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the core library
vi.mock('@voie-vitesse/core', () => ({
  generateSvg: vi.fn(),
  composeAllRoutes: vi.fn().mockReturnValue([]),
  composeAllSmearingZones: vi.fn().mockReturnValue([]),
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
  useViewerStore: vi.fn((selector) => selector({ showSmearingZones: true })),
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
      renderWithIntl(<PrintPage />);

      // Wait for async effect to complete
      await act(async () => {
        await Promise.resolve();
      });

      // PrintPage renders header directly, not via a subcomponent
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('Retour')).toBeInTheDocument();
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

      renderWithIntl(<PrintPage />);

      // Initially shows loading spinner (uses DaisyUI loading class)
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();

      // Cleanup: resolve to complete the effect
      await act(async () => {
        resolveSvg!('<svg viewBox="0 0 200 400"></svg>');
      });
    });

    it('should show error state when SVG generation fails', async () => {
      // Mock console.error to suppress expected error output
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      generateSvgMock.mockRejectedValueOnce(new Error('Generation failed'));

      renderWithIntl(<PrintPage />);

      // Wait for the rejected promise to be processed
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      // PrintPage uses DaisyUI alert class for errors
      expect(document.querySelector('.alert-error')).toBeInTheDocument();
      expect(screen.getByText('Generation failed')).toBeInTheDocument();

      consoleError.mockRestore();
    });

    it('should show empty state when no configuration is active', () => {
      mockConfigStoreState = {
        configurations: [],
        activeConfigId: null,
      };

      renderWithIntl(<PrintPage />);

      // PrintPage renders text directly when no config
      expect(screen.getByText('Aucune configuration sélectionnée')).toBeInTheDocument();
    });

    it('should show empty state when configuration has no sections', async () => {
      const emptyConfig = createMockConfig({ sections: [] });
      mockConfigStoreState = {
        configurations: [emptyConfig],
        activeConfigId: emptyConfig.id,
      };

      renderWithIntl(<PrintPage />);

      // Wait for effect to run (even though it returns early)
      await act(async () => {
        await Promise.resolve();
      });

      // PrintPage renders text directly when no sections
      expect(
        screen.getByText('La configuration ne contient aucune section')
      ).toBeInTheDocument();
    });

    it('should render preview content after successful SVG generation', async () => {
      renderWithIntl(<PrintPage />);

      // Wait for SVG generation to complete
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByTestId('page-grid')).toBeInTheDocument();
      expect(screen.getByTestId('page-detail')).toBeInTheDocument();
    });

    it('should display config name in header', async () => {
      renderWithIntl(<PrintPage />);

      await act(async () => {
        await Promise.resolve();
      });

      // PrintPage renders config name directly in header
      expect(screen.getByText('Test Configuration')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate back when back button is clicked', async () => {
      renderWithIntl(<PrintPage />);

      await act(async () => {
        await Promise.resolve();
      });

      // Find and click the back button (contains "Retour" text)
      fireEvent.click(screen.getByText('Retour'));

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('export functionality', () => {
    it('should trigger PDF export when export button is clicked', async () => {
      renderWithIntl(<PrintPage />);

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

      renderWithIntl(<PrintPage />);

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
      const { rerender } = renderWithIntl(<PrintPage />);

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

      const { unmount } = renderWithIntl(<PrintPage />);

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
      renderWithIntl(<PrintPage />);

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

      renderWithIntl(<PrintPage />);

      await act(async () => {
        await Promise.resolve();
      });

      // Component renders successfully with mobile flag
      // On mobile, the title says "Impression" instead of "Impression multi-pages"
      expect(screen.getByText('Impression')).toBeInTheDocument();
    });
  });
});
