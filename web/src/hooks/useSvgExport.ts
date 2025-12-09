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

    // Convert to pixels at export DPI (same formula as PDF generator)
    // SVG uses mm units, convert to inches then to pixels
    const widthPx = (svgWidth / 25.4) * EXPORT_DPI * EXPORT_SCALE;
    const heightPx = (svgHeight / 25.4) * EXPORT_DPI * EXPORT_SCALE;

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
    const img = new Image();
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, widthPx, heightPx);

      // Draw the SVG scaled to canvas size
      ctx.drawImage(img, 0, 0, widthPx, heightPx);
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

export function useSvgExport(): UseSvgExportResult {
  const getCurrentConfig = useConfigStore((s) => s.getCurrentConfig);

  const exportSvg = useCallback(() => {
    const container = document.querySelector(SVG_EXPORT_SELECTOR);
    const svgElement = container?.querySelector('svg');
    if (!svgElement) {
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
      alert('Aucun SVG à exporter');
      return false;
    }

    try {
      const config = getCurrentConfig();
      const fileName = config ? `${config.name.replace(/\s+/g, '_')}.png` : 'wall.png';

      // Rasterize at same DPI/scale as PDF export
      const canvas = await rasterizeSvgToCanvas(svgElement);

      // Convert to blob and download
      return new Promise<boolean>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            alert('Erreur lors de la génération du PNG');
            resolve(false);
            return;
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolve(true);
        }, 'image/png');
      });
    } catch (error) {
      console.error('PNG export error:', error);
      alert('Erreur lors de l\'export PNG');
      return false;
    }
  }, [getCurrentConfig]);

  return { exportSvg, exportPng };
}
