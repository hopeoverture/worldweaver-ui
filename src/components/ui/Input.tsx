'use client';
import * as React from 'react';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      className="block w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';
