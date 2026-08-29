import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useConfigStore } from './configStore';
import type { SavedConfiguration } from './types';
import { CONFIG_SCHEMA_VERSION } from '@/utils/configMigrations';

// Mock crypto.randomUUID with proper UUID format
beforeEach(() => {
  let counter = 0;
  vi.spyOn(crypto, 'randomUUID').mockImplementation(
    (): `${string}-${string}-${string}-${string}-${string}` =>
      `test-uuid-${++counter}-0000-0000-000000000000`
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('configStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useConfigStore.setState({
      configurations: [],
      activeConfigId: null,
    });
  });

  describe('importConfiguration', () => {
    it('should create new configuration when no duplicate exists', () => {
      const config: SavedConfiguration = {
        id: 'imported-id',
        name: 'Test Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [
          {
            id: 'section-1',
            name: 'Section 1',
            source: 'ifsc',
            lane: 0,
            fromHold: 1,
            toHold: 20,
            color: '#FF0000',
          },
        ],
        createdAt: 1000,
        updatedAt: 2000,
      };

      useConfigStore.getState().importConfiguration(config);
      const state = useConfigStore.getState();

      expect(state.configurations).toHaveLength(1);
      expect(state.configurations[0].name).toBe('Test Config (importé)');
      expect(state.activeConfigId).toBe(state.configurations[0].id);
    });

    it('should activate existing configuration instead of creating duplicate', () => {
      // First, add an existing configuration
      const existingConfig: SavedConfiguration = {
        id: 'existing-id',
        name: 'Existing Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [
          {
            id: 'section-1',
            name: 'Section 1',
            source: 'ifsc',
            lane: 0,
            fromHold: 1,
            toHold: 20,
            color: '#FF0000',
          },
        ],
        createdAt: 1000,
        updatedAt: 2000,
      };

      useConfigStore.setState({
        configurations: [existingConfig],
        activeConfigId: null,
      });

      // Import a config with same content but different id/name
      const importedConfig: SavedConfiguration = {
        id: 'imported-id',
        name: 'Imported Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [
          {
            id: 'section-2',
            name: 'Section 1',
            source: 'ifsc',
            lane: 0,
            fromHold: 1,
            toHold: 20,
            color: '#FF0000',
          },
        ],
        createdAt: 3000,
        updatedAt: 4000,
      };

      useConfigStore.getState().importConfiguration(importedConfig);
      const state = useConfigStore.getState();

      // Should not create a new configuration
      expect(state.configurations).toHaveLength(1);
      // Should activate the existing one
      expect(state.activeConfigId).toBe('existing-id');
    });

    it('should create new config when wall dimensions differ', () => {
      const existingConfig: SavedConfiguration = {
        id: 'existing-id',
        name: 'Existing Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 1000,
        updatedAt: 2000,
      };

      useConfigStore.setState({
        configurations: [existingConfig],
        activeConfigId: 'existing-id',
      });

      const importedConfig: SavedConfiguration = {
        id: 'imported-id',
        name: 'Imported Config',
        wall: { lanes: 3, panelsHeight: 10 }, // Different lanes
        sections: [],
        createdAt: 3000,
        updatedAt: 4000,
      };

      useConfigStore.getState().importConfiguration(importedConfig);
      const state = useConfigStore.getState();

      expect(state.configurations).toHaveLength(2);
    });

    it('should create new config when sections differ', () => {
      const existingConfig: SavedConfiguration = {
        id: 'existing-id',
        name: 'Existing Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [
          {
            id: 'section-1',
            name: 'Section 1',
            source: 'ifsc',
            lane: 0,
            fromHold: 1,
            toHold: 20,
            color: '#FF0000',
          },
        ],
        createdAt: 1000,
        updatedAt: 2000,
      };

      useConfigStore.setState({
        configurations: [existingConfig],
        activeConfigId: 'existing-id',
      });

      const importedConfig: SavedConfiguration = {
        id: 'imported-id',
        name: 'Imported Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [
          {
            id: 'section-2',
            name: 'Section 1',
            source: 'u15', // Different source
            lane: 0,
            fromHold: 1,
            toHold: 20,
            color: '#FF0000',
          },
        ],
        createdAt: 3000,
        updatedAt: 4000,
      };

      useConfigStore.getState().importConfiguration(importedConfig);
      const state = useConfigStore.getState();

      expect(state.configurations).toHaveLength(2);
    });
  });

  describe('deduplicateConfigurations', () => {
    it('should keep only the oldest configuration from duplicates', () => {
      const config1: SavedConfiguration = {
        id: 'config-1',
        name: 'Config 1',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [
          {
            id: 's1',
            name: 'Section',
            source: 'ifsc',
            lane: 0,
            fromHold: 1,
            toHold: 20,
            color: '#FF0000',
          },
        ],
        createdAt: 1000, // Oldest
        updatedAt: 2000,
      };

      const config2: SavedConfiguration = {
        id: 'config-2',
        name: 'Config 2 (duplicate)',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [
          {
            id: 's2',
            name: 'Section',
            source: 'ifsc',
            lane: 0,
            fromHold: 1,
            toHold: 20,
            color: '#FF0000',
          },
        ],
        createdAt: 2000, // Newer duplicate
        updatedAt: 3000,
      };

      useConfigStore.setState({
        configurations: [config1, config2],
        activeConfigId: 'config-2',
      });

      useConfigStore.getState().deduplicateConfigurations();
      const state = useConfigStore.getState();

      expect(state.configurations).toHaveLength(1);
      expect(state.configurations[0].id).toBe('config-1');
    });

    it('should update activeConfigId when active config is removed', () => {
      const config1: SavedConfiguration = {
        id: 'config-1',
        name: 'Config 1',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 1000,
        updatedAt: 2000,
      };

      const config2: SavedConfiguration = {
        id: 'config-2',
        name: 'Config 2 (duplicate)',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 2000,
        updatedAt: 3000,
      };

      useConfigStore.setState({
        configurations: [config1, config2],
        activeConfigId: 'config-2', // Active is the duplicate to be removed
      });

      useConfigStore.getState().deduplicateConfigurations();
      const state = useConfigStore.getState();

      expect(state.configurations).toHaveLength(1);
      expect(state.activeConfigId).toBe('config-1'); // Should switch to kept config
    });

    it('should handle multiple groups of duplicates', () => {
      // Group 1: Two configs with 2 lanes
      const group1Config1: SavedConfiguration = {
        id: 'g1-c1',
        name: 'Group 1 - Config 1',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 1000,
        updatedAt: 2000,
      };

      const group1Config2: SavedConfiguration = {
        id: 'g1-c2',
        name: 'Group 1 - Config 2',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 2000,
        updatedAt: 3000,
      };

      // Group 2: Two configs with 3 lanes
      const group2Config1: SavedConfiguration = {
        id: 'g2-c1',
        name: 'Group 2 - Config 1',
        wall: { lanes: 3, panelsHeight: 10 },
        sections: [],
        createdAt: 1500,
        updatedAt: 2500,
      };

      const group2Config2: SavedConfiguration = {
        id: 'g2-c2',
        name: 'Group 2 - Config 2',
        wall: { lanes: 3, panelsHeight: 10 },
        sections: [],
        createdAt: 2500,
        updatedAt: 3500,
      };

      useConfigStore.setState({
        configurations: [group1Config1, group1Config2, group2Config1, group2Config2],
        activeConfigId: 'g1-c1',
      });

      useConfigStore.getState().deduplicateConfigurations();
      const state = useConfigStore.getState();

      expect(state.configurations).toHaveLength(2);
      expect(state.configurations.map((c) => c.id).sort()).toEqual(['g1-c1', 'g2-c1']);
    });

    it('should not remove unique configurations', () => {
      const config1: SavedConfiguration = {
        id: 'config-1',
        name: 'Config 1',
        wall: { lanes: 1, panelsHeight: 5 },
        sections: [],
        createdAt: 1000,
        updatedAt: 2000,
      };

      const config2: SavedConfiguration = {
        id: 'config-2',
        name: 'Config 2',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 2000,
        updatedAt: 3000,
      };

      const config3: SavedConfiguration = {
        id: 'config-3',
        name: 'Config 3',
        wall: { lanes: 3, panelsHeight: 15 },
        sections: [],
        createdAt: 3000,
        updatedAt: 4000,
      };

      useConfigStore.setState({
        configurations: [config1, config2, config3],
        activeConfigId: 'config-2',
      });

      useConfigStore.getState().deduplicateConfigurations();
      const state = useConfigStore.getState();

      expect(state.configurations).toHaveLength(3);
      expect(state.activeConfigId).toBe('config-2');
    });

    it('should handle empty configurations array', () => {
      useConfigStore.setState({
        configurations: [],
        activeConfigId: null,
      });

      useConfigStore.getState().deduplicateConfigurations();
      const state = useConfigStore.getState();

      expect(state.configurations).toHaveLength(0);
      expect(state.activeConfigId).toBeNull();
    });

    it('should detect duplicates with sections in different order', () => {
      const config1: SavedConfiguration = {
        id: 'config-1',
        name: 'Config 1',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [
          {
            id: 's1',
            name: 'Section A',
            source: 'ifsc',
            lane: 0,
            fromHold: 1,
            toHold: 10,
            color: '#FF0000',
          },
          {
            id: 's2',
            name: 'Section B',
            source: 'u15',
            lane: 1,
            fromHold: 1,
            toHold: 10,
            color: '#00FF00',
          },
        ],
        createdAt: 1000,
        updatedAt: 2000,
      };

      const config2: SavedConfiguration = {
        id: 'config-2',
        name: 'Config 2',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [
          // Sections in reverse order
          {
            id: 's3',
            name: 'Section B',
            source: 'u15',
            lane: 1,
            fromHold: 1,
            toHold: 10,
            color: '#00FF00',
          },
          {
            id: 's4',
            name: 'Section A',
            source: 'ifsc',
            lane: 0,
            fromHold: 1,
            toHold: 10,
            color: '#FF0000',
          },
        ],
        createdAt: 2000,
        updatedAt: 3000,
      };

      useConfigStore.setState({
        configurations: [config1, config2],
        activeConfigId: 'config-1',
      });

      useConfigStore.getState().deduplicateConfigurations();
      const state = useConfigStore.getState();

      // Should be considered duplicates (same content, different section order)
      expect(state.configurations).toHaveLength(1);
    });
  });

  describe('createConfiguration', () => {
    it('should create a new configuration with given name', () => {
      const id = useConfigStore.getState().createConfiguration('My Config');
      const state = useConfigStore.getState();

      expect(state.configurations).toHaveLength(1);
      expect(state.configurations[0].name).toBe('My Config');
      expect(state.configurations[0].id).toBe(id);
      expect(state.activeConfigId).toBe(id);
    });
  });

  describe('deleteConfiguration', () => {
    it('should delete configuration and update activeConfigId', () => {
      const config1: SavedConfiguration = {
        id: 'config-1',
        name: 'Config 1',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 1000,
        updatedAt: 2000,
      };

      const config2: SavedConfiguration = {
        id: 'config-2',
        name: 'Config 2',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 2000,
        updatedAt: 3000,
      };

      useConfigStore.setState({
        configurations: [config1, config2],
        activeConfigId: 'config-1',
      });

      useConfigStore.getState().deleteConfiguration('config-1');
      const state = useConfigStore.getState();

      expect(state.configurations).toHaveLength(1);
      expect(state.activeConfigId).toBe('config-2');
    });

    it('should set activeConfigId to null when last config is deleted', () => {
      const config: SavedConfiguration = {
        id: 'config-1',
        name: 'Config 1',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 1000,
        updatedAt: 2000,
      };

      useConfigStore.setState({
        configurations: [config],
        activeConfigId: 'config-1',
      });

      useConfigStore.getState().deleteConfiguration('config-1');
      const state = useConfigStore.getState();

      expect(state.configurations).toHaveLength(0);
      expect(state.activeConfigId).toBeNull();
    });
  });

  describe('renameConfiguration', () => {
    it('should rename configuration and update timestamp', () => {
      const config: SavedConfiguration = {
        id: 'config-1',
        name: 'Old Name',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 1000,
        updatedAt: 1000,
      };

      useConfigStore.setState({
        configurations: [config],
        activeConfigId: 'config-1',
      });

      const beforeUpdate = Date.now();
      useConfigStore.getState().renameConfiguration('config-1', 'New Name');
      const state = useConfigStore.getState();

      expect(state.configurations[0].name).toBe('New Name');
      expect(state.configurations[0].updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
    });
  });

  describe('updateWall', () => {
    it('should update wall configuration', () => {
      const config: SavedConfiguration = {
        id: 'config-1',
        name: 'Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 1000,
        updatedAt: 1000,
      };

      useConfigStore.setState({
        configurations: [config],
        activeConfigId: 'config-1',
      });

      useConfigStore.getState().updateWall({ lanes: 4 });
      const state = useConfigStore.getState();

      expect(state.configurations[0].wall.lanes).toBe(4);
      expect(state.configurations[0].wall.panelsHeight).toBe(10); // Preserved
    });

    it('should not update when no active config', () => {
      useConfigStore.setState({
        configurations: [],
        activeConfigId: null,
      });

      useConfigStore.getState().updateWall({ lanes: 4 });
      const state = useConfigStore.getState();

      expect(state.configurations).toHaveLength(0);
    });
  });

  describe('addSection', () => {
    it('should add section to active configuration', () => {
      const config: SavedConfiguration = {
        id: 'config-1',
        name: 'Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 1000,
        updatedAt: 1000,
      };

      useConfigStore.setState({
        configurations: [config],
        activeConfigId: 'config-1',
      });

      const sectionId = useConfigStore.getState().addSection({
        name: 'New Section',
        source: 'ifsc',
        lane: 0,
        fromHold: 1,
        toHold: 20,
        color: '#FF0000',
      });

      const state = useConfigStore.getState();

      expect(state.configurations[0].sections).toHaveLength(1);
      expect(state.configurations[0].sections[0].id).toBe(sectionId);
      expect(state.configurations[0].sections[0].name).toBe('New Section');
    });
  });

  describe('updateSection', () => {
    it('should update section in active configuration', () => {
      const config: SavedConfiguration = {
        id: 'config-1',
        name: 'Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [
          {
            id: 'section-1',
            name: 'Old Name',
            source: 'ifsc',
            lane: 0,
            fromHold: 1,
            toHold: 20,
            color: '#FF0000',
          },
        ],
        createdAt: 1000,
        updatedAt: 1000,
      };

      useConfigStore.setState({
        configurations: [config],
        activeConfigId: 'config-1',
      });

      useConfigStore.getState().updateSection('section-1', { name: 'New Name', lane: 1 });
      const state = useConfigStore.getState();

      expect(state.configurations[0].sections[0].name).toBe('New Name');
      expect(state.configurations[0].sections[0].lane).toBe(1);
      expect(state.configurations[0].sections[0].source).toBe('ifsc'); // Preserved
    });
  });

  describe('removeSection', () => {
    it('should remove section from active configuration', () => {
      const config: SavedConfiguration = {
        id: 'config-1',
        name: 'Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [
          {
            id: 'section-1',
            name: 'Section 1',
            source: 'ifsc',
            lane: 0,
            fromHold: 1,
            toHold: 20,
            color: '#FF0000',
          },
          {
            id: 'section-2',
            name: 'Section 2',
            source: 'u15',
            lane: 1,
            fromHold: 1,
            toHold: 10,
            color: '#00FF00',
          },
        ],
        createdAt: 1000,
        updatedAt: 1000,
      };

      useConfigStore.setState({
        configurations: [config],
        activeConfigId: 'config-1',
      });

      useConfigStore.getState().removeSection('section-1');
      const state = useConfigStore.getState();

      expect(state.configurations[0].sections).toHaveLength(1);
      expect(state.configurations[0].sections[0].id).toBe('section-2');
    });
  });

  describe('getCurrentConfig', () => {
    it('should return active configuration', () => {
      const config: SavedConfiguration = {
        id: 'config-1',
        name: 'Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 1000,
        updatedAt: 1000,
      };

      useConfigStore.setState({
        configurations: [config],
        activeConfigId: 'config-1',
      });

      const current = useConfigStore.getState().getCurrentConfig();
      expect(current).toEqual(config);
    });

    it('should return null when no active configuration', () => {
      useConfigStore.setState({
        configurations: [],
        activeConfigId: null,
      });

      const current = useConfigStore.getState().getCurrentConfig();
      expect(current).toBeNull();
    });
  });

  describe('setShowArrow', () => {
    it('should set showArrow on active configuration', () => {
      const config: SavedConfiguration = {
        id: 'config-1',
        name: 'Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        showArrow: false,
        createdAt: 1000,
        updatedAt: 1000,
      };

      useConfigStore.setState({
        configurations: [config],
        activeConfigId: 'config-1',
      });

      useConfigStore.getState().setShowArrow(true);
      const state = useConfigStore.getState();

      expect(state.configurations[0].showArrow).toBe(true);
    });
  });

  describe('updateDisplayOptions', () => {
    it('should update display options on active configuration', () => {
      const config: SavedConfiguration = {
        id: 'config-1',
        name: 'Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        displayOptions: { gridColor: '#AAAAAA' },
        createdAt: 1000,
        updatedAt: 1000,
      };

      useConfigStore.setState({
        configurations: [config],
        activeConfigId: 'config-1',
      });

      useConfigStore.getState().updateDisplayOptions({ labelFontSize: 30 });
      const state = useConfigStore.getState();

      expect(state.configurations[0].displayOptions?.gridColor).toBe('#AAAAAA');
      expect(state.configurations[0].displayOptions?.labelFontSize).toBe(30);
    });
  });

  describe('setCoordinateDisplaySystem', () => {
    it('should set coordinate display system on active configuration', () => {
      const config: SavedConfiguration = {
        id: 'config-1',
        name: 'Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 1000,
        updatedAt: 1000,
      };

      useConfigStore.setState({
        configurations: [config],
        activeConfigId: 'config-1',
      });

      useConfigStore.getState().setCoordinateDisplaySystem('FFME');
      const state = useConfigStore.getState();

      expect(state.configurations[0].coordinateDisplaySystem).toBe('FFME');
    });
  });

  describe('setLanguage', () => {
    it('should set language on active configuration', () => {
      const config: SavedConfiguration = {
        id: 'config-1',
        name: 'Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        createdAt: 1000,
        updatedAt: 1000,
      };

      useConfigStore.setState({
        configurations: [config],
        activeConfigId: 'config-1',
      });

      useConfigStore.getState().setLanguage('de');
      const state = useConfigStore.getState();

      expect(state.configurations[0].language).toBe('de');
      expect(state.configurations[0].updatedAt).toBeGreaterThanOrEqual(1000);
    });

    it('should set language to auto', () => {
      const config: SavedConfiguration = {
        id: 'config-1',
        name: 'Config',
        wall: { lanes: 2, panelsHeight: 10 },
        sections: [],
        language: 'fr',
        createdAt: 1000,
        updatedAt: 1000,
      };

      useConfigStore.setState({
        configurations: [config],
        activeConfigId: 'config-1',
      });

      useConfigStore.getState().setLanguage('auto');
      const state = useConfigStore.getState();

      expect(state.configurations[0].language).toBe('auto');
    });
  });

  describe('rehydration', () => {
    /** Seed localStorage the way zustand/persist serializes it, then rehydrate */
    const rehydrateWith = async (sections: unknown[], version = 1) => {
      localStorage.setItem('voie-vitesse-config', JSON.stringify({
        version,
        state: {
          configurations: [{
            id: 'cfg', name: 'Saved', wall: { lanes: 2, panelsHeight: 10 },
            sections, createdAt: 1, updatedAt: 1,
          }],
          activeConfigId: 'cfg',
        },
      }));
      await useConfigStore.persist.rehydrate();
      return useConfigStore.getState().configurations[0].sections[0];
    };

    const legacySection = (color: string) => ({
      id: 's', name: 'S', source: 'u15-it', lane: 0, fromHold: 'F1', toHold: 'PAD', color,
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should migrate a section saved before multi-color routes', async () => {
      // #008000 is the pre-feature color of the route u15-it then designated,
      // so the section was never customized
      const section = await rehydrateWith([legacySection('#008000')]);

      expect(section.colors).toEqual({});
      expect(section.color).toBe('#FF0000');
    });

    it('should rename a route id that changed meaning', async () => {
      const section = await rehydrateWith([legacySection('#008000')]);

      expect(section.source).toBe('u15-de');
    });

    it('should leave the route id of a current configuration alone', async () => {
      const section = await rehydrateWith([legacySection('#008000')], CONFIG_SCHEMA_VERSION);

      expect(section.source).toBe('u15-it');
    });

    it('should pin a deliberately chosen color across every tag', async () => {
      const section = await rehydrateWith([legacySection('#FF6600')]);

      expect(section.colors).toEqual({ RED: '#FF6600', DARKGREEN: '#FF6600' });
    });

    it('should be idempotent across two rehydrations', async () => {
      const first = await rehydrateWith([legacySection('#008000')]);
      const second = await rehydrateWith([{ ...first }]);

      expect(second).toEqual(first);
    });

    it('should seed a default configuration when none is stored', async () => {
      localStorage.setItem('voie-vitesse-config', JSON.stringify({
        version: 1,
        state: { configurations: [], activeConfigId: null },
      }));
      await useConfigStore.persist.rehydrate();

      const { configurations, activeConfigId } = useConfigStore.getState();
      expect(configurations).toHaveLength(1);
      expect(activeConfigId).toBe(configurations[0].id);
    });
  });
});
