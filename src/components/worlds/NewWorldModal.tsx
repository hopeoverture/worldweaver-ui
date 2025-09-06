'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { World } from '@/lib/types';

interface NewWorldModalProps {
  open: boolean;
  worldToEdit?: World | null;
  onClose: () => void;
  onSave: (worldData: { name: string; summary?: string }) => void;
}

export function NewWorldModal({ open, worldToEdit, onClose, onSave }: NewWorldModalProps) {
  const [name, setName] = useState(worldToEdit?.name || '');
  const [summary, setSummary] = useState(worldToEdit?.summary || '');

  const handleSave = () => {
    if (name.trim()) {
      onSave({ name, summary });
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      title={worldToEdit ? 'Edit World' : 'Create New World'}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-800 transition focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 dark:focus:ring-offset-neutral-900">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 text-sm font-medium shadow-sm transition bg-brand-600 hover:bg-brand-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="world-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            type="text"
            id="world-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            required
          />
        </div>
        <div>
          <label htmlFor="world-summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Summary
          </label>
          <textarea
            id="world-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="block w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
        </div>
      </div>
    </Modal>
  );
}
