'use client';
import * as React from 'react';
import { cn } from '@/lib/component-utils';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Progress value between 0 and 100 */
  value: number;
  /** Progress bar size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant for the progress bar */
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /** Show percentage label */
  showLabel?: boolean;
  /** Animated progress transition */
  animated?: boolean;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantClasses = {
  primary: 'bg-brand-600',
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  error: 'bg-error-600',
};

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({
    value,
    size = 'md',
    variant = 'primary',
    showLabel = false,
    animated = true,
    className,
    ...props
  }, ref) => {
    // Clamp value between 0 and 100
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div className={cn('space-y-1', className)} ref={ref} {...props}>
        {showLabel && (
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Progress</span>
            <span className="font-medium">{Math.round(clampedValue)}%</span>
          </div>
        )}
        <div className={cn(
          'w-full bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden',
          sizeClasses[size]
        )}>
          <div
            className={cn(
              'h-full rounded-full',
              variantClasses[variant],
              animated && 'transition-all duration-300 ease-out'
            )}
            style={{ width: `${clampedValue}%` }}
            role="progressbar"
            aria-valuenow={clampedValue}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';