'use client';
import * as React from 'react';
import { cn, cardVariants, transitions, hoverEffects } from '@/lib/component-utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'outline';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, padding = 'md', children, ...props }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const isInteractive = variant === 'interactive' || hover;
    
    return (
      <div
        className={cn(
          cardVariants[variant],
          paddingClasses[padding],
          isInteractive && cn(
            'group relative cursor-pointer',
            transitions.all,
            hoverEffects.lift
          ),
          className
        )}
        ref={ref}
        {...props}
      >
        {isInteractive && (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-50/50 to-transparent dark:from-neutral-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
        <div className={isInteractive ? 'relative' : undefined}>
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';
