'use client';
import { useEffect } from 'react';

interface KeyboardShortcutProps {
  onNewWorld?: () => void;
  onSearch?: () => void;
}

export function useKeyboardShortcuts({ onNewWorld, onSearch }: KeyboardShortcutProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      // Cmd/Ctrl + N for new world
      if ((event.metaKey || event.ctrlKey) && event.key === 'n' && onNewWorld) {
        event.preventDefault();
        onNewWorld();
      }

      // Cmd/Ctrl + K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k' && onSearch) {
        event.preventDefault();
        onSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNewWorld, onSearch]);
}

interface KeyboardShortcutIndicatorProps {
  keys: string[];
  className?: string;
}

export function KeyboardShortcutIndicator({ keys, className = '' }: KeyboardShortcutIndicatorProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {keys.map((key, index) => (
        <kbd
          key={index}
          className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-neutral-700 rounded"
        >
          {key}
        </kbd>
      ))}
    </div>
  );
}
