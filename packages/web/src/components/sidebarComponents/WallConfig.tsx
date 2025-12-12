/**
 * Wall configuration component
 * Allows setting wall dimensions (lanes and panels height)
 */

import { useConfigStore } from '@/store';

export function WallConfig() {
  const config = useConfigStore((s) =>
    s.configurations.find((c) => c.id === s.activeConfigId) ?? null
  );
  const updateWall = useConfigStore((s) => s.updateWall);

  if (!config) return null;

  return (
    <div className="p-4 border-b border-base-300">
      <h3 className="font-semibold mb-3">Dimensions du mur</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-sm">Largeur (couloirs)</span>
          </label>
          <input
            type="number"
            min="1"
            max="4"
            value={config.wall.lanes}
            onChange={(e) => updateWall({ lanes: parseInt(e.target.value) || 1 })}
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-sm">Hauteur (panneaux)</span>
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={config.wall.panelsHeight}
            onChange={(e) => updateWall({ panelsHeight: parseInt(e.target.value) || 1 })}
            className="input input-bordered input-sm w-full"
          />
        </div>
      </div>
    </div>
  );
}
