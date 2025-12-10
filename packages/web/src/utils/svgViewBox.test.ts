import { describe, it, expect } from 'vitest';
import {
  calculateViewBox,
  calculatePagesInWidth,
  getPagesInWidthForPage,
  type ViewBoxParams,
} from './svgViewBox';
import type { PageLayout } from '@/hooks/usePrintLayout';

describe('calculateViewBox', () => {
  it('should calculate basic viewBox', () => {
    const params: ViewBoxParams = {
      contentX: 0,
      contentY: 0,
      contentWidth: 200,
      printableWidth: 210,
      printableHeight: 297,
      scale: 1,
      pagesInWidth: 2,
    };

    const viewBox = calculateViewBox(params);

    expect(viewBox.x).toBe(0);
    expect(viewBox.y).toBe(0);
    expect(viewBox.width).toBe(210);
    expect(viewBox.height).toBe(297);
  });

  it('should apply scale to dimensions', () => {
    const params: ViewBoxParams = {
      contentX: 0,
      contentY: 0,
      contentWidth: 200,
      printableWidth: 210,
      printableHeight: 297,
      scale: 0.5,
      pagesInWidth: 2,
    };

    const viewBox = calculateViewBox(params);

    expect(viewBox.width).toBe(420); // 210 / 0.5
    expect(viewBox.height).toBe(594); // 297 / 0.5
  });

  it('should center content when single page and content smaller than page', () => {
    const params: ViewBoxParams = {
      contentX: 0,
      contentY: 0,
      contentWidth: 100,
      printableWidth: 200,
      printableHeight: 300,
      scale: 1,
      pagesInWidth: 1,
    };

    const viewBox = calculateViewBox(params);

    // Expected width = 200 / 1 = 200
    // Content width = 100
    // Center offset = (200 - 100) / 2 = 50
    // X = 0 - 50 = -50
    expect(viewBox.x).toBe(-50);
  });

  it('should not center when multiple pages in width', () => {
    const params: ViewBoxParams = {
      contentX: 0,
      contentY: 0,
      contentWidth: 100,
      printableWidth: 200,
      printableHeight: 300,
      scale: 1,
      pagesInWidth: 2,
    };

    const viewBox = calculateViewBox(params);
    expect(viewBox.x).toBe(0);
  });

  it('should not center when content fills page', () => {
    const params: ViewBoxParams = {
      contentX: 0,
      contentY: 0,
      contentWidth: 200,
      printableWidth: 200,
      printableHeight: 300,
      scale: 1,
      pagesInWidth: 1,
    };

    const viewBox = calculateViewBox(params);
    expect(viewBox.x).toBe(0);
  });

  it('should preserve contentY as y', () => {
    const params: ViewBoxParams = {
      contentX: 0,
      contentY: 100,
      contentWidth: 200,
      printableWidth: 200,
      printableHeight: 300,
      scale: 1,
      pagesInWidth: 1,
    };

    const viewBox = calculateViewBox(params);
    expect(viewBox.y).toBe(100);
  });
});

describe('calculatePagesInWidth', () => {
  it('should return 1 for empty array', () => {
    expect(calculatePagesInWidth([])).toBe(1);
  });

  it('should return 1 for single page in column 0', () => {
    const pages: PageLayout[] = [
      { index: 0, row: 0, col: 0, contentX: 0, contentY: 0, contentWidth: 100, contentHeight: 100 },
    ];
    expect(calculatePagesInWidth(pages)).toBe(1);
  });

  it('should return 2 for pages in columns 0 and 1', () => {
    const pages: PageLayout[] = [
      { index: 0, row: 0, col: 0, contentX: 0, contentY: 0, contentWidth: 100, contentHeight: 100 },
      { index: 1, row: 0, col: 1, contentX: 100, contentY: 0, contentWidth: 100, contentHeight: 100 },
    ];
    expect(calculatePagesInWidth(pages)).toBe(2);
  });

  it('should handle max column correctly', () => {
    const pages: PageLayout[] = [
      { index: 0, row: 0, col: 0, contentX: 0, contentY: 0, contentWidth: 100, contentHeight: 100 },
      { index: 1, row: 0, col: 2, contentX: 200, contentY: 0, contentWidth: 100, contentHeight: 100 },
    ];
    expect(calculatePagesInWidth(pages)).toBe(3);
  });
});

describe('getPagesInWidthForPage', () => {
  it('should return default when lanes is undefined', () => {
    expect(getPagesInWidthForPage(0, undefined, 2)).toBe(2);
  });

  it('should return default when lanes is empty', () => {
    expect(getPagesInWidthForPage(0, [], 2)).toBe(2);
  });

  it('should find page in lane and return lane pagesInWidth', () => {
    const lanes = [
      {
        pages: [
          { index: 0, row: 0, col: 0, contentX: 0, contentY: 0, contentWidth: 100, contentHeight: 100 },
        ],
      },
      {
        pages: [
          { index: 1, row: 0, col: 0, contentX: 0, contentY: 0, contentWidth: 100, contentHeight: 100 },
          { index: 2, row: 0, col: 1, contentX: 100, contentY: 0, contentWidth: 100, contentHeight: 100 },
        ],
      },
    ];

    // Page 0 is in first lane with 1 page in width
    expect(getPagesInWidthForPage(0, lanes, 5)).toBe(1);

    // Page 1 is in second lane with 2 pages in width
    expect(getPagesInWidthForPage(1, lanes, 5)).toBe(2);

    // Page 2 is also in second lane
    expect(getPagesInWidthForPage(2, lanes, 5)).toBe(2);
  });

  it('should return default when page not found in any lane', () => {
    const lanes = [
      {
        pages: [
          { index: 0, row: 0, col: 0, contentX: 0, contentY: 0, contentWidth: 100, contentHeight: 100 },
        ],
      },
    ];

    expect(getPagesInWidthForPage(99, lanes, 3)).toBe(3);
  });
});
