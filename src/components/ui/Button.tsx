'use client';
import * as React from 'react';
import { cn, buttonVariants, sizeVariants, focusRing, disabledStyles, loadingStyles, transitions } from '@/lib/component-utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button';
    
    const baseClasses = cn(
      'inline-flex items-center justify-center gap-2 font-medium',
      'rounded-md', // Using design token
      transitions.default,
      focusRing.default,
      disabledStyles,
      loadingStyles,
      'active:scale-95 transform'
    );
    
    const variantClass = buttonVariants[variant];
    const sizeClass = cn(
      sizeVariants[size].padding,
      sizeVariants[size].fontSize
    );

    return (
      <Comp
        className={cn(
          baseClasses,
          variantClass,
          sizeClass,
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        data-loading={loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg 
            className="animate-spin h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" 
            />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
