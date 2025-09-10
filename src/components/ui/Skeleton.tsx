/**
 * Skeleton loading components for better perceived performance
 * Provides visual placeholders while content is loading
 */

import { ReactNode } from 'react';

/**
 * Base skeleton component with shimmer animation
 */
interface SkeletonProps {
  /** Width of the skeleton (CSS value) */
  width?: string;
  /** Height of the skeleton (CSS value) */
  height?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the shimmer animation */
  animate?: boolean;
  /** Border radius style */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Skeleton({ 
  width = '100%', 
  height = '1rem', 
  className = '', 
  animate = true,
  rounded = 'md'
}: SkeletonProps) {
  const roundedClass = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  }[rounded];

  return (
    <div
      className={`bg-gray-200 dark:bg-neutral-700 ${roundedClass} ${
        animate ? 'animate-pulse' : ''
      } ${className}`}
      style={{ width, height }}
    />
  );
}

/**
 * Skeleton with shimmer wave effect for more sophisticated loading states
 */
export function SkeletonShimmer({ 
  width = '100%', 
  height = '1rem', 
  className = '', 
  rounded = 'md'
}: Omit<SkeletonProps, 'animate'>) {
  const roundedClass = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  }[rounded];

  return (
    <div
      className={`relative overflow-hidden bg-gray-200 dark:bg-neutral-700 ${roundedClass} ${className}`}
      style={{ width, height }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-100/60 dark:via-neutral-600/60 to-transparent" />
    </div>
  );
}

/**
 * Text skeleton with multiple lines
 */
interface SkeletonTextProps {
  /** Number of lines */
  lines?: number;
  /** Width of the last line (percentage or CSS value) */
  lastLineWidth?: string;
  /** Space between lines */
  lineHeight?: string;
  /** Use shimmer animation */
  shimmer?: boolean;
}

export function SkeletonText({ 
  lines = 1, 
  lastLineWidth = '75%', 
  lineHeight = '1.25rem',
  shimmer = false 
}: SkeletonTextProps) {
  const SkeletonComponent = shimmer ? SkeletonShimmer : Skeleton;
  
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonComponent
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * Avatar skeleton
 */
interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shimmer?: boolean;
}

export function SkeletonAvatar({ size = 'md', shimmer = false }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const SkeletonComponent = shimmer ? SkeletonShimmer : Skeleton;

  return (
    <SkeletonComponent
      className={sizeClasses[size]}
      rounded="full"
    />
  );
}

/**
 * Card skeleton container
 */
interface SkeletonCardProps {
  children: ReactNode;
  /** Card padding */
  padding?: 'sm' | 'md' | 'lg';
  /** Show border */
  bordered?: boolean;
  /** Additional className */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export function SkeletonCard({ 
  children, 
  padding = 'md', 
  bordered = true,
  className = '',
  style
}: SkeletonCardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div 
      className={`
        rounded-xl 
        bg-white dark:bg-neutral-900 
        ${bordered ? 'border border-gray-200 dark:border-neutral-800' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
}

/**
 * Button skeleton
 */
interface SkeletonButtonProps {
  size?: 'sm' | 'md' | 'lg';
  width?: string;
  shimmer?: boolean;
}

export function SkeletonButton({ 
  size = 'md', 
  width = 'auto',
  shimmer = false 
}: SkeletonButtonProps) {
  const sizeClasses = {
    sm: 'h-8 px-3',
    md: 'h-10 px-4', 
    lg: 'h-12 px-6'
  };

  const SkeletonComponent = shimmer ? SkeletonShimmer : Skeleton;

  return (
    <SkeletonComponent
      className={`${sizeClasses[size]} inline-block`}
      width={width}
      rounded="md"
    />
  );
}

/**
 * Icon skeleton
 */
interface SkeletonIconProps {
  size?: 'sm' | 'md' | 'lg';
  shimmer?: boolean;
}

export function SkeletonIcon({ size = 'md', shimmer = false }: SkeletonIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const SkeletonComponent = shimmer ? SkeletonShimmer : Skeleton;

  return (
    <SkeletonComponent
      className={sizeClasses[size]}
      rounded="sm"
    />
  );
}

/**
 * Grid skeleton for loading multiple cards
 */
interface SkeletonGridProps {
  /** Number of skeleton items to show */
  count?: number;
  /** Grid columns (responsive) */
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Render function for each skeleton item */
  renderItem?: (index: number) => ReactNode;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
}

export function SkeletonGrid({ 
  count = 6, 
  columns = { default: 1, sm: 2, lg: 3, xl: 4 },
  renderItem,
  gap = 'md'
}: SkeletonGridProps) {
  const { default: defaultCols, sm, md, lg, xl } = columns;
  
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4', 
    lg: 'gap-6'
  };

  const gridCols = [
    `grid-cols-${defaultCols}`,
    sm && `sm:grid-cols-${sm}`,
    md && `md:grid-cols-${md}`, 
    lg && `lg:grid-cols-${lg}`,
    xl && `xl:grid-cols-${xl}`
  ].filter(Boolean).join(' ');

  return (
    <div className={`grid ${gridCols} ${gapClasses[gap]}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          {renderItem ? renderItem(i) : <Skeleton height="200px" />}
        </div>
      ))}
    </div>
  );
}