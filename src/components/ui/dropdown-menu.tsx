'use client';

import * as React from 'react';
import { cn } from '@/lib/component-utils';

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export const DropdownMenu = ({ children }: DropdownMenuProps) => {
  return <div className="relative inline-block text-left">{children}</div>;
};

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const DropdownMenuTrigger = React.forwardRef<HTMLElement, DropdownMenuTriggerProps>(
  ({ children, asChild = false }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const triggerProps = {
      onClick: () => setIsOpen(!isOpen),
      'aria-expanded': isOpen,
      'aria-haspopup': true,
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, triggerProps);
    }

    return (
      <button ref={ref as React.RefObject<HTMLButtonElement>} {...triggerProps}>
        {children}
      </button>
    );
  }
);

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
}

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = 'center', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        align === 'end' && "right-0",
        align === 'start' && "left-0",
        align === 'center' && "left-1/2 -translate-x-1/2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

export interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  )
);

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';
DropdownMenuContent.displayName = 'DropdownMenuContent';
DropdownMenuItem.displayName = 'DropdownMenuItem';