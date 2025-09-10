'use client';
import * as React from 'react';
import { cn, typography } from '@/lib/component-utils';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  contentClassName?: string;
  delayDuration?: number;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ children, content, side = 'top', className, contentClassName, delayDuration = 400 }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout>();
    const tooltipId = React.useId();

    const showTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setOpen(true);
        setMounted(true);
      }, delayDuration);
    };

    const hideTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setOpen(false);
      // Keep mounted briefly for exit animation
      setTimeout(() => setMounted(false), 150);
    };

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const sideClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    };

    const arrowClasses = {
      top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-neutral-900 dark:border-t-neutral-100',
      right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-neutral-900 dark:border-r-neutral-100',
      bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-neutral-900 dark:border-b-neutral-100',
      left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-neutral-900 dark:border-l-neutral-100',
    };

    return (
      <div
        className={cn('relative inline-block', className)}
        ref={ref}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            hideTooltip();
          }
        }}
      >
        {React.cloneElement(children as React.ReactElement, {
          'aria-describedby': open ? tooltipId : undefined,
        })}
        
        {mounted && (
          <div
            id={tooltipId}
            role="tooltip"
            className={cn(
              'absolute z-tooltip px-3 py-2 rounded-md shadow-tooltip',
              'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900',
              typography.caption,
              'max-w-xs break-words',
              sideClasses[side],
              'transition-opacity duration-150',
              open ? 'opacity-100' : 'opacity-0',
              contentClassName
            )}
          >
            {content}
            <div
              className={cn(
                'absolute w-0 h-0 border-4',
                arrowClasses[side]
              )}
            />
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';