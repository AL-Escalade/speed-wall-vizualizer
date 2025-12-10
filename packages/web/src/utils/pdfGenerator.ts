/**
 * PDF Generator for multi-page wall export
 * Uses jsPDF for PDF creation and canvas for SVG rasterization
 */

import jsPDF from 'jspdf';
import type { PrintLayoutResult, PageLayout, Lane } from '@/hooks/usePrintLayout';
import { calculateViewBox, getPagesInWidthForPage } from './svgViewBox';

/** Options for PDF generation */
export interface PdfGenerationOptions {
  /** Configuration name to display on pages */
  configName: string;
  /** SVG content to render */
  svgContent: string;
  /** Layout calculation results */
  layout: PrintLayoutResult;
  /** Lanes for lane-by-lane mode */
  lanes?: { lane: Lane; pages: PageLayout[] }[];
}

/** Progress callback */
export type ProgressCallback = (current: number, total: number) => void;

/**
 * Rasterize SVG to canvas at specific viewport
 */
async function rasterizeSvgToCanvas(
  svgContent: string,
  viewBox: { x: number; y: number; width: number; height: number },
  outputWidth: number,
  outputHeight: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Set canvas size with higher resolution for better quality
    const scale = 2; // 2x resolution for print quality
    canvas.width = outputWidth * scale;
    canvas.height = outputHeight * scale;
    ctx.scale(scale, scale);

    // Create a modified SVG with the desired viewBox
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    // Set the new viewBox to show only the portion we want
    svgElement.setAttribute(
      'viewBox',
      `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
    );
    svgElement.setAttribute('width', String(outputWidth));
    svgElement.setAttribute('height', String(outputHeight));
    // none stretches to fill - viewBox aspect ratio matches output aspect ratio
    svgElement.setAttribute('preserveAspectRatio', 'none');

    // Serialize back to string
    const serializer = new XMLSerializer();
    const modifiedSvg = serializer.serializeToString(svgElement);

    // Create image from SVG
    const img = new Image();
    const blob = new Blob([modifiedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      // Draw the image
      ctx.drawImage(img, 0, 0, outputWidth, outputHeight);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };

    img.src = url;
  });
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Add page metadata (config name and date) to PDF page
 */
function addPageMetadata(
  pdf: jsPDF,
  configName: string,
  date: Date,
  pageWidth: number,
  margin: number
): void {
  const dateStr = formatDate(date);

  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);

  // Config name at top left (inside margin)
  pdf.text(configName, margin, margin - 2);

  // Date at top right (inside margin)
  const dateWidth = pdf.getTextWidth(dateStr);
  pdf.text(dateStr, pageWidth - margin - dateWidth, margin - 2);
}

/**
 * Generate a multi-page PDF from SVG content
 */
export async function generatePdf(
  options: PdfGenerationOptions,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const { configName, svgContent, layout } = options;
  const { page, pages, lanes } = layout;
  const exportDate = new Date();

  // Determine orientation
  const orientation = page.width > page.height ? 'landscape' : 'portrait';

  // Create PDF
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Calculate pixel dimensions for canvas (at 150 DPI for good quality)
  const dpi = 150;
  const printableWidthPx = (page.printableWidth / 25.4) * dpi;
  const printableHeightPx = (page.printableHeight / 25.4) * dpi;

  // Determine pages to render
  const pagesToRender = lanes && lanes.length > 0
    ? lanes.flatMap(l => l.pages)
    : pages;

  const totalPages = pagesToRender.length;

  for (let i = 0; i < pagesToRender.length; i++) {
    const pageLayout = pagesToRender[i];

    // Report progress
    if (onProgress) {
      onProgress(i + 1, totalPages);
    }

    // Add new page (except for first)
    if (i > 0) {
      pdf.addPage();
    }

    // Calculate viewBox with centering support
    const pagesInWidth = getPagesInWidthForPage(
      pageLayout.index,
      lanes,
      layout.layout.pagesInWidth
    );
    const viewBox = calculateViewBox({
      contentX: pageLayout.contentX,
      contentY: pageLayout.contentY,
      contentWidth: pageLayout.contentWidth,
      printableWidth: page.printableWidth,
      printableHeight: page.printableHeight,
      scale: layout.layout.scale,
      pagesInWidth,
    });

    // Rasterize the SVG portion
    const canvas = await rasterizeSvgToCanvas(
      svgContent,
      viewBox,
      printableWidthPx,
      printableHeightPx
    );

    // Add metadata
    addPageMetadata(pdf, configName, exportDate, page.width, page.margin);

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(
      imgData,
      'PNG',
      page.margin,
      page.margin,
      page.printableWidth,
      page.printableHeight
    );
  }

  // Return as blob
  return pdf.output('blob');
}

/**
 * Generate PDF and trigger download
 */
export async function generateAndDownloadPdf(
  options: PdfGenerationOptions,
  filename: string = 'voie-vitesse.pdf',
  onProgress?: ProgressCallback
): Promise<void> {
  const blob = await generatePdf(options, onProgress);

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default generateAndDownloadPdf;
