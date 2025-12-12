/**
 * Configuration selector component
 * Allows selecting, creating, renaming, and deleting configurations
 */

import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useConfigStore } from '@/store';

export function ConfigSelector() {
  const { configurations, activeConfigId, setActiveConfiguration, createConfiguration, deleteConfiguration, renameConfiguration } =
    useConfigStore(
      useShallow((s) => ({
        configurations: s.configurations,
        activeConfigId: s.activeConfigId,
        setActiveConfiguration: s.setActiveConfiguration,
        createConfiguration: s.createConfiguration,
        deleteConfiguration: s.deleteConfiguration,
        renameConfiguration: s.renameConfiguration,
      }))
    );
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const activeConfig = configurations.find((c) => c.id === activeConfigId);

  const handleNew = () => {
    const name = `Configuration ${configurations.length + 1}`;
    createConfiguration(name);
  };

  const handleDelete = () => {
    if (activeConfigId && confirm('Supprimer cette configuration ?')) {
      deleteConfiguration(activeConfigId);
    }
  };

  const handleStartEdit = () => {
    if (activeConfig) {
      setEditName(activeConfig.name);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (activeConfigId && editName.trim()) {
      renameConfiguration(activeConfigId, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className="p-4 border-b border-base-300">
      <label className="label">
        <span className="label-text font-semibold">Configuration</span>
      </label>
      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="input input-bordered input-sm flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') handleCancelEdit();
            }}
          />
          <button className="btn btn-sm btn-square btn-ghost text-success" title="Valider" onClick={handleSaveEdit}>
            <Check size={16} />
          </button>
          <button className="btn btn-sm btn-square btn-ghost text-error" title="Annuler" onClick={handleCancelEdit}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            className="select select-bordered select-sm flex-1"
            value={activeConfigId ?? ''}
            onChange={(e) => setActiveConfiguration(e.target.value || null)}
          >
            {configurations.length === 0 && <option value="">Aucune configuration</option>}
            {configurations.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
          <button className="btn btn-sm btn-square btn-ghost" title="Renommer" onClick={handleStartEdit} disabled={!activeConfigId}>
            <Pencil size={16} />
          </button>
          <button className="btn btn-sm btn-square btn-ghost" title="Nouvelle" onClick={handleNew}>
            <Plus size={16} />
          </button>
          <button
            className="btn btn-sm btn-square btn-ghost"
            title="Supprimer"
            onClick={handleDelete}
            disabled={!activeConfigId}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
