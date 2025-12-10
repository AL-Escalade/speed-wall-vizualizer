/**
 * Hook for exporting configuration as JSON file
 */

import { useCallback } from 'react';
import { useConfigStore } from '@/store';

interface UseJsonExportResult {
  exportJson: () => boolean;
}

export function useJsonExport(): UseJsonExportResult {
  const getCurrentConfig = useConfigStore((s) => s.getCurrentConfig);

  const exportJson = useCallback(() => {
    const config = getCurrentConfig();
    if (!config) {
      alert('Aucune configuration à exporter');
      return false;
    }

    const dataStr = JSON.stringify(config, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }, [getCurrentConfig]);

  return { exportJson };
}
