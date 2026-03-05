'use client';

import { useState, useCallback } from 'react';

interface BulkActionsProps {
  selectedCount: number;
  selectedIds: string[];
  onDelete: (ids: string[]) => void;
  onDeselectAll: () => void;
}

export function BulkActions({ selectedCount, selectedIds, onDelete, onDeselectAll }: BulkActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!confirm(`Delete ${selectedCount} selected photo${selectedCount === 1 ? '' : 's'}? This cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(selectedIds);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedCount, selectedIds, onDelete]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 flex items-center justify-between z-40 animate-slide-up">
      <span className="text-sm text-foreground font-medium">
        {selectedCount} photo{selectedCount === 1 ? '' : 's'} selected
      </span>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDeselectAll}
          className="text-sm text-muted hover:text-foreground transition-colors px-3 py-1.5"
        >
          Deselect All
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-600/80 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDeleting ? 'Deleting...' : 'Delete Selected'}
        </button>
      </div>
    </div>
  );
}
