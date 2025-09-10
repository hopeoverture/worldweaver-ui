'use client';
import * as React from 'react';
import { cn, typography } from '@/lib/component-utils';

export interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, label, description, error, required, htmlFor, className, ...props }, ref) => {
    const fieldId = htmlFor || React.useId();
    const descriptionId = description ? `${fieldId}-description` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    // Clone children to add proper ARIA attributes
    const childrenWithProps = React.cloneElement(children as React.ReactElement, {
      id: fieldId,
      'aria-describedby': cn(descriptionId, errorId).trim() || undefined,
      'aria-invalid': error ? 'true' : undefined,
      required,
    });

    return (
      <div className={cn('space-y-2', className)} ref={ref} {...props}>
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              typography.label,
              'block',
              error && 'text-error-700 dark:text-error-400'
            )}
          >
            {label}
            {required && (
              <span className="ml-1 text-error-500" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        {description && (
          <p
            id={descriptionId}
            className={cn(typography.bodySmall, 'text-neutral-600 dark:text-neutral-400')}
          >
            {description}
          </p>
        )}
        
        {childrenWithProps}
        
        {error && (
          <p
            id={errorId}
            className={cn(
              typography.bodySmall,
              'text-error-600 dark:text-error-400'
            )}
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';