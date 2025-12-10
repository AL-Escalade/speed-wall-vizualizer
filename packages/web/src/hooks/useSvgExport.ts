/**
 * Hook for exporting SVG visualization
 */

import { useCallback } from 'react';
import { useConfigStore } from '@/store';

/** Data attribute used to identify the exportable SVG container */
const SVG_EXPORT_SELECTOR = '[data-export-target="wall-svg"]';

interface UseSvgExportResult {
  exportSvg: () => boolean;
  exportPng: () => Promise<boolean>;
}

/** DPI for PNG export - same as PDF generator */
const EXPORT_DPI = 150;
/** Scale factor for quality - same as PDF generator */
const EXPORT_SCALE = 2;

/**
 * Rasterize SVG to canvas for PNG export
 * Uses same dimensions as PDF export (150 DPI with 2x scale)
 */
async function rasterizeSvgToCanvas(
  svgElement: SVGSVGElement
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgElement);

    // Parse viewBox to get dimensions (in mm from the SVG)
    const viewBox = svgElement.getAttribute('viewBox');
    let svgWidth: number;
    let svgHeight: number;

    if (viewBox) {
      const parts = viewBox.split(/\s+/);
      svgWidth = parseFloat(parts[2]);
      svgHeight = parseFloat(parts[3]);
    } else {
      svgWidth = svgElement.width.baseVal.value || 800;
      svgHeight = svgElement.height.baseVal.value || 600;
    }

    // Validate dimensions
    if (!svgWidth || !svgHeight || svgWidth <= 0 || svgHeight <= 0) {
      reject(new Error(`Invalid SVG dimensions: ${svgWidth}x${svgHeight}`));
      return;
    }

    // Convert to pixels at export DPI (same formula as PDF generator)
    // SVG uses mm units, convert to inches then to pixels
    let widthPx = Math.round((svgWidth / 25.4) * EXPORT_DPI * EXPORT_SCALE);
    let heightPx = Math.round((svgHeight / 25.4) * EXPORT_DPI * EXPORT_SCALE);

    // Validate canvas dimensions (browsers have limits, typically around 16384px)
    // Also limit total pixels to avoid memory issues (around 268 million pixels max)
    const MAX_CANVAS_SIZE = 16384;
    const MAX_TOTAL_PIXELS = 268435456; // 16384 * 16384

    if (widthPx > MAX_CANVAS_SIZE || heightPx > MAX_CANVAS_SIZE || widthPx * heightPx > MAX_TOTAL_PIXELS) {
      const scaleByWidth = MAX_CANVAS_SIZE / widthPx;
      const scaleByHeight = MAX_CANVAS_SIZE / heightPx;
      const scaleByTotal = Math.sqrt(MAX_TOTAL_PIXELS / (widthPx * heightPx));
      const scale = Math.min(scaleByWidth, scaleByHeight, scaleByTotal);

      widthPx = Math.round(widthPx * scale);
      heightPx = Math.round(heightPx * scale);
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    canvas.width = widthPx;
    canvas.height = heightPx;

    // Create image from SVG
    // Ensure SVG has proper dimensions for rendering
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgStr, 'image/svg+xml');
    const svgRoot = svgDoc.documentElement;

    // Set explicit width/height attributes if missing (required for image rendering)
    if (!svgRoot.getAttribute('width')) {
      svgRoot.setAttribute('width', `${svgWidth}`);
    }
    if (!svgRoot.getAttribute('height')) {
      svgRoot.setAttribute('height', `${svgHeight}`);
    }

    const fixedSvgStr = new XMLSerializer().serializeToString(svgRoot);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Use base64 encoding instead of blob URL for better mobile compatibility
    const base64Svg = btoa(unescape(encodeURIComponent(fixedSvgStr)));
    const svgDataUrl = `data:image/svg+xml;base64,${base64Svg}`;

    // Add timeout to detect if image never loads
    const timeout = setTimeout(() => {
      console.error('PNG export error: SVG image load timeout');
      reject(new Error('SVG image load timeout'));
    }, 10000);

    img.onload = () => {
      clearTimeout(timeout);

      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, widthPx, heightPx);

      // Draw the SVG scaled to canvas size
      ctx.drawImage(img, 0, 0, widthPx, heightPx);
      resolve(canvas);
    };

    img.onerror = (event) => {
      clearTimeout(timeout);
      console.error('SVG image load error:', event);
      reject(new Error('Failed to load SVG image'));
    };

    img.src = svgDataUrl;
  });
}

export function useSvgExport(): UseSvgExportResult {
  const getCurrentConfig = useConfigStore((s) => s.getCurrentConfig);

  const exportSvg = useCallback(() => {
    const container = document.querySelector(SVG_EXPORT_SELECTOR);
    const svgElement = container?.querySelector('svg');
    if (!svgElement) {
      console.error('SVG export error: SVG element not found', { container, selector: SVG_EXPORT_SELECTOR });
      alert('Aucun SVG à exporter');
      return false;
    }

    const config = getCurrentConfig();
    const fileName = config ? `${config.name.replace(/\s+/g, '_')}.svg` : 'wall.svg';

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgElement);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }, [getCurrentConfig]);

  const exportPng = useCallback(async () => {
    const container = document.querySelector(SVG_EXPORT_SELECTOR);
    const svgElement = container?.querySelector('svg') as SVGSVGElement | null;
    if (!svgElement) {
      console.error('PNG export error: SVG element not found', { container, selector: SVG_EXPORT_SELECTOR });
      alert('Aucun SVG à exporter');
      return false;
    }

    try {
      const config = getCurrentConfig();
      const fileName = config ? `${config.name.replace(/\s+/g, '_')}.png` : 'wall.png';

      // Rasterize at same DPI/scale as PDF export
      const canvas = await rasterizeSvgToCanvas(svgElement);

      // Convert to blob and download
      // Use different strategies for mobile vs desktop
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      const downloadFile = (dataUrl: string) => {
        if (isMobile) {
          // On mobile, open in new tab - user can long-press to save
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head><title>${fileName}</title></head>
                <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#222;">
                  <img src="${dataUrl}" style="max-width:100%;max-height:100vh;" />
                </body>
              </html>
            `);
            newWindow.document.close();
          } else {
            // Fallback: create download link
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        } else {
          // Desktop: direct download
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      };

      // Try toDataURL directly - more reliable across browsers
      try {
        const dataUrl = canvas.toDataURL('image/png');

        if (dataUrl === 'data:,' || dataUrl.length < 100) {
          console.error('PNG export error: canvas produced empty image');
          alert('Erreur lors de la génération du PNG');
          return false;
        }

        downloadFile(dataUrl);
        return true;
      } catch (err) {
        console.error('PNG export error: toDataURL failed', err);
        alert('Erreur lors de la génération du PNG');
        return false;
      }
    } catch (error) {
      console.error('PNG export error:', error);
      alert('Erreur lors de l\'export PNG');
      return false;
    }
  }, [getCurrentConfig]);

  return { exportSvg, exportPng };
}
