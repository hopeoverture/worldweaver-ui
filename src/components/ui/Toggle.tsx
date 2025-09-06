'use client';
import * as React from 'react';

export const Toggle = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { pressed: boolean }
>(({ pressed, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={pressed}
      data-state={pressed ? 'on' : 'off'}
      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 bg-gray-200 dark:bg-neutral-700 data-[state=on]:bg-brand-600"
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0 data-[state=on]:translate-x-5"
      />
    </button>
  );
});
Toggle.displayName = 'Toggle';
