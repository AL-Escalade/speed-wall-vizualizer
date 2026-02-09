/**
 * Header component with app title and export buttons
 * Responsive: full buttons on desktop, dropdown menu on mobile
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, FileImage, Printer, Share2, Check, MoreVertical, ChevronDown } from 'lucide-react';
import { useIntl } from 'react-intl';

/** GitHub icon - inline SVG to avoid lucide deprecation warning */
function GitHubIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}
import { useJsonExport } from '@/hooks/useJsonExport';
import { useJsonImport } from '@/hooks/useJsonImport';
import { useSvgExport } from '@/hooks/useSvgExport';
import { useShare } from '@/hooks/useShare';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ROUTES } from '@/utils/routes';
import { ImportErrorModal } from './ImportErrorModal';

const GITHUB_URL = 'https://github.com/AL-Escalade/speed-wall-vizualizer';

/** Dropdown for image export formats (SVG, PNG) */
function ImageExportDropdown({
  exportSvg,
  exportPng,
}: {
  exportSvg: () => void;
  exportPng: () => void;
}) {
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        className="btn btn-sm btn-outline gap-1"
        onClick={() => setIsOpen(!isOpen)}
        title={intl.formatMessage({ id: 'header.downloadImage' })}
      >
        <FileImage size={16} />
        <span className="hidden xl:inline">{intl.formatMessage({ id: 'header.image' })}</span>
        <ChevronDown size={14} />
      </button>
      {isOpen && (
        <ul className="dropdown-content z-[100] menu p-2 shadow-lg bg-base-100 rounded-box w-40 border border-base-300">
          <li>
            <button onClick={() => handleAction(exportSvg)} className="flex gap-2">
              {intl.formatMessage({ id: 'header.svgVector' })}
            </button>
          </li>
          <li>
            <button onClick={() => handleAction(exportPng)} className="flex gap-2">
              {intl.formatMessage({ id: 'header.pngImage' })}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

function DesktopActions({
  shareSuccess,
  share,
  exportJson,
  triggerImport,
  exportSvg,
  exportPng,
  onPrint,
}: {
  shareSuccess: boolean;
  share: () => void;
  exportJson: () => void;
  triggerImport: () => void;
  exportSvg: () => void;
  exportPng: () => void;
  onPrint: () => void;
}) {
  const intl = useIntl();
  return (
    <div className="flex-none flex gap-1 lg:gap-2">
      <button
        className={`btn btn-sm gap-2 ${shareSuccess ? 'btn-success' : 'btn-outline'}`}
        onClick={share}
        title={intl.formatMessage({ id: 'header.share' })}
      >
        {shareSuccess ? <Check size={16} /> : <Share2 size={16} />}
        <span className="hidden xl:inline">{shareSuccess ? intl.formatMessage({ id: 'header.linkCopied' }) : intl.formatMessage({ id: 'header.share' })}</span>
      </button>
      <button className="btn btn-sm btn-outline gap-2" onClick={exportJson} title={intl.formatMessage({ id: 'header.exportJson' })}>
        <Download size={16} />
        <span className="hidden xl:inline">{intl.formatMessage({ id: 'header.export' })}</span>
      </button>
      <button className="btn btn-sm btn-outline gap-2" onClick={triggerImport} title={intl.formatMessage({ id: 'header.importJson' })}>
        <Upload size={16} />
        <span className="hidden xl:inline">{intl.formatMessage({ id: 'header.import' })}</span>
      </button>
      <ImageExportDropdown exportSvg={exportSvg} exportPng={exportPng} />
      <button className="btn btn-sm btn-primary gap-2" onClick={onPrint} title={intl.formatMessage({ id: 'header.print' })}>
        <Printer size={16} />
        <span className="hidden xl:inline">{intl.formatMessage({ id: 'header.print' })}</span>
      </button>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-sm btn-ghost btn-square"
        title={intl.formatMessage({ id: 'header.sourceCode' })}
      >
        <GitHubIcon size={18} />
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
  exportPng,
  onPrint,
}: {
  shareSuccess: boolean;
  share: () => void;
  exportJson: () => void;
  triggerImport: () => void;
  exportSvg: () => void;
  exportPng: () => void;
  onPrint: () => void;
}) {
  const intl = useIntl();
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
              {shareSuccess ? intl.formatMessage({ id: 'header.linkCopied' }) : intl.formatMessage({ id: 'header.share' })}
            </button>
          </li>
          <li>
            <button onClick={() => handleAction(exportJson)} className="flex gap-2">
              <Download size={16} />
              {intl.formatMessage({ id: 'header.exportJson' })}
            </button>
          </li>
          <li>
            <button onClick={() => handleAction(triggerImport)} className="flex gap-2">
              <Upload size={16} />
              {intl.formatMessage({ id: 'header.importJson' })}
            </button>
          </li>
          <li>
            <button onClick={() => handleAction(exportSvg)} className="flex gap-2">
              <FileImage size={16} />
              {intl.formatMessage({ id: 'header.downloadSvg' })}
            </button>
          </li>
          <li>
            <button onClick={() => handleAction(exportPng)} className="flex gap-2">
              <FileImage size={16} />
              {intl.formatMessage({ id: 'header.downloadPng' })}
            </button>
          </li>
          <li>
            <button onClick={() => handleAction(onPrint)} className="flex gap-2">
              <Printer size={16} />
              {intl.formatMessage({ id: 'header.print' })}
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
              <GitHubIcon size={16} />
              {intl.formatMessage({ id: 'header.sourceCodeShort' })}
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}

export function Header() {
  const intl = useIntl();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { exportJson } = useJsonExport();
  const { exportSvg, exportPng } = useSvgExport();
  const { triggerImport, handleFileChange, inputRef, error, clearError } = useJsonImport();
  const { share, isSuccess: shareSuccess } = useShare();

  const handlePrint = () => navigate(ROUTES.PRINT);

  return (
    <>
      <header className="navbar bg-base-200 border-b border-base-300 min-h-12 px-2 md:px-4">
        <div className="flex-1 min-w-0">
          <span className="text-base md:text-xl font-bold px-2 md:px-4 truncate block">
            {isMobile ? intl.formatMessage({ id: 'header.appName' }) : (
              <>
                <span className="hidden xl:inline">{intl.formatMessage({ id: 'header.appTitle' })}</span>
                <span className="xl:hidden">{intl.formatMessage({ id: 'header.appName' })}</span>
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
            exportPng={exportPng}
            onPrint={handlePrint}
          />
        ) : (
          <DesktopActions
            shareSuccess={shareSuccess}
            share={share}
            exportJson={exportJson}
            triggerImport={triggerImport}
            exportSvg={exportSvg}
            exportPng={exportPng}
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
