/**
 * EntityCard skeleton component
 * Matches the layout and structure of EntityCard for consistent loading states
 */

import { SkeletonCard, SkeletonText, SkeletonIcon, Skeleton } from '../ui/Skeleton';

interface EntityCardSkeletonProps {
  /** Use shimmer animation instead of pulse */
  shimmer?: boolean;
  /** Additional className */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export function EntityCardSkeleton({ shimmer = false, className = '', style }: EntityCardSkeletonProps) {
  return (
    <SkeletonCard className={`h-48 ${className}`} style={style}>
      {/* Header with icon and title */}
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800">
          <SkeletonIcon size="md" shimmer={shimmer} />
        </div>
        <div className="flex-1">
          <Skeleton 
            height="1.25rem" 
            width="80%" 
            animate={!shimmer}
            className={shimmer ? 'shimmer' : ''}
          />
        </div>
      </div>

      {/* Template info */}
      <div className="mb-4">
        <Skeleton 
          height="1rem" 
          width="60%" 
          animate={!shimmer}
          className={shimmer ? 'shimmer' : ''}
        />
      </div>

      {/* Description text */}
      <div className="mb-4">
        <SkeletonText 
          lines={2} 
          lastLineWidth="65%" 
          shimmer={shimmer}
        />
      </div>

      {/* Footer with timestamp */}
      <div className="mt-auto pt-2">
        <Skeleton 
          height="0.875rem" 
          width="45%" 
          animate={!shimmer}
          className={shimmer ? 'shimmer' : ''}
        />
      </div>
    </SkeletonCard>
  );
}

/**
 * Grid of EntityCard skeletons
 */
interface EntityGridSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Use shimmer animation */
  shimmer?: boolean;
  /** Stagger animation delays for more natural loading */
  stagger?: boolean;
}

export function EntityGridSkeleton({ 
  count = 8, 
  shimmer = false,
  stagger = true 
}: EntityGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <EntityCardSkeleton
          key={i}
          shimmer={shimmer}
          className={stagger ? 'animate-pulse' : ''}
          style={stagger ? { animationDelay: `${i * 100}ms` } : undefined}
        />
      ))}
    </div>
  );
}