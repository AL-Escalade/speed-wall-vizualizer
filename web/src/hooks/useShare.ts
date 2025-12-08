/**
 * Hook for sharing configuration via URL
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useConfigStore } from '@/store';
import { generateShareUrl } from '@/utils/urlConfig';
import { copyToClipboard } from '@/utils/clipboard';

interface UseShareResult {
  share: () => Promise<boolean>;
  isSuccess: boolean;
}

export function useShare(): UseShareResult {
  const getCurrentConfig = useConfigStore((s) => s.getCurrentConfig);
  const [isSuccess, setIsSuccess] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const share = useCallback(async () => {
    const config = getCurrentConfig();
    if (!config) {
      alert('Aucune configuration à partager');
      return false;
    }

    const url = generateShareUrl(config);
    const success = await copyToClipboard(url);

    if (success) {
      // Clear any existing timeout
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      setIsSuccess(true);
      timeoutRef.current = window.setTimeout(() => {
        setIsSuccess(false);
        timeoutRef.current = null;
      }, 2000);
      return true;
    } else {
      alert('Impossible de copier le lien');
      return false;
    }
  }, [getCurrentConfig]);

  return { share, isSuccess };
}
