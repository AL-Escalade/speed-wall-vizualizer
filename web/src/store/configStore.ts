/**
 * Configuration store with persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WallConfig } from '@voie-vitesse/core';
import type { Section, SavedConfiguration, DisplayOptions } from './types';
import type { CoordinateSystemId } from '@/constants/routes';

// Import route data to get default colors
import ifscData from '../../../data/routes/ifsc.json';

/** Generate unique ID */
const generateId = () => crypto.randomUUID();

/** Default wall configuration */
const DEFAULT_WALL: WallConfig = {
  lanes: 2,
  panelsHeight: 10,
};

/** Get IFSC color from route config */
const IFSC_COLOR = ifscData.color;

/** Parse first hold position from route data */
function parseFirstHoldPosition(holds: string[]): { side: 'SN' | 'DX'; column: string; row: number } {
  if (holds.length === 0) return { side: 'SN', column: 'A', row: 1 };
  const firstHold = holds[0];
  const parts = firstHold.trim().split(/\s+/);
  if (parts.length < 3) return { side: 'SN', column: 'A', row: 1 };

  const [panelStr, , positionStr] = parts;
  const panelMatch = panelStr.match(/^(SN|DX)\d+$/i);
  const posMatch = positionStr.match(/^([A-L])(\d+)$/i);

  return {
    side: (panelMatch?.[1]?.toUpperCase() ?? 'SN') as 'SN' | 'DX',
    column: posMatch?.[1]?.toUpperCase() ?? 'A',
    row: parseInt(posMatch?.[2] ?? '1', 10),
  };
}

/** Default first hold position for IFSC */
const IFSC_FIRST_HOLD = parseFirstHoldPosition(ifscData.holds);

/** Create default configuration with IFSC on 2 lanes */
function createDefaultConfiguration(): SavedConfiguration {
  const id = generateId();
  return {
    id,
    name: 'Configuration par défaut',
    wall: { ...DEFAULT_WALL },
    sections: [
      {
        id: generateId(),
        name: 'Section 1',
        source: 'ifsc',
        lane: 0,
        fromHold: 'P1',
        toHold: 'PAD',
        color: IFSC_COLOR,
        anchor: IFSC_FIRST_HOLD,
      },
      {
        id: generateId(),
        name: 'Section 2',
        source: 'ifsc',
        lane: 1,
        fromHold: 'P1',
        toHold: 'PAD',
        color: IFSC_COLOR,
        anchor: IFSC_FIRST_HOLD,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

interface ConfigState {
  /** All saved configurations */
  configurations: SavedConfiguration[];
  /** Currently active configuration ID */
  activeConfigId: string | null;

  // Actions
  /** Create a new configuration */
  createConfiguration: (name: string) => string;
  /** Delete a configuration */
  deleteConfiguration: (id: string) => void;
  /** Set active configuration */
  setActiveConfiguration: (id: string | null) => void;
  /** Rename configuration */
  renameConfiguration: (id: string, name: string) => void;
  /** Update wall config */
  updateWall: (wall: Partial<WallConfig>) => void;
  /** Add a section */
  addSection: (section: Omit<Section, 'id'>) => string;
  /** Update a section */
  updateSection: (id: string, updates: Partial<Omit<Section, 'id'>>) => void;
  /** Remove a section */
  removeSection: (id: string) => void;
  /** Import configuration from JSON */
  importConfiguration: (config: SavedConfiguration) => void;
  /** Get current configuration */
  getCurrentConfig: () => SavedConfiguration | null;
  /** Set arrow display for current configuration */
  setShowArrow: (showArrow: boolean) => void;
  /** Update display options for current configuration */
  updateDisplayOptions: (options: Partial<DisplayOptions>) => void;
  /** Set coordinate display system for current configuration */
  setCoordinateDisplaySystem: (system: CoordinateSystemId) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      configurations: [],
      activeConfigId: null,

      createConfiguration: (name: string) => {
        const id = generateId();
        const newConfig: SavedConfiguration = {
          id,
          name,
          wall: { ...DEFAULT_WALL },
          sections: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          configurations: [...state.configurations, newConfig],
          activeConfigId: id,
        }));

        return id;
      },

      deleteConfiguration: (id: string) => {
        set((state) => {
          const newConfigs = state.configurations.filter((c) => c.id !== id);
          const newActiveId =
            state.activeConfigId === id
              ? newConfigs.length > 0
                ? newConfigs[0].id
                : null
              : state.activeConfigId;

          return {
            configurations: newConfigs,
            activeConfigId: newActiveId,
          };
        });
      },

      setActiveConfiguration: (id: string | null) => {
        set({ activeConfigId: id });
      },

      renameConfiguration: (id: string, name: string) => {
        set((state) => ({
          configurations: state.configurations.map((c) =>
            c.id === id ? { ...c, name, updatedAt: Date.now() } : c
          ),
        }));
      },

      updateWall: (wallUpdates: Partial<WallConfig>) => {
        set((state) => {
          const activeConfig = state.configurations.find(
            (c) => c.id === state.activeConfigId
          );
          if (!activeConfig) return state;

          return {
            configurations: state.configurations.map((c) =>
              c.id === state.activeConfigId
                ? {
                    ...c,
                    wall: { ...c.wall, ...wallUpdates },
                    updatedAt: Date.now(),
                  }
                : c
            ),
          };
        });
      },

      addSection: (sectionData: Omit<Section, 'id'>) => {
        const id = generateId();
        const section: Section = { ...sectionData, id };

        set((state) => ({
          configurations: state.configurations.map((c) =>
            c.id === state.activeConfigId
              ? {
                  ...c,
                  sections: [...c.sections, section],
                  updatedAt: Date.now(),
                }
              : c
          ),
        }));

        return id;
      },

      updateSection: (id: string, updates: Partial<Omit<Section, 'id'>>) => {
        set((state) => ({
          configurations: state.configurations.map((c) =>
            c.id === state.activeConfigId
              ? {
                  ...c,
                  sections: c.sections.map((s) =>
                    s.id === id ? { ...s, ...updates } : s
                  ),
                  updatedAt: Date.now(),
                }
              : c
          ),
        }));
      },

      removeSection: (id: string) => {
        set((state) => ({
          configurations: state.configurations.map((c) =>
            c.id === state.activeConfigId
              ? {
                  ...c,
                  sections: c.sections.filter((s) => s.id !== id),
                  updatedAt: Date.now(),
                }
              : c
          ),
        }));
      },

      importConfiguration: (config: SavedConfiguration) => {
        const id = generateId();
        const importedConfig: SavedConfiguration = {
          ...config,
          id,
          name: `${config.name} (importé)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          configurations: [...state.configurations, importedConfig],
          activeConfigId: id,
        }));
      },

      getCurrentConfig: () => {
        const state = get();
        return (
          state.configurations.find((c) => c.id === state.activeConfigId) ??
          null
        );
      },

      setShowArrow: (showArrow: boolean) => {
        set((state) => ({
          configurations: state.configurations.map((c) =>
            c.id === state.activeConfigId
              ? { ...c, showArrow, updatedAt: Date.now() }
              : c
          ),
        }));
      },

      updateDisplayOptions: (options: Partial<DisplayOptions>) => {
        set((state) => ({
          configurations: state.configurations.map((c) =>
            c.id === state.activeConfigId
              ? {
                  ...c,
                  displayOptions: { ...c.displayOptions, ...options },
                  updatedAt: Date.now(),
                }
              : c
          ),
        }));
      },

      setCoordinateDisplaySystem: (system: CoordinateSystemId) => {
        set((state) => ({
          configurations: state.configurations.map((c) =>
            c.id === state.activeConfigId
              ? { ...c, coordinateDisplaySystem: system, updatedAt: Date.now() }
              : c
          ),
        }));
      },
    }),
    {
      name: 'voie-vitesse-config',
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Create default configuration if none exists
        if (state && state.configurations.length === 0) {
          const defaultConfig = createDefaultConfiguration();
          state.configurations = [defaultConfig];
          state.activeConfigId = defaultConfig.id;
        }
      },
    }
  )
);
