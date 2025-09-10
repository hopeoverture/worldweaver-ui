'use client';
import * as React from 'react';
import { cn, inputVariants, focusRing, disabledStyles, transitions } from '@/lib/component-utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', size = 'md', type = 'text', ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    return (
      <input
        type={type}
        className={cn(
          inputVariants[variant],
          sizeClasses[size],
          transitions.default,
          disabledStyles,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
