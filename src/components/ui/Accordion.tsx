'use client';
import * as React from 'react';
import { cn, transitions, focusRing, typography } from '@/lib/component-utils';

// Context for managing accordion state
interface AccordionContextValue {
  type: 'single' | 'multiple';
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

// Root Accordion component
export interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ children, type = 'single', defaultValue, value, onValueChange, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | string[]>(
      defaultValue || (type === 'multiple' ? [] : '')
    );

    const currentValue = value !== undefined ? value : internalValue;
    const handleValueChange = onValueChange || setInternalValue;

    const contextValue: AccordionContextValue = {
      type,
      value: currentValue,
      onValueChange: handleValueChange,
    };

    return (
      <AccordionContext.Provider value={contextValue}>
        <div className={cn('space-y-2', className)} ref={ref} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);

// Individual accordion item
export interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ children, value, className, disabled = false, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    if (!context) {
      throw new Error('AccordionItem must be used within an Accordion');
    }

    const isOpen = React.useMemo(() => {
      if (context.type === 'multiple') {
        return (context.value as string[]).includes(value);
      }
      return context.value === value;
    }, [context.value, context.type, value]);

    const toggle = () => {
      if (disabled) return;

      if (context.type === 'multiple') {
        const currentValues = context.value as string[];
        const newValues = isOpen
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
        context.onValueChange(newValues);
      } else {
        context.onValueChange(isOpen ? '' : value);
      }
    };

    const itemContextValue = {
      value,
      isOpen,
      toggle,
      disabled,
    };

    return (
      <AccordionItemContext.Provider value={itemContextValue}>
        <div
          className={cn(
            'border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden',
            disabled && 'opacity-50',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);

// Context for individual accordion items
interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  toggle: () => void;
  disabled: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

// Accordion trigger (header)
export interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ children, className, ...props }, ref) => {
    const context = React.useContext(AccordionItemContext);
    if (!context) {
      throw new Error('AccordionTrigger must be used within an AccordionItem');
    }

    return (
      <button
        className={cn(
          'flex w-full items-center justify-between p-4 text-left',
          'bg-neutral-50 dark:bg-neutral-800/50',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
          transitions.default,
          focusRing.default,
          typography.label,
          context.disabled && 'cursor-not-allowed',
          className
        )}
        onClick={context.toggle}
        disabled={context.disabled}
        aria-expanded={context.isOpen}
        ref={ref}
        {...props}
      >
        <span>{children}</span>
        <svg
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            context.isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    );
  }
);

// Accordion content
export interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ children, className, ...props }, ref) => {
    const context = React.useContext(AccordionItemContext);
    if (!context) {
      throw new Error('AccordionContent must be used within an AccordionItem');
    }

    return (
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          context.isOpen ? 'animate-[slide-down_0.2s_ease-out]' : 'animate-[slide-up_0.2s_ease-out]'
        )}
        style={{
          display: context.isOpen ? 'block' : 'none',
        }}
      >
        <div
          className={cn('p-4 pt-0', typography.body, className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);

// Set display names
Accordion.displayName = 'Accordion';
AccordionItem.displayName = 'AccordionItem';
AccordionTrigger.displayName = 'AccordionTrigger';
AccordionContent.displayName = 'AccordionContent';