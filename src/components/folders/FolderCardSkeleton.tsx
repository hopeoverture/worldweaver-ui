/**
 * FolderCard skeleton component
 * Matches the layout and structure of FolderCard for consistent loading states
 */

import { SkeletonCard, SkeletonText, SkeletonIcon, Skeleton } from '../ui/Skeleton';

interface FolderCardSkeletonProps {
  /** Use shimmer animation instead of pulse */
  shimmer?: boolean;
  /** Additional className */
  className?: string;
  /** Animation delay for staggered loading */
  delay?: number;
}

export function FolderCardSkeleton({ 
  shimmer = false, 
  className = '',
  delay = 0 
}: FolderCardSkeletonProps) {
  return (
    <SkeletonCard 
      className={`h-32 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Main content */}
      <div className="flex items-center gap-3 mb-2">
        {/* Folder icon */}
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800">
          <SkeletonIcon size="md" shimmer={shimmer} />
        </div>
        
        {/* Folder name and count */}
        <div className="flex-1">
          <Skeleton 
            height="1.125rem" 
            width="70%" 
            animate={!shimmer}
            className={`mb-1 ${shimmer ? 'shimmer' : ''}`}
          />
          <Skeleton 
            height="0.875rem" 
            width="50%" 
            animate={!shimmer}
            className={shimmer ? 'shimmer' : ''}
          />
        </div>
      </div>

      {/* Description (optional) */}
      <div className="mt-2">
        <SkeletonText 
          lines={1} 
          lastLineWidth="80%" 
          shimmer={shimmer}
          lineHeight="1rem"
        />
      </div>
    </SkeletonCard>
  );
}

/**
 * Grid of FolderCard skeletons
 */
interface FolderGridSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Use shimmer animation */
  shimmer?: boolean;
  /** Stagger animation delays for more natural loading */
  stagger?: boolean;
}

export function FolderGridSkeleton({ 
  count = 4, 
  shimmer = false,
  stagger = true 
}: FolderGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <FolderCardSkeleton
          key={i}
          shimmer={shimmer}
          delay={stagger ? i * 100 : 0}
          className={stagger ? 'animate-pulse' : ''}
        />
      ))}
    </div>
  );
}