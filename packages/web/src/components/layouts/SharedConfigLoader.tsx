/**
 * Component that loads a shared configuration from URL
 * Decodes the URL parameter, validates the config, and redirects to home
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConfigStore } from '@/store';
import { decodeConfig, hydrateShareableConfig } from '@/utils/urlConfig';
import { ROUTES } from '@/utils/routes';

export function SharedConfigLoader() {
  const { encoded } = useParams<{ encoded: string }>();
  const navigate = useNavigate();
  const importConfiguration = useConfigStore((s) => s.importConfiguration);
  const [error, setError] = useState<string | null>(null);
  const hasImportedRef = useRef(false);

  useEffect(() => {
    // Prevent double import on rapid navigation
    if (hasImportedRef.current) return;

    if (!encoded) {
      navigate(ROUTES.HOME, { replace: true });
      return;
    }

    const config = decodeConfig(encoded);
    if (!config) {
      setError('Le lien de partage est invalide ou corrompu.');
      return;
    }

    // Mark as imported to prevent race conditions
    hasImportedRef.current = true;

    importConfiguration(hydrateShareableConfig(config));
    navigate(ROUTES.HOME, { replace: true });
  }, [encoded, navigate, importConfiguration]);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="alert alert-error max-w-md">
          <span>{error}</span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate(ROUTES.HOME, { replace: true })}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  );
}
