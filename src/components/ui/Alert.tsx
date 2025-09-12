'use client';
import * as React from 'react';
import { cn, alertVariants, typography } from '@/lib/component-utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
  title?: string;
  icon?: React.ReactNode;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, icon, children, ...props }, ref) => {
    const iconColors = {
      default: 'text-neutral-600 dark:text-neutral-400',
      info: 'text-info-600 dark:text-info-400',
      success: 'text-success-600 dark:text-success-400',
      warning: 'text-warning-600 dark:text-warning-400',
      error: 'text-error-600 dark:text-error-400',
    };

    const titleColors = {
      default: 'text-neutral-900 dark:text-neutral-100',
      info: 'text-info-900 dark:text-info-100',
      success: 'text-success-900 dark:text-success-100',
      warning: 'text-warning-900 dark:text-warning-100',
      error: 'text-error-900 dark:text-error-100',
    };

    const contentColors = {
      default: 'text-neutral-700 dark:text-neutral-300',
      info: 'text-info-700 dark:text-info-300',
      success: 'text-success-700 dark:text-success-300',
      warning: 'text-warning-700 dark:text-warning-300',
      error: 'text-error-700 dark:text-error-300',
    };

    return (
      <div
        className={cn(alertVariants[variant], className)}
        role="alert"
        ref={ref}
        {...props}
      >
        <div className="flex gap-3">
          {icon && (
            <div className={cn('flex-shrink-0 mt-0.5', iconColors[variant])}>
              {icon}
            </div>
          )}
          
          <div className="flex-1">
            {title && (
              <h4 className={cn(typography.h6, titleColors[variant], 'mb-2')}>
                {title}
              </h4>
            )}
            
            <div className={cn(typography.bodySmall, contentColors[variant])}>
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';