/**
 * TemplateCard skeleton component
 * Matches the layout and structure of TemplateCard for consistent loading states
 */

import { SkeletonCard, SkeletonText, SkeletonIcon, Skeleton, SkeletonButton } from '../ui/Skeleton';

interface TemplateCardSkeletonProps {
  /** Use shimmer animation instead of pulse */
  shimmer?: boolean;
  /** Additional className */
  className?: string;
  /** Animation delay for staggered loading */
  delay?: number;
}

export function TemplateCardSkeleton({ 
  shimmer = false, 
  className = '',
  delay = 0 
}: TemplateCardSkeletonProps) {
  return (
    <SkeletonCard 
      className={`h-56 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header with icon and title */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800">
            <SkeletonIcon size="md" shimmer={shimmer} />
          </div>
          <div className="flex-1">
            <Skeleton 
              height="1.25rem" 
              width="85%" 
              animate={!shimmer}
              className={shimmer ? 'shimmer' : ''}
            />
          </div>
        </div>
        
        {/* Menu button */}
        <div className="p-1">
          <SkeletonIcon size="sm" shimmer={shimmer} />
        </div>
      </div>

      {/* System/World badge */}
      <div className="mb-3">
        <Skeleton 
          height="1.5rem" 
          width="70px" 
          rounded="full"
          animate={!shimmer}
          className={shimmer ? 'shimmer' : ''}
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <SkeletonText 
          lines={2} 
          lastLineWidth="75%" 
          shimmer={shimmer}
        />
      </div>

      {/* Fields count */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <SkeletonIcon size="sm" shimmer={shimmer} />
          <Skeleton 
            height="1rem" 
            width="60px" 
            animate={!shimmer}
            className={shimmer ? 'shimmer' : ''}
          />
        </div>
      </div>

      {/* Footer with actions */}
      <div className="mt-auto pt-2 flex items-center justify-between">
        {/* Last updated */}
        <Skeleton 
          height="0.875rem" 
          width="80px" 
          animate={!shimmer}
          className={shimmer ? 'shimmer' : ''}
        />
        
        {/* Action buttons */}
        <div className="flex gap-1">
          <div className="w-6 h-6 rounded bg-gray-200 dark:bg-neutral-700 animate-pulse"></div>
          <div className="w-6 h-6 rounded bg-gray-200 dark:bg-neutral-700 animate-pulse"></div>
        </div>
      </div>
    </SkeletonCard>
  );
}

/**
 * Grid of TemplateCard skeletons
 */
interface TemplateGridSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Use shimmer animation */
  shimmer?: boolean;
  /** Stagger animation delays for more natural loading */
  stagger?: boolean;
}

export function TemplateGridSkeleton({ 
  count = 6, 
  shimmer = false,
  stagger = true 
}: TemplateGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <TemplateCardSkeleton
          key={i}
          shimmer={shimmer}
          delay={stagger ? i * 120 : 0}
          className={stagger ? 'animate-pulse' : ''}
        />
      ))}
    </div>
  );
}