/**
 * Header component with app title and export buttons
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { Download, Upload, FileImage } from 'lucide-react';
import { useConfigStore } from '@/store';
import { validateConfiguration } from '@/utils/configValidation';
import { ImportErrorModal } from './ImportErrorModal';

interface ImportError {
  message: string;
  details?: string;
}

export function Header() {
  const getCurrentConfig = useConfigStore((s) => s.getCurrentConfig);
  const importConfiguration = useConfigStore((s) => s.importConfiguration);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const [importError, setImportError] = useState<ImportError | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Export configuration as JSON
  const handleExportJson = useCallback(() => {
    const config = getCurrentConfig();
    if (!config) {
      alert('Aucune configuration à exporter');
      return;
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
  }, [getCurrentConfig]);

  // Import configuration from JSON
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
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
          setImportError({
            message: 'Le fichier n\'est pas un fichier JSON valide.',
            details: err instanceof Error ? err.message : String(err),
          });
          return;
        }

        const result = validateConfiguration(rawData);

        if (!result.success) {
          setImportError({
            message: 'Le fichier ne correspond pas au format attendu.',
            details: result.error,
          });
          return;
        }

        try {
          importConfiguration(result.data);
        } catch (err) {
          setImportError({
            message: 'Une erreur est survenue lors de l\'import de la configuration.',
            details: err instanceof Error ? err.message : String(err),
          });
        }
      };

      reader.onerror = () => {
        if (!isMountedRef.current) return;
        setImportError({
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

  const handleCloseErrorModal = useCallback(() => {
    setImportError(null);
  }, []);

  // Export SVG
  const handleExportSvg = useCallback(() => {
    const svgElement = document.querySelector('#holds')?.closest('svg');
    if (!svgElement) {
      alert('Aucun SVG à exporter');
      return;
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
  }, [getCurrentConfig]);

  return (
    <>
      <header className="navbar bg-base-200 border-b border-base-300">
        <div className="flex-1">
          <span className="text-xl font-bold px-4">Configurateur de couloirs d'escalade de vitesse</span>
        </div>
        <div className="flex-none flex gap-4">
          <button className="btn btn-sm btn-outline gap-2" onClick={handleExportJson}>
            <Download size={16} />
            Télécharger la configuration
          </button>
          <button className="btn btn-sm btn-outline gap-2" onClick={handleImportClick}>
            <Upload size={16} />
            Importer la configuration
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          <button className="btn btn-sm btn-primary gap-2" onClick={handleExportSvg}>
            <FileImage size={16} />
            Exporter SVG
          </button>
        </div>
      </header>

      <ImportErrorModal
        isOpen={importError !== null}
        onClose={handleCloseErrorModal}
        errorMessage={importError?.message ?? ''}
        technicalDetails={importError?.details}
      />
    </>
  );
}
