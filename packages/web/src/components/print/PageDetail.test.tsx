import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import { PageDetail } from './PageDetail';
import type { PrintLayoutResult, PageLayout } from '@/hooks/usePrintLayout';
import { renderWithIntl } from '@/test/intlWrapper';

// Mock the svgViewBox utilities
vi.mock('@/utils/svgViewBox', () => ({
  calculateViewBox: vi.fn().mockReturnValue('0 0 100 100'),
  applyViewBoxToSvg: vi.fn(),
  serializeSvgToDataUrl: vi.fn().mockReturnValue('data:image/svg+xml;base64,test'),
}));

describe('PageDetail', () => {
  const mockPage: PageLayout = {
    index: 0,
    row: 0,
    col: 0,
    contentX: 0,
    contentY: 0,
    contentWidth: 100,
    contentHeight: 200,
  };

  const createMockLayout = (overrides: Partial<PrintLayoutResult> = {}): PrintLayoutResult => ({
    page: {
      width: 210,
      height: 297,
      margin: 10,
      printableWidth: 190,
      printableHeight: 277,
    },
    layout: {
      totalPages: 2,
      pagesInWidth: 2,
      pagesInHeight: 1,
      scale: 0.5,
      overlap: 10,
    },
    pages: [
      { ...mockPage, index: 0 },
      { ...mockPage, index: 1 },
    ],
    ...overrides,
  });

  const mockSvgContent = '<svg viewBox="0 0 200 400"><rect /></svg>';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show empty state when no layout', () => {
    renderWithIntl(
      <PageDetail
        layout={null}
        selectedPageIndex={null}
        svgContent={mockSvgContent}
        configName="Test Config"
      />
    );

    expect(screen.getByText("Sélectionnez une page pour voir l'aperçu")).toBeInTheDocument();
  });

  it('should show empty state when no page selected', () => {
    renderWithIntl(
      <PageDetail
        layout={createMockLayout()}
        selectedPageIndex={null}
        svgContent={mockSvgContent}
        configName="Test Config"
      />
    );

    expect(screen.getByText("Sélectionnez une page pour voir l'aperçu")).toBeInTheDocument();
  });

  it('should render page title with correct number', async () => {
    renderWithIntl(
      <PageDetail
        layout={createMockLayout()}
        selectedPageIndex={0}
        svgContent={mockSvgContent}
        configName="Test Config"
      />
    );

    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });

  it('should render page dimensions', async () => {
    renderWithIntl(
      <PageDetail
        layout={createMockLayout()}
        selectedPageIndex={0}
        svgContent={mockSvgContent}
        configName="Test Config"
      />
    );

    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByText('210 × 297 mm')).toBeInTheDocument();
  });

  it('should display config name', async () => {
    renderWithIntl(
      <PageDetail
        layout={createMockLayout()}
        selectedPageIndex={0}
        svgContent={mockSvgContent}
        configName="My Custom Config"
      />
    );

    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByText('My Custom Config')).toBeInTheDocument();
  });

  it('should show loading spinner initially', async () => {
    const { container } = renderWithIntl(
      <PageDetail
        layout={createMockLayout()}
        selectedPageIndex={0}
        svgContent={mockSvgContent}
        configName="Test Config"
      />
    );

    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('should display image after loading', async () => {
    renderWithIntl(
      <PageDetail
        layout={createMockLayout()}
        selectedPageIndex={0}
        svgContent={mockSvgContent}
        configName="Test Config"
      />
    );

    await act(async () => {
      vi.runAllTimers();
    });

    const img = screen.getByAltText('Page 1');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/svg+xml;base64,test');
  });

  it('should display content coordinates on desktop', async () => {
    renderWithIntl(
      <PageDetail
        layout={createMockLayout()}
        selectedPageIndex={0}
        svgContent={mockSvgContent}
        configName="Test Config"
      />
    );

    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByText(/Contenu :/)).toBeInTheDocument();
  });

  it('should handle missing page in layout', () => {
    const layoutWithMissingPage = createMockLayout({
      pages: [{ ...mockPage, index: 99 }],
    });

    renderWithIntl(
      <PageDetail
        layout={layoutWithMissingPage}
        selectedPageIndex={0}
        svgContent={mockSvgContent}
        configName="Test Config"
      />
    );

    expect(screen.getByText("Sélectionnez une page pour voir l'aperçu")).toBeInTheDocument();
  });

  it('should not generate SVG when content is null', async () => {
    const { container } = renderWithIntl(
      <PageDetail
        layout={createMockLayout()}
        selectedPageIndex={0}
        svgContent={null}
        configName="Test Config"
      />
    );

    await act(async () => {
      vi.runAllTimers();
    });

    const img = container.querySelector('img');
    expect(img).not.toBeInTheDocument();
  });
});
