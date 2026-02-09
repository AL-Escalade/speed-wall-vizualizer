/**
 * Hook for importing configuration from JSON file
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
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
  const intl = useIntl();
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
            message: intl.formatMessage({ id: 'error.invalidJson' }),
            details: err instanceof Error ? err.message : String(err),
          });
          return;
        }

        const result = validateConfiguration(rawData);

        if (!result.success) {
          setError({
            message: intl.formatMessage({ id: 'error.invalidFormat' }),
            details: result.error,
          });
          return;
        }

        try {
          importConfiguration(result.data);
        } catch (err) {
          console.error('Import configuration error:', err);
          setError({
            message: intl.formatMessage({ id: 'error.importFailed' }),
            details: err instanceof Error ? err.message : String(err),
          });
        }
      };

      reader.onerror = () => {
        if (!isMountedRef.current) return;
        console.error('File read error:', reader.error);
        setError({
          message: intl.formatMessage({ id: 'error.fileReadFailed' }),
          details: reader.error?.message ?? intl.formatMessage({ id: 'error.unknownError' }),
        });
      };

      reader.readAsText(file);

      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [importConfiguration, intl]
  );

  return { triggerImport, handleFileChange, inputRef, error, clearError };
}
