'use client';
import * as React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useUpdateWorld } from '@/hooks/mutations/useUpdateWorld';
import { logError } from '@/lib/logging';

export interface ArchiveWorldModalProps {
  worldId: string | null;
  worldName?: string;
  isArchived?: boolean;
  onClose: () => void;
}

export function ArchiveWorldModal({ worldId, worldName, isArchived = false, onClose }: ArchiveWorldModalProps) {
  const updateWorld = useUpdateWorld(worldId || '');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleArchive = async () => {
    if (!worldId) return;
    
    setIsProcessing(true);
    try {
      await updateWorld.mutateAsync({ isArchived: !isArchived });
      onClose();
    } catch (error) {
      logError('Failed to archive/unarchive world', error as Error, {
        worldId,
        action: isArchived ? 'unarchive_world' : 'archive_world',
        component: 'ArchiveWorldModal',
        metadata: { worldName, isArchived }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!worldId) return null;

  const actionText = isArchived ? 'Unarchive' : 'Archive';
  const actionTextLower = isArchived ? 'unarchive' : 'archive';
  
  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isArchived 
              ? 'bg-green-100 dark:bg-green-900/20' 
              : 'bg-amber-100 dark:bg-amber-900/20'
          }`}>
            {isArchived ? (
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0 0l6-6m-6 6V3" />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {actionText} World
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isArchived ? 'Restore this world to your active worlds' : 'Move this world to your archive'}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            Are you sure you want to {actionTextLower} the world <strong>"{worldName}"</strong>?
          </p>
          
          {!isArchived && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <p className="font-medium mb-1">Archived worlds:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-600 dark:text-amber-400">
                    <li>Will be hidden from your main dashboard</li>
                    <li>Can be restored at any time</li>
                    <li>All data will be preserved</li>
                    <li>Won't count toward your active world limit</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isArchived && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-green-700 dark:text-green-300">
                  <p className="font-medium mb-1">Restoring this world will:</p>
                  <ul className="list-disc list-inside space-y-1 text-green-600 dark:text-green-400">
                    <li>Make it visible on your main dashboard</li>
                    <li>Allow full editing and development</li>
                    <li>Count toward your active world limit</li>
                    <li>Preserve all existing data</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleArchive}
            disabled={isProcessing}
            className={isArchived 
              ? "bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white"
              : "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white"
            }
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isArchived ? 'Unarchiving...' : 'Archiving...'}
              </div>
            ) : (
              `${actionText} World`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
