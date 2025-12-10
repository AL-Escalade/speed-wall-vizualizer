/**
 * Hook for importing configuration from JSON file
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useConfigStore } from '@/store';
import { validateConfiguration } from '@/utils/configValidation';

export interface ImportError {
  message: string;
  details?: string;
}

interface UseJsonImportResult {
  triggerImport: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  error: ImportError | null;
  clearError: () => void;
}

export function useJsonImport(): UseJsonImportResult {
  const importConfiguration = useConfigStore((s) => s.importConfiguration);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const [error, setError] = useState<ImportError | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const triggerImport = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = (event) => {
        if (!isMountedRef.current) return;

        let rawData: unknown;
        try {
          rawData = JSON.parse(event.target?.result as string);
        } catch (err) {
          console.error('JSON parse error:', err);
          setError({
            message: "Le fichier n'est pas un fichier JSON valide.",
            details: err instanceof Error ? err.message : String(err),
          });
          return;
        }

        const result = validateConfiguration(rawData);

        if (!result.success) {
          setError({
            message: 'Le fichier ne correspond pas au format attendu.',
            details: result.error,
          });
          return;
        }

        try {
          importConfiguration(result.data);
        } catch (err) {
          console.error('Import configuration error:', err);
          setError({
            message: "Une erreur est survenue lors de l'import de la configuration.",
            details: err instanceof Error ? err.message : String(err),
          });
        }
      };

      reader.onerror = () => {
        if (!isMountedRef.current) return;
        console.error('File read error:', reader.error);
        setError({
          message: 'Impossible de lire le fichier.',
          details: reader.error?.message ?? 'Erreur inconnue',
        });
      };

      reader.readAsText(file);

      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [importConfiguration]
  );

  return { triggerImport, handleFileChange, inputRef, error, clearError };
}
