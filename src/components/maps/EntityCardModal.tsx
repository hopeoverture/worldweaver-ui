"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useEntityPreview, EntityPreview } from '@/hooks/query/useEntityPreview';
import { useToast } from '@/components/ui/ToastProvider';
import { Eye, ExternalLink, User, FileText, Tag, AlertCircle } from 'lucide-react';

interface EntityCardModalProps {
  entityId: string | null;
  worldId: string;
  onClose: () => void;
}

export function EntityCardModal({ entityId, worldId, onClose }: EntityCardModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: entity, isLoading, error } = useEntityPreview(entityId);

  const handleViewEntity = () => {
    if (!entity) return;

    // Navigate to the world page with the entity selected
    router.push(`/world/${worldId}?entity=${entity.id}`);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  // Don't render if no entity ID
  if (!entityId) return null;

  return (
    <Modal
      open={!!entityId}
      onClose={handleClose}
      title={entity?.name || 'Entity Preview'}
    >
      <div className="space-y-4">
        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {error.message.includes('access denied') || error.message.includes('not found')
                ? 'Access Restricted'
                : 'Unable to Load Entity'
              }
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error.message.includes('access denied') || error.message.includes('not found')
                ? 'You don\'t have permission to view this entity, or it may have been deleted.'
                : 'There was a problem loading the entity data. Please try again.'
              }
            </p>
            <Button variant="outline" onClick={handleClose} size="sm">
              Close
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {entity && !error && (
          <>
            {/* Cover Image */}
            {entity.coverImageUrl && (
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={entity.coverImageUrl}
                  alt={`Cover image for ${entity.name}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Hide broken images gracefully
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Entity Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  {entity.name}
                </h2>
                {entity.templateName && (
                  <Badge variant="outline" className="shrink-0">
                    <User className="h-3 w-3 mr-1" />
                    {entity.templateName}
                  </Badge>
                )}
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FileText className="h-4 w-4" />
                  Summary
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {entity.summary || 'No summary available for this entity.'}
                </p>
              </div>

              {/* Tags */}
              {entity.tags && entity.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Tag className="h-4 w-4" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {entity.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Footer - Only show if entity loaded successfully */}
      {entity && !error && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleClose}
            size="sm"
          >
            Close
          </Button>
          <Button
            onClick={handleViewEntity}
            size="sm"
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View Entity
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      )}
    </Modal>
  );
}

/**
 * Lightweight version for quick previews
 */
export function EntityCardModalCompact({ entityId, worldId, onClose }: EntityCardModalProps) {
  const router = useRouter();
  const { data: entity, isLoading, error } = useEntityPreview(entityId);

  const handleViewEntity = () => {
    if (!entity) return;
    router.push(`/world/${worldId}?entity=${entity.id}`);
    onClose();
  };

  if (!entityId) return null;

  return (
    <Modal
      open={!!entityId}
      onClose={onClose}
      title="Quick Preview"
    >
      <div className="space-y-3">
        {error && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error.message.includes('access denied') || error.message.includes('not found')
                ? 'Unable to access this entity'
                : 'Failed to load entity data'
              }
            </p>
          </div>
        )}

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}

        {entity && !error && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {entity.name}
            </h3>
            {entity.templateName && (
              <Badge variant="outline" className="text-xs">
                {entity.templateName}
              </Badge>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
              {entity.summary || 'No summary available.'}
            </p>
          </div>
        )}

        {entity && !error && (
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} size="sm">
              Close
            </Button>
            <Button onClick={handleViewEntity} size="sm">
              View
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}