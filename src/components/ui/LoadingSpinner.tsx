'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
      <svg fill="none" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-5 bg-gray-300 dark:bg-neutral-700 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-20"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-3/4"></div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-neutral-800">
        <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded w-24"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 dark:bg-neutral-800 rounded w-16"></div>
          <div className="h-8 bg-gray-200 dark:bg-neutral-800 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}
