'use client';
import * as React from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  glow?: 'blue' | 'pink' | 'purple' | 'green' | 'amber';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, glow, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95';
    
    const variantClasses = {
      primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow-md focus:ring-brand-600',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 shadow-sm hover:shadow-md focus:ring-gray-500 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-gray-100',
      outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm hover:shadow-md focus:ring-brand-600 dark:border-neutral-700 dark:hover:bg-neutral-800 dark:text-gray-300',
      ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-brand-600 dark:hover:bg-neutral-800 dark:text-gray-300'
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const glowClass = glow ? `btn-neon-${glow}` : undefined;

    return (
      <button
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          glowClass,
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
