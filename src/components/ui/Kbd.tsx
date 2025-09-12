'use client';

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border bg-gray-100 px-2 py-1.5 text-xs font-semibold text-gray-800 dark:bg-neutral-800 dark:text-gray-200">
      {children}
    </kbd>
  );
}
