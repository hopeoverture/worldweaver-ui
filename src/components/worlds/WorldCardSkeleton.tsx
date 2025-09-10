/**
 * WorldCard skeleton component
 * Matches the complex layout and structure of WorldCard for consistent loading states
 */

import { SkeletonCard, SkeletonText, SkeletonButton, Skeleton, SkeletonIcon } from '../ui/Skeleton';

interface WorldCardSkeletonProps {
  /** Use shimmer animation instead of pulse */
  shimmer?: boolean;
  /** Additional className */
  className?: string;
  /** Animation delay for staggered loading */
  delay?: number;
}

export function WorldCardSkeleton({ 
  shimmer = false, 
  className = '',
  delay = 0 
}: WorldCardSkeletonProps) {
  return (
    <SkeletonCard 
      className={`h-72 relative overflow-hidden ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          {/* Title */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton 
              height="1.5rem" 
              width="70%" 
              animate={!shimmer}
              className={shimmer ? 'shimmer' : ''}
            />
          </div>
          
          {/* Entity count badge */}
          <div className="flex items-center gap-2">
            <Skeleton 
              height="1.75rem" 
              width="80px" 
              rounded="full"
              animate={!shimmer}
              className={shimmer ? 'shimmer' : ''}
            />
          </div>
        </div>
        
        {/* Menu button */}
        <div className="p-1.5 rounded-md">
          <SkeletonIcon size="sm" shimmer={shimmer} />
        </div>
      </div>

      {/* Summary/Description */}
      <div className="mb-4">
        <SkeletonText 
          lines={3} 
          lastLineWidth="60%" 
          shimmer={shimmer}
        />
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-neutral-800">
          {/* Last updated */}
          <Skeleton 
            height="0.75rem" 
            width="100px" 
            animate={!shimmer}
            className={shimmer ? 'shimmer' : ''}
          />
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <SkeletonButton size="sm" width="60px" shimmer={shimmer} />
            <SkeletonButton size="sm" width="70px" shimmer={shimmer} />
          </div>
        </div>
      </div>
      
      {/* Decorative elements (optional) */}
      {shimmer && (
        <div className="absolute top-4 right-4 opacity-30">
          <div className="w-2 h-2 bg-gray-300 dark:bg-neutral-600 rounded-full"></div>
        </div>
      )}
    </SkeletonCard>
  );
}

/**
 * Grid of WorldCard skeletons
 */
interface WorldGridSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Use shimmer animation */
  shimmer?: boolean;
  /** Stagger animation delays for more natural loading */
  stagger?: boolean;
}

export function WorldGridSkeleton({ 
  count = 6, 
  shimmer = false,
  stagger = true 
}: WorldGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <WorldCardSkeleton
          key={i}
          shimmer={shimmer}
          delay={stagger ? i * 150 : 0}
          className={stagger ? 'animate-pulse' : ''}
        />
      ))}
    </div>
  );
}