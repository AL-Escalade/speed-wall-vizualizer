/**
 * Header component with app title and export buttons
 */

import { useNavigate } from 'react-router-dom';
import { Download, Upload, FileImage, Printer, Share2, Check } from 'lucide-react';
import { useJsonExport } from '@/hooks/useJsonExport';
import { useJsonImport } from '@/hooks/useJsonImport';
import { useSvgExport } from '@/hooks/useSvgExport';
import { useShare } from '@/hooks/useShare';
import { ROUTES } from '@/utils/routes';
import { ImportErrorModal } from './ImportErrorModal';

export function Header() {
  const navigate = useNavigate();
  const { exportJson } = useJsonExport();
  const { exportSvg } = useSvgExport();
  const { triggerImport, handleFileChange, inputRef, error, clearError } = useJsonImport();
  const { share, isSuccess: shareSuccess } = useShare();

  return (
    <>
      <header className="navbar bg-base-200 border-b border-base-300">
        <div className="flex-1">
          <span className="text-xl font-bold px-4">Configurateur de couloirs d'escalade de vitesse</span>
        </div>
        <div className="flex-none flex gap-4">
          <button
            className={`btn btn-sm gap-2 ${shareSuccess ? 'btn-success' : 'btn-outline'}`}
            onClick={share}
          >
            {shareSuccess ? <Check size={16} /> : <Share2 size={16} />}
            {shareSuccess ? 'Lien copié !' : 'Partager'}
          </button>
          <button className="btn btn-sm btn-outline gap-2" onClick={exportJson}>
            <Download size={16} />
            Exporter
          </button>
          <button className="btn btn-sm btn-outline gap-2" onClick={triggerImport}>
            <Upload size={16} />
            Importer
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          <button className="btn btn-sm btn-outline gap-2" onClick={exportSvg}>
            <FileImage size={16} />
            Télécharger le SVG
          </button>
          <button className="btn btn-sm btn-primary gap-2" onClick={() => navigate(ROUTES.PRINT)}>
            <Printer size={16} />
            Imprimer
          </button>
        </div>
      </header>

      <ImportErrorModal
        isOpen={error !== null}
        onClose={clearError}
        errorMessage={error?.message ?? ''}
        technicalDetails={error?.details}
      />
    </>
  );
}
