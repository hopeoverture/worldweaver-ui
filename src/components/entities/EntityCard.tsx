'use client';
import { memo } from 'react';
import { Entity } from '@/lib/types';
import { formatDate } from '@/lib/utils';

/**
 * EntityCard component for displaying entity information
 * @param entity - The entity data to display
 * @param onClick - Optional click handler
 */
interface EntityCardProps {
  /** The entity data to display */
  entity: Entity;
  /** Optional click handler for card interaction */
  onClick?: () => void;
}

function EntityCardComponent({ entity, onClick }: EntityCardProps) {
  return (
    <div 
      data-testid="entity-card" 
      className="group relative rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card hover:shadow-xl transition-all duration-300 p-6 hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      {/* Gradient overlay for visual interest */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{entity.name}</h3>
        {entity.summary && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{entity.summary}</p>}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Updated {formatDate(entity.updatedAt)}</p>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const EntityCard = memo(EntityCardComponent);
