'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface AIGenerateButtonProps {
  onClick: () => void;
  isGenerating?: boolean;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

export function AIGenerateButton({
  onClick,
  isGenerating = false,
  children = 'Generate with AI',
  variant = 'outline',
  size = 'sm',
  className = '',
  disabled = false,
  type = 'button',
  title
}: AIGenerateButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled || isGenerating}
      className={`inline-flex items-center gap-2 ${className}`}
      title={title}
    >
      {isGenerating ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Generating...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          {children}
        </>
      )}
    </Button>
  );
}