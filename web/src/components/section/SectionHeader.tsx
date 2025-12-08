/**
 * Section header component with name editing and collapse toggle
 */

import { useState, useCallback, memo } from 'react';
import { Trash2, Pencil, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { Section } from '@/store';

interface SectionHeaderProps {
  section: Section;
  isExpanded: boolean;
  onToggle: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
}

export const SectionHeader = memo(function SectionHeader({
  section,
  isExpanded,
  onToggle,
  onRename,
  onRemove,
}: SectionHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const handleStartEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(section.name);
    setIsEditing(true);
  }, [section.name]);

  const handleSaveEdit = useCallback(() => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  }, [editName, onRename]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleRemoveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer cette section ?')) {
      onRemove();
    }
  }, [onRemove]);

  return (
    <div
      className="flex items-center gap-2 p-3 cursor-pointer hover:bg-base-300 rounded-t-2xl"
      onClick={onToggle}
    >
      <button className="btn btn-sm btn-ghost btn-square">
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      <div
        className="w-5 h-5 rounded-full border border-base-300 flex-shrink-0"
        style={{ backgroundColor: section.color }}
      />
      {isEditing ? (
        <div className="flex gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
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
          <button className="btn btn-sm btn-ghost btn-square text-success" onClick={handleSaveEdit}>
            <Check size={16} />
          </button>
          <button className="btn btn-sm btn-ghost btn-square text-error" onClick={handleCancelEdit}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <span className="font-medium text-sm flex-1">{section.name}</span>
          <button
            className="btn btn-sm btn-ghost btn-square"
            onClick={handleStartEdit}
            title="Renommer"
          >
            <Pencil size={14} />
          </button>
        </>
      )}
      <button
        className="btn btn-sm btn-ghost btn-square"
        onClick={handleRemoveClick}
        title="Supprimer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
});
