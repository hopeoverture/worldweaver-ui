'use client';
import * as React from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}

export function Modal({
  open,
  title = 'Dialog',
  children,
  footer,
  onClose,
}: ModalProps) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (open) {
      triggerRef.current = (document.activeElement as HTMLElement) ?? null;
      setTimeout(() => {
        const focusable = dialogRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }, 0);
    } else {
      triggerRef.current?.focus?.();
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = e => {
    if (e.key !== 'Tab') return;
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      onKeyDown={onKeyDown}
      data-testid='create-entity-modal'
    >
      <button
        tabIndex={-1}
        className='absolute inset-0 bg-black/50 backdrop-blur-[2px]'
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-label={title}
        ref={dialogRef}
        className='relative w-full max-w-2xl rounded-lg bg-white dark:bg-neutral-900 shadow-xl ring-1 ring-black/5'
      >
        <header className='flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 px-4 py-3'>
          <h3 className='text-base font-semibold'>{title}</h3>
          <button
            onClick={onClose}
            aria-label='Close'
            className='h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600'
          >
            ✕
          </button>
        </header>
        <div className='p-6 space-y-4 max-h-[70vh] overflow-y-auto'>{children}</div>
        {footer && (
          <footer className='sticky bottom-0 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm px-6 py-4'>
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
