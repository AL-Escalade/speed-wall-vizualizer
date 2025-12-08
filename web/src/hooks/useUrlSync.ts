/**
 * Hook to synchronize configuration state with URL
 * Updates the URL in real-time as the configuration changes
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useConfigStore } from '@/store';
import { encodeConfig, extractShareableConfig } from '@/utils/urlConfig';
import { ROUTES } from '@/utils/routes';

/**
 * Syncs the current configuration to the URL path
 * Uses history.replaceState to avoid polluting browser history
 */
export function useUrlSync() {
  const location = useLocation();
  const config = useConfigStore((s) =>
    s.configurations.find((c) => c.id === s.activeConfigId) ?? null
  );
  const lastEncodedRef = useRef<string | null>(null);

  useEffect(() => {
    // Only sync on main page
    if (location.pathname !== '/') {
      return;
    }

    if (!config || config.sections.length === 0) {
      // No config or empty config - clear the ref
      lastEncodedRef.current = null;
      return;
    }

    // Encode the current configuration
    const shareable = extractShareableConfig(config);
    const encoded = encodeConfig(shareable);

    // Only update if the encoded value changed
    if (encoded !== lastEncodedRef.current) {
      lastEncodedRef.current = encoded;
      window.history.replaceState(null, '', ROUTES.SHARE(encoded));
    }
  }, [config, location.pathname]);
}
