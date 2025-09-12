'use client';
import { WorldCard, WorldCardProps } from './WorldCard';
import { ResponsiveVirtualGrid } from '../ui/VirtualGrid';
import { EmptyState } from '../ui/EmptyState';

interface VirtualWorldGridProps {
  worlds: Omit<WorldCardProps, 'onEnter' | 'onEdit' | 'onArchive' | 'onDelete'>[];
  onEnterWorld: (id: string) => void;
  onEditWorld: (id: string) => void;
  onArchiveWorld?: (id: string) => void;
  onDeleteWorld?: (id: string) => void;
  onCreateWorld?: () => void;
  /** Height of each world card in pixels */
  itemHeight?: number;
  /** Minimum width for each world card */
  minItemWidth?: number;
  /** Maximum number of columns */
  maxColumns?: number;
  /** Container height (optional, defaults to viewport-based) */
  containerHeight?: number;
}

export function VirtualWorldGrid({ 
  worlds, 
  onEnterWorld, 
  onEditWorld, 
  onArchiveWorld, 
  onDeleteWorld, 
  onCreateWorld,
  itemHeight = 280,
  minItemWidth = 320,
  maxColumns = 4,
  containerHeight
}: VirtualWorldGridProps) {

  // Empty state
  const emptyState = (
    <EmptyState
      illustration="worlds"
      title="No worlds yet"
      description="Create your first world to start building amazing stories, characters, and locations. Your imagination is the only limit!"
      action={onCreateWorld ? {
        label: "Create Your First World",
        onClick: onCreateWorld
      } : undefined}
    />
  );

  const renderWorld = (world: Omit<WorldCardProps, 'onEnter' | 'onEdit' | 'onArchive' | 'onDelete'>, index: number) => (
    <div className="h-full w-full p-1">
      <WorldCard
        key={world.id}
        {...world}
        onEnter={onEnterWorld}
        onEdit={onEditWorld}
        onArchive={onArchiveWorld}
        onDelete={onDeleteWorld}
      />
    </div>
  );

  return (
    <ResponsiveVirtualGrid
      items={worlds}
      itemHeight={itemHeight}
      minItemWidth={minItemWidth}
      maxColumns={maxColumns}
      containerHeight={containerHeight}
      renderItem={renderWorld}
      emptyState={emptyState}
      gap={16}
      className="world-virtual-grid"
    />
  );
}