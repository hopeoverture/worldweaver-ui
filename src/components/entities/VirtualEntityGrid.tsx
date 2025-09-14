'use client';
import { useState } from 'react';
import { Entity } from '@/lib/types';
import { EntityCard } from './EntityCard';
import { EntityDetailModal } from './EntityDetailModal';
import { ResponsiveVirtualGrid } from '../ui/VirtualGrid';

interface VirtualEntityGridProps {
  entities: Entity[];
  onCreateEntity?: () => void;
  onDragStart?: (entity: Entity) => void;
  /** Height of each entity card in pixels */
  itemHeight?: number;
  /** Minimum width for each entity card */
  minItemWidth?: number;
  /** Maximum number of columns */
  maxColumns?: number;
  /** Container height (optional, defaults to viewport-based) */
  containerHeight?: number;
}

export function VirtualEntityGrid({
  entities,
  onCreateEntity,
  onDragStart,
  itemHeight = 280,
  minItemWidth = 280,
  maxColumns = 4,
  containerHeight
}: VirtualEntityGridProps) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  // Empty state when no create handler is provided
  if (entities.length === 0 && !onCreateEntity) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No entities in this folder.</p>
      </div>
    );
  }

  // Empty state with create button
  const emptyState = onCreateEntity ? (
    <div className="text-center py-12 bg-gray-50 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-neutral-700">
      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No entities yet</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Create your first entity to get started organizing your world.
      </p>
      <button
        onClick={onCreateEntity}
        className="group inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <svg className="h-4 w-4 mr-2 relative z-10 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="relative z-10">Create Your First Entity</span>
      </button>
    </div>
  ) : undefined;

  const renderEntity = (entity: Entity, index: number) => (
    <div className="h-full w-full p-1">
      <EntityCard
        key={entity.id}
        entity={entity}
        onClick={() => setSelectedEntity(entity)}
        onDragStart={onDragStart}
      />
    </div>
  );

  return (
    <>
      <ResponsiveVirtualGrid
        items={entities}
        itemHeight={itemHeight}
        minItemWidth={minItemWidth}
        maxColumns={maxColumns}
        containerHeight={containerHeight}
        renderItem={renderEntity}
        emptyState={emptyState}
        gap={16}
        className="entity-virtual-grid"
      />
      
      {selectedEntity && (
        <EntityDetailModal
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
        />
      )}
    </>
  );
}