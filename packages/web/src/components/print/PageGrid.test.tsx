import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PageGrid } from './PageGrid';
import type { PrintLayoutResult, PageLayout, Lane } from '@/hooks/usePrintLayout';

// Mock the svgViewBox utilities
vi.mock('@/utils/svgViewBox', () => ({
  calculateViewBox: vi.fn().mockReturnValue('0 0 100 100'),
  applyViewBoxToSvg: vi.fn(),
  serializeSvgToDataUrl: vi.fn().mockReturnValue('data:image/svg+xml;base64,test'),
  calculatePagesInWidth: vi.fn().mockReturnValue(2),
}));

describe('PageGrid', () => {
  const mockPage: PageLayout = {
    index: 0,
    row: 0,
    col: 0,
    contentX: 0,
    contentY: 0,
    contentWidth: 100,
    contentHeight: 200,
  };

  const mockLane: Lane = {
    number: 1,
    x: 0,
    width: 100,
  };

  const createMockLayout = (overrides: Partial<PrintLayoutResult> = {}): PrintLayoutResult => ({
    page: {
      width: 210,
      height: 297,
      printableWidth: 190,
      printableHeight: 277,
      margin: 10,
    },
    layout: {
      totalPages: 2,
      pagesInWidth: 2,
      pagesInHeight: 1,
      scale: 0.5,
      overlap: 10,
    },
    pages: [
      { ...mockPage, index: 0, col: 0 },
      { ...mockPage, index: 1, col: 1 },
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

  it('should show empty message when no layout', () => {
    render(
      <PageGrid
        layout={null}
        selectedPageIndex={null}
        onSelectPage={vi.fn()}
        svgContent={mockSvgContent}
      />
    );

    expect(screen.getByText('Aucune page à afficher')).toBeInTheDocument();
  });

  it('should show empty message when no SVG content', () => {
    render(
      <PageGrid
        layout={createMockLayout()}
        selectedPageIndex={null}
        onSelectPage={vi.fn()}
        svgContent={null}
      />
    );

    expect(screen.getByText('Aucune page à afficher')).toBeInTheDocument();
  });

  it('should render page thumbnails for full-wall mode', async () => {
    render(
      <PageGrid
        layout={createMockLayout()}
        selectedPageIndex={0}
        onSelectPage={vi.fn()}
        svgContent={mockSvgContent}
      />
    );

    // Advance timers to allow async thumbnail generation
    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByText('Aperçu des pages')).toBeInTheDocument();
  });

  it('should call onSelectPage when thumbnail clicked', async () => {
    const onSelectPage = vi.fn();
    render(
      <PageGrid
        layout={createMockLayout()}
        selectedPageIndex={0}
        onSelectPage={onSelectPage}
        svgContent={mockSvgContent}
      />
    );

    await act(async () => {
      vi.runAllTimers();
    });

    const thumbnail = screen.getByTitle('Page 2');
    fireEvent.click(thumbnail);

    expect(onSelectPage).toHaveBeenCalledWith(1);
  });

  it('should highlight selected page', async () => {
    render(
      <PageGrid
        layout={createMockLayout()}
        selectedPageIndex={0}
        onSelectPage={vi.fn()}
        svgContent={mockSvgContent}
      />
    );

    await act(async () => {
      vi.runAllTimers();
    });

    const selectedThumbnail = screen.getByTitle('Page 1');
    expect(selectedThumbnail.className).toContain('border-primary');
  });

  it('should render lane groups for lane-by-lane mode', async () => {
    const layoutWithLanes = createMockLayout({
      lanes: [
        {
          lane: mockLane,
          pages: [
            { ...mockPage, index: 0 },
            { ...mockPage, index: 1 },
          ],
        },
        {
          lane: { ...mockLane, number: 2 },
          pages: [
            { ...mockPage, index: 2 },
          ],
        },
      ],
    });

    render(
      <PageGrid
        layout={layoutWithLanes}
        selectedPageIndex={0}
        onSelectPage={vi.fn()}
        svgContent={mockSvgContent}
      />
    );

    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByText('Couloir 1')).toBeInTheDocument();
    expect(screen.getByText('Couloir 2')).toBeInTheDocument();
  });

  it('should display page numbers on thumbnails', async () => {
    render(
      <PageGrid
        layout={createMockLayout()}
        selectedPageIndex={0}
        onSelectPage={vi.fn()}
        svgContent={mockSvgContent}
      />
    );

    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
