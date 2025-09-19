"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

type ToastVariant = "default" | "success" | "error" | "warning" | "destructive";
type Toast = { id: string; title?: string; description?: string; variant?: ToastVariant; };

type ToastContextType = {
  toasts: Toast[];
  toast: (t: Omit<Toast, "id"> & { durationMs?: number }) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((t: Omit<Toast, "id"> & { durationMs?: number }) => {
    const id = uuidv4();
    const { durationMs = 3500, ...rest } = t;
    setToasts((prev) => [...prev, { id, ...rest }]);
    if (durationMs > 0) {
      setTimeout(() => dismiss(id), durationMs);
    }
  }, [dismiss]);

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function variantStyles(variant?: ToastVariant) {
  switch (variant) {
    case "success":
      return "border-green-200 bg-green-50 text-green-900 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200";
    case "error":
    case "destructive":
      return "border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200";
    default:
      return "border-gray-200 bg-white text-gray-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-100";
  }
}

export function ToastViewport() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, dismiss } = ctx;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`w-80 rounded-lg border shadow-lg p-4 backdrop-blur-sm ${variantStyles(t.variant)}`}
          role="status"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {t.title && <div className="font-medium text-sm">{t.title}</div>}
              {t.description && <div className="text-sm mt-1 opacity-80">{t.description}</div>}
            </div>
            <button
              aria-label="Dismiss"
              className="text-sm opacity-60 hover:opacity-100"
              onClick={() => dismiss(t.id)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}


