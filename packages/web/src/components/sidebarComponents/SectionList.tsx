/**
 * Section list component
 * Displays a list of sections with add functionality
 */

import { useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useConfigStore, useRoutesStore } from '@/store';
import { SectionItem } from './SectionItem';
import {
  ROUTE_SOURCES,
  DEFAULT_ANCHOR,
  DEFAULT_HOLDS,
  DEFAULT_SECTION_COLOR,
  DEFAULT_COORDINATE_SYSTEM,
} from '@/constants/routes';

export function SectionList() {
  const config = useConfigStore((s) =>
    s.configurations.find((c) => c.id === s.activeConfigId) ?? null
  );
  const addSection = useConfigStore((s) => s.addSection);
  const { getRouteNames, getFirstHoldLabel, getLastHoldLabel, getFirstHoldPosition, getRouteColor } = useRoutesStore(
    useShallow((s) => ({
      getRouteNames: s.getRouteNames,
      getFirstHoldLabel: s.getFirstHoldLabel,
      getLastHoldLabel: s.getLastHoldLabel,
      getFirstHoldPosition: s.getFirstHoldPosition,
      getRouteColor: s.getRouteColor,
    }))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!config) return null;

  const handleAddSection = () => {
    const routeNames = getRouteNames();
    const defaultSource = routeNames[0] ?? ROUTE_SOURCES.IFSC;
    const firstLabel = getFirstHoldLabel(defaultSource);
    const lastLabel = getLastHoldLabel(defaultSource);
    const firstPos = getFirstHoldPosition(defaultSource);
    const routeColor = getRouteColor(defaultSource);
    const sectionNumber = config.sections.length + 1;

    const newId = addSection({
      name: `Section ${sectionNumber}`,
      source: defaultSource,
      lane: 0,
      fromHold: firstLabel ?? DEFAULT_HOLDS.FIRST,
      toHold: lastLabel ?? DEFAULT_HOLDS.LAST,
      color: routeColor ?? DEFAULT_SECTION_COLOR,
      anchor: firstPos ?? DEFAULT_ANCHOR,
    });

    // Expand the new section (collapse others)
    setExpandedId(newId);
  };

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Sections</h3>
        <button className="btn btn-sm btn-primary" onClick={handleAddSection}>
          Ajouter
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {config.sections.length === 0 ? (
          <div className="text-center text-base-content/50 py-8">
            Aucune section. Cliquez sur "Ajouter" pour commencer.
          </div>
        ) : (
          config.sections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              isExpanded={expandedId === section.id}
              onToggle={handleToggle}
              lanesCount={config.wall.lanes}
              coordinateDisplaySystem={config.coordinateDisplaySystem ?? DEFAULT_COORDINATE_SYSTEM}
            />
          ))
        )}
      </div>
    </div>
  );
}
