'use client';
import * as React from 'react';

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean;
    interactive?: boolean;
  }
>(({ className, hover = false, interactive = false, ...props }, ref) => {
  const baseClasses = "rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card p-6";
  const hoverClasses = hover || interactive ? "group relative hover:shadow-xl transition-all duration-300 hover:-translate-y-1" : "";
  const interactiveClasses = interactive ? "cursor-pointer" : "";
  
  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${interactiveClasses} ${className || ''}`}
      ref={ref}
      {...props}
    >
      {(hover || interactive) && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent dark:from-gray-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      <div className="relative">
        {props.children}
      </div>
    </div>
  );
});
Card.displayName = 'Card';
