'use client';
import * as React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useDeleteWorld } from '@/hooks/mutations/useDeleteWorld';

export interface DeleteWorldModalProps {
  worldId: string | null;
  worldName?: string;
  onClose: () => void;
}

export function DeleteWorldModal({ worldId, worldName, onClose }: DeleteWorldModalProps) {
  const deleteWorld = useDeleteWorld();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!worldId) return;
    
    setIsDeleting(true);
    try {
      await deleteWorld.mutateAsync(worldId);
      onClose();
    } catch (error) {
      console.error('Failed to delete world:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!worldId) return null;

  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Delete World
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            Are you sure you want to permanently delete the world <strong>"{worldName}"</strong>?
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-medium mb-1">This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-1 text-red-600 dark:text-red-400">
                  <li>All entities and characters</li>
                  <li>All templates and folders</li>
                  <li>All relationships and links</li>
                  <li>All world data and settings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </div>
            ) : (
              'Delete World'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
