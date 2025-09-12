'use client';
import { World } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface WorldContextBarProps {
  world: World;
}

export function WorldContextBar({ world }: WorldContextBarProps) {
  return (
    <div className="bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
      <div className="container py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{world.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {world.entityCount} entities • Last updated {formatDate(world.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
