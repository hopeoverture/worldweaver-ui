'use client';

/**
 * Smart Grid component that automatically chooses between regular CSS Grid
 * and Virtual Grid based on the number of items to optimize performance
 */

import { ReactNode } from 'react';

interface SmartGridProps<T> {
  /** Array of items to render */
  items: T[];
  /** Render function for regular grid (receives all items) */
  renderRegular: (items: T[]) => ReactNode;
  /** Render function for virtual grid (receives all items) */
  renderVirtual: (items: T[]) => ReactNode;
  /** Threshold for switching to virtual scrolling (default: 100) */
  virtualThreshold?: number;
  /** Optional loading state */
  isLoading?: boolean;
  /** Optional empty state component */
  emptyState?: ReactNode;
}

/**
 * Performance thresholds for different content types
 * These are based on typical rendering performance considerations:
 * - Simple cards can handle more items
 * - Complex cards with animations need virtualization sooner
 */
export const VIRTUALIZATION_THRESHOLDS = {
  /** Simple content (text, basic styling) */
  simple: 200,
  /** Standard cards with moderate complexity */
  standard: 100,
  /** Complex cards with animations, images, interactions */
  complex: 50,
  /** Very complex components with heavy rendering */
  heavy: 25
} as const;

export function SmartGrid<T>({
  items,
  renderRegular,
  renderVirtual,
  virtualThreshold = VIRTUALIZATION_THRESHOLDS.standard,
  isLoading = false,
  emptyState
}: SmartGridProps<T>) {
  // Show loading state  
  if (isLoading && emptyState) {
    return <>{emptyState}</>;
  } else if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-gray-200 dark:border-neutral-700 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  // Choose rendering strategy based on item count
  const shouldUseVirtual = items.length > virtualThreshold;

  return shouldUseVirtual ? (
    <>{renderVirtual(items)}</>
  ) : (
    <>{renderRegular(items)}</>
  );
}

/**
 * Hook to determine if virtual scrolling should be used
 * Useful for conditional imports and component selection
 */
export function useVirtualScrolling(itemCount: number, threshold = VIRTUALIZATION_THRESHOLDS.standard) {
  return itemCount > threshold;
}