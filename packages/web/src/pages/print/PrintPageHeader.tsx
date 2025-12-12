/**
 * Header component for the print page
 * Shows back button, title, and optional config name
 */

import { ArrowLeft } from 'lucide-react';

interface PrintPageHeaderProps {
  onBack: () => void;
  isMobile: boolean;
  configName?: string;
}

export function PrintPageHeader({ onBack, isMobile, configName }: PrintPageHeaderProps) {
  return (
    <header className="navbar bg-base-200 border-b border-base-300 px-2 md:px-4 min-h-12 md:min-h-16">
      <div className="flex-1 flex items-center gap-2 md:gap-4">
        <button
          className="btn btn-sm btn-ghost gap-1 md:gap-2 px-2 md:px-3"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Retour</span>
        </button>
        <span className="text-base md:text-xl font-bold truncate">
          {isMobile ? 'Impression' : 'Impression multi-pages'}
        </span>
      </div>
      {configName && !isMobile && (
        <div className="flex-none">
          <span className="text-base-content/70">{configName}</span>
        </div>
      )}
    </header>
  );
}
