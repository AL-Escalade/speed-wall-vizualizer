/**
 * Hook for exporting SVG visualization
 */

import { useCallback } from 'react';
import { useConfigStore } from '@/store';

/** Data attribute used to identify the exportable SVG container */
const SVG_EXPORT_SELECTOR = '[data-export-target="wall-svg"]';

interface UseSvgExportResult {
  exportSvg: () => boolean;
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

  return { exportSvg };
}
