'use client';
import { WorldCard, WorldCardProps } from './WorldCard';
import { EmptyState } from '../ui/EmptyState';

interface WorldGridProps {
  worlds: Omit<WorldCardProps, 'onEnter' | 'onEdit' | 'onArchive' | 'onDelete'>[];
  onEnterWorld: (id: string) => void;
  onEditWorld: (id: string) => void;
  onArchiveWorld?: (id: string) => void;
  onDeleteWorld?: (id: string) => void;
  onCreateWorld?: () => void;
}

export function WorldGrid({ worlds, onEnterWorld, onEditWorld, onArchiveWorld, onDeleteWorld, onCreateWorld }: WorldGridProps) {
  if (worlds.length === 0) {
    return (
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
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {worlds.map(world => (
        <WorldCard
          key={world.id}
          {...world}
          onEnter={onEnterWorld}
          onEdit={onEditWorld}
          onArchive={onArchiveWorld}
          onDelete={onDeleteWorld}
        />
      ))}
    </div>
  );
}
