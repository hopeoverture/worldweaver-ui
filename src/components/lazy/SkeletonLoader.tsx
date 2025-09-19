/**
 * Enhanced loading component with skeleton states for different content types
 * Provides more specific loading experiences than the generic LazyComponentLoader
 */

import { EntityGridSkeleton } from '../entities/EntityCardSkeleton';
import { WorldGridSkeleton } from '../worlds/WorldCardSkeleton';
import { TemplateGridSkeleton } from '../templates/TemplateCardSkeleton';
import { FolderGridSkeleton } from '../folders/FolderCardSkeleton';
import { SkeletonCard, SkeletonText, Skeleton } from '../ui/Skeleton';

export type SkeletonType =
  | 'entities'
  | 'worlds'
  | 'templates'
  | 'folders'
  | 'membership'
  | 'relationships'
  | 'maps'
  | 'generic';

interface SkeletonLoaderProps {
  /** Type of content being loaded */
  type: SkeletonType;
  /** Number of skeleton items to show */
  count?: number;
  /** Optional loading message */
  message?: string;
  /** Minimum height to prevent layout shift */
  minHeight?: string;
  /** Use shimmer animation instead of pulse */
  shimmer?: boolean;
  /** Show staggered animation */
  stagger?: boolean;
}

export function SkeletonLoader({
  type,
  count,
  message,
  minHeight = "200px",
  shimmer = false,
  stagger = true
}: SkeletonLoaderProps) {
  const renderSkeletonContent = () => {
    switch (type) {
      case 'entities':
        return (
          <EntityGridSkeleton 
            count={count || 8} 
            shimmer={shimmer} 
            stagger={stagger}
          />
        );
      
      case 'worlds':
        return (
          <WorldGridSkeleton 
            count={count || 6} 
            shimmer={shimmer} 
            stagger={stagger}
          />
        );
      
      case 'templates':
        return (
          <TemplateGridSkeleton 
            count={count || 6} 
            shimmer={shimmer} 
            stagger={stagger}
          />
        );
      
      case 'folders':
        return (
          <FolderGridSkeleton 
            count={count || 4} 
            shimmer={shimmer} 
            stagger={stagger}
          />
        );
      
      case 'membership':
        return <MembershipSkeleton shimmer={shimmer} />;
      
      case 'relationships':
        return <RelationshipsSkeleton shimmer={shimmer} />;

      case 'maps':
        return <MapsSkeleton shimmer={shimmer} />;

      default:
        return <GenericSkeleton count={count || 6} shimmer={shimmer} />;
    }
  };

  return (
    <div 
      className="w-full"
      style={{ minHeight }}
    >
      {message && (
        <div className="flex items-center justify-center mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {message}
          </p>
        </div>
      )}
      
      {renderSkeletonContent()}
    </div>
  );
}

/**
 * Membership tab skeleton
 */
function MembershipSkeleton({ shimmer = false }: { shimmer?: boolean }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton height="1.5rem" width="150px" animate={!shimmer} />
        <Skeleton height="2.5rem" width="120px" animate={!shimmer} />
      </div>
      
      {/* Member list */}
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} className="p-4">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 animate-pulse" />
              
              {/* Info */}
              <div className="flex-1">
                <Skeleton height="1rem" width="120px" animate={!shimmer} className="mb-1" />
                <Skeleton height="0.875rem" width="80px" animate={!shimmer} />
              </div>
              
              {/* Role badge */}
              <Skeleton height="1.5rem" width="60px" rounded="full" animate={!shimmer} />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

/**
 * Relationships skeleton
 */
function RelationshipsSkeleton({ shimmer = false }: { shimmer?: boolean }) {
  return (
    <div className="space-y-6">
      {/* Graph placeholder */}
      <SkeletonCard className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-neutral-700 animate-pulse mx-auto mb-3" />
          <Skeleton height="1rem" width="150px" animate={!shimmer} />
        </div>
      </SkeletonCard>
      
      {/* Table skeleton */}
      <div className="space-y-3">
        <Skeleton height="1.25rem" width="120px" animate={!shimmer} />
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 border border-gray-200 dark:border-neutral-800 rounded-lg">
            <Skeleton height="1rem" width="100px" animate={!shimmer} />
            <Skeleton height="1rem" width="80px" animate={!shimmer} />
            <Skeleton height="1rem" width="100px" animate={!shimmer} />
            <div className="ml-auto">
              <Skeleton height="1rem" width="60px" animate={!shimmer} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Maps skeleton
 */
function MapsSkeleton({ shimmer = false }: { shimmer?: boolean }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton height="2rem" width="120px" animate={!shimmer} className="mb-2" />
          <Skeleton height="1rem" width="250px" animate={!shimmer} />
        </div>
        <Skeleton height="2.5rem" width="140px" animate={!shimmer} />
      </div>

      {/* Maps grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonCard key={i} className="overflow-hidden">
            {/* Map image */}
            <div className="aspect-video bg-gray-200 dark:bg-neutral-700 animate-pulse" />

            {/* Map info */}
            <div className="p-4 space-y-2">
              <Skeleton height="1.25rem" width="80%" animate={!shimmer} />
              <Skeleton height="0.875rem" width="60%" animate={!shimmer} />
              <div className="flex justify-between items-center pt-2">
                <Skeleton height="0.75rem" width="60px" animate={!shimmer} />
                <Skeleton height="0.75rem" width="40px" animate={!shimmer} />
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

/**
 * Generic skeleton for unknown content types
 */
function GenericSkeleton({ count = 6, shimmer = false }: { count?: number; shimmer?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} className="h-48">
          <div className="space-y-3">
            <Skeleton height="1.5rem" width="80%" animate={!shimmer} />
            <SkeletonText lines={3} shimmer={shimmer} />
            <div className="pt-4">
              <Skeleton height="1rem" width="60%" animate={!shimmer} />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}