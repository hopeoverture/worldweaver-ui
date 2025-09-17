'use client';
import { memo, useState } from 'react';
import Image from 'next/image';
import { Entity } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useDeleteEntity } from '@/hooks/mutations/useDeleteEntity';
import { useToast } from '@/components/ui/ToastProvider';

/**
 * EntityCard component for displaying entity information
 * @param entity - The entity data to display
 * @param onClick - Optional click handler
 * @param onDragStart - Optional drag start handler
 */
interface EntityCardProps {
  /** The entity data to display */
  entity: Entity;
  /** Optional click handler for card interaction */
  onClick?: () => void;
  /** Optional drag start handler for drag-and-drop */
  onDragStart?: (entity: Entity) => void;
  /** Optional delete handler for entity deletion */
  onDelete?: (entityId: string) => void;
  /** World ID for cache invalidation */
  worldId?: string;
}

function EntityCardComponent({ entity, onClick, onDragStart, onDelete, worldId }: EntityCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteEntity = useDeleteEntity(worldId || entity.worldId);
  const { toast } = useToast();

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'entity',
      id: entity.id,
      name: entity.name
    }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(entity);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`🗑️ EntityCard: Attempting to delete entity "${entity.name}" (${entity.id})`);

    try {
      const result = await deleteEntity.mutateAsync(entity.id);
      console.log(`✅ EntityCard: Delete successful for "${entity.name}":`, result);

      toast({
        title: 'Entity deleted',
        description: `${entity.name} has been deleted`,
        variant: 'success'
      });
      onDelete?.(entity.id);
    } catch (error) {
      console.error(`🚨 EntityCard: Delete failed for "${entity.name}":`, error);

      toast({
        title: 'Failed to delete entity',
        description: String((error as Error)?.message || error),
        variant: 'error'
      });
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div
      data-testid="entity-card"
      className={`group relative rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card hover:shadow-xl transition-all duration-300 p-6 hover:-translate-y-1 cursor-pointer ${isDragging ? 'opacity-50 scale-95' : ''}`}
      onClick={onClick}
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Gradient overlay for visual interest */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative">
        {entity.imageUrl && (
          <div className="relative w-full mb-3 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
            <Image
              src={entity.imageUrl}
              alt={entity.name}
              width={400}
              height={400}
              className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        {/* Delete button - top right corner */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!showDeleteConfirm ? (
            <button
              onClick={handleDeleteClick}
              className="p-2 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800 text-red-600 dark:text-red-400 transition-colors"
              title="Delete entity"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ) : (
            <div className="flex gap-1 bg-white dark:bg-neutral-800 rounded-lg p-1 shadow-lg border border-gray-200 dark:border-neutral-700">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteEntity.isPending}
                className="p-1.5 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
                title="Confirm delete"
              >
                {deleteEntity.isPending ? (
                  <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleDeleteCancel}
                disabled={deleteEntity.isPending}
                className="p-1.5 rounded bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50 transition-colors"
                title="Cancel delete"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{entity.name}</h3>
        {entity.summary && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{entity.summary}</p>}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Updated {formatDate(entity.updatedAt)}</p>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const EntityCard = memo(EntityCardComponent);
