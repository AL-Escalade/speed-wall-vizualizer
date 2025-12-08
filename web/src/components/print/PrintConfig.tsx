/**
 * Print configuration panel component
 * Allows setting print mode, orientation, pages count, and overlap
 */

import type { PrintConfig as PrintConfigType, PrintMode, PrintOrientation } from '@/hooks/usePrintLayout';

interface PrintConfigProps {
  config: PrintConfigType;
  onChange: (config: PrintConfigType) => void;
  onExport: () => void;
  isExporting: boolean;
  exportProgress?: { current: number; total: number };
  totalPages: number;
}

export function PrintConfig({
  config,
  onChange,
  onExport,
  isExporting,
  exportProgress,
  totalPages,
}: PrintConfigProps) {
  const handleModeChange = (mode: PrintMode) => {
    onChange({ ...config, mode });
  };

  const handleOrientationChange = (orientation: PrintOrientation) => {
    onChange({ ...config, orientation });
  };

  const handlePagesInHeightChange = (value: number) => {
    onChange({ ...config, pagesInHeight: Math.max(1, Math.min(20, value)) });
  };

  const handleOverlapChange = (value: number) => {
    onChange({ ...config, overlap: Math.max(0, Math.min(300, value)) });
  };

  return (
    <div className="bg-base-200 p-4 rounded-lg space-y-4">
      <h2 className="font-semibold text-lg">Configuration</h2>

      {/* Print mode */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Mode d'impression</span>
        </label>
        <div className="flex gap-2">
          <button
            className={`btn btn-sm flex-1 ${config.mode === 'full-wall' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleModeChange('full-wall')}
          >
            Mur complet
          </button>
          <button
            className={`btn btn-sm flex-1 ${config.mode === 'lane-by-lane' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleModeChange('lane-by-lane')}
          >
            Couloir par couloir
          </button>
        </div>
      </div>

      {/* Orientation */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Orientation</span>
        </label>
        <div className="flex gap-2">
          <button
            className={`btn btn-sm flex-1 ${config.orientation === 'portrait' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleOrientationChange('portrait')}
          >
            Portrait
          </button>
          <button
            className={`btn btn-sm flex-1 ${config.orientation === 'landscape' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleOrientationChange('landscape')}
          >
            Paysage
          </button>
        </div>
      </div>

      {/* Pages in height */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Nombre de pages en hauteur</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-sm btn-square btn-outline"
            onClick={() => handlePagesInHeightChange(config.pagesInHeight - 1)}
            disabled={config.pagesInHeight <= 1}
          >
            -
          </button>
          <input
            type="number"
            className="input input-sm input-bordered w-16 text-center"
            value={config.pagesInHeight}
            onChange={(e) => handlePagesInHeightChange(parseInt(e.target.value, 10) || 1)}
            min={1}
            max={20}
          />
          <button
            className="btn btn-sm btn-square btn-outline"
            onClick={() => handlePagesInHeightChange(config.pagesInHeight + 1)}
            disabled={config.pagesInHeight >= 20}
          >
            +
          </button>
        </div>
      </div>

      {/* Overlap */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Chevauchement (cm)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            className="range range-sm flex-1"
            value={config.overlap}
            onChange={(e) => handleOverlapChange(parseInt(e.target.value, 10))}
            min={0}
            max={300}
            step={50}
          />
          <span className="text-sm w-12 text-right">{config.overlap / 10} cm</span>
        </div>
      </div>

      {/* Summary */}
      <div className="divider"></div>
      <div className="text-sm text-base-content/70">
        <p>Total : {totalPages} page{totalPages > 1 ? 's' : ''}</p>
      </div>

      {/* Export button */}
      <button
        className="btn btn-primary w-full"
        onClick={onExport}
        disabled={isExporting || totalPages === 0}
      >
        {isExporting ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            {exportProgress && (
              <span>
                Export {exportProgress.current}/{exportProgress.total}
              </span>
            )}
          </>
        ) : (
          'Exporter PDF'
        )}
      </button>
    </div>
  );
}

export default PrintConfig;
