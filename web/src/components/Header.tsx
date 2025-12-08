/**
 * Header component with app title and export buttons
 * Responsive: full buttons on desktop, dropdown menu on mobile
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, FileImage, Printer, Share2, Check, MoreVertical, Github } from 'lucide-react';
import { useJsonExport } from '@/hooks/useJsonExport';
import { useJsonImport } from '@/hooks/useJsonImport';
import { useSvgExport } from '@/hooks/useSvgExport';
import { useShare } from '@/hooks/useShare';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ROUTES } from '@/utils/routes';
import { ImportErrorModal } from './ImportErrorModal';

const GITHUB_URL = 'https://github.com/AL-Escalade/speed-wall-vizualizer';

function DesktopActions({
  shareSuccess,
  share,
  exportJson,
  triggerImport,
  exportSvg,
  onPrint,
}: {
  shareSuccess: boolean;
  share: () => void;
  exportJson: () => void;
  triggerImport: () => void;
  exportSvg: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="flex-none flex gap-1 lg:gap-2">
      <button
        className={`btn btn-sm gap-2 ${shareSuccess ? 'btn-success' : 'btn-outline'}`}
        onClick={share}
        title="Partager"
      >
        {shareSuccess ? <Check size={16} /> : <Share2 size={16} />}
        <span className="hidden xl:inline">{shareSuccess ? 'Lien copié !' : 'Partager'}</span>
      </button>
      <button className="btn btn-sm btn-outline gap-2" onClick={exportJson} title="Exporter JSON">
        <Download size={16} />
        <span className="hidden xl:inline">Exporter</span>
      </button>
      <button className="btn btn-sm btn-outline gap-2" onClick={triggerImport} title="Importer JSON">
        <Upload size={16} />
        <span className="hidden xl:inline">Importer</span>
      </button>
      <button className="btn btn-sm btn-outline gap-2" onClick={exportSvg} title="Télécharger le SVG">
        <FileImage size={16} />
        <span className="hidden xl:inline">SVG</span>
      </button>
      <button className="btn btn-sm btn-primary gap-2" onClick={onPrint} title="Imprimer">
        <Printer size={16} />
        <span className="hidden xl:inline">Imprimer</span>
      </button>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-sm btn-ghost btn-square"
        title="Code source sur GitHub"
      >
        <Github size={18} />
      </a>
    </div>
  );
}

function MobileActions({
  shareSuccess,
  share,
  exportJson,
  triggerImport,
  exportSvg,
  onPrint,
}: {
  shareSuccess: boolean;
  share: () => void;
  exportJson: () => void;
  triggerImport: () => void;
  exportSvg: () => void;
  onPrint: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="dropdown dropdown-end" ref={dropdownRef}>
      <button
        className="btn btn-sm btn-ghost btn-square"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        <MoreVertical size={20} />
      </button>
      {isOpen && (
        <ul className="dropdown-content z-[100] menu p-2 shadow-lg bg-base-100 rounded-box w-56 border border-base-300">
          <li>
            <button onClick={() => handleAction(share)} className="flex gap-2">
              {shareSuccess ? <Check size={16} /> : <Share2 size={16} />}
              {shareSuccess ? 'Lien copié !' : 'Partager'}
            </button>
          </li>
          <li>
            <button onClick={() => handleAction(exportJson)} className="flex gap-2">
              <Download size={16} />
              Exporter JSON
            </button>
          </li>
          <li>
            <button onClick={() => handleAction(triggerImport)} className="flex gap-2">
              <Upload size={16} />
              Importer JSON
            </button>
          </li>
          <li>
            <button onClick={() => handleAction(exportSvg)} className="flex gap-2">
              <FileImage size={16} />
              Télécharger SVG
            </button>
          </li>
          <li>
            <button onClick={() => handleAction(onPrint)} className="flex gap-2">
              <Printer size={16} />
              Imprimer
            </button>
          </li>
          <li className="border-t border-base-300 mt-1 pt-1">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-2"
              onClick={() => setIsOpen(false)}
            >
              <Github size={16} />
              Code source
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}

export function Header() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { exportJson } = useJsonExport();
  const { exportSvg } = useSvgExport();
  const { triggerImport, handleFileChange, inputRef, error, clearError } = useJsonImport();
  const { share, isSuccess: shareSuccess } = useShare();

  const handlePrint = () => navigate(ROUTES.PRINT);

  return (
    <>
      <header className="navbar bg-base-200 border-b border-base-300 min-h-12 px-2 md:px-4">
        <div className="flex-1 min-w-0">
          <span className="text-base md:text-xl font-bold px-2 md:px-4 truncate block">
            {isMobile ? 'Voie Vitesse' : (
              <>
                <span className="hidden xl:inline">Configurateur de couloirs d'escalade de vitesse</span>
                <span className="xl:hidden">Voie Vitesse</span>
              </>
            )}
          </span>
        </div>
        {isMobile ? (
          <MobileActions
            shareSuccess={shareSuccess}
            share={share}
            exportJson={exportJson}
            triggerImport={triggerImport}
            exportSvg={exportSvg}
            onPrint={handlePrint}
          />
        ) : (
          <DesktopActions
            shareSuccess={shareSuccess}
            share={share}
            exportJson={exportJson}
            triggerImport={triggerImport}
            exportSvg={exportSvg}
            onPrint={handlePrint}
          />
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
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
