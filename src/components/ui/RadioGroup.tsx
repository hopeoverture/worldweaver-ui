"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  error?: string;
  required?: boolean;
}

export function RadioGroup({
  options,
  value,
  onChange,
  name,
  orientation = 'vertical',
  size = 'md',
  disabled = false,
  className,
  error,
  required = false
}: RadioGroupProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const spacingClasses = {
    horizontal: 'flex flex-wrap gap-4',
    vertical: 'space-y-2'
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn(spacingClasses[orientation])}>
        {options.map((option) => {
          const isDisabled = disabled || option.disabled;
          const isSelected = value === option.value;

          return (
            <label
              key={option.value}
              className={cn(
                "relative flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isSelected && "border-primary bg-primary/5",
                isDisabled && "cursor-not-allowed opacity-50",
                sizeClasses[size]
              )}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={isSelected}
                  onChange={(e) => !isDisabled && onChange(e.target.value)}
                  disabled={isDisabled}
                  className={cn(
                    "h-4 w-4 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  required={required}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-medium leading-tight",
                  isSelected && "text-primary"
                )}>
                  {option.label}
                </div>
                {option.description && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {option.description}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Compact version for space-constrained layouts
interface CompactRadioGroupProps extends Omit<RadioGroupProps, 'orientation'> {
  columns?: number;
}

export function CompactRadioGroup({
  options,
  value,
  onChange,
  name,
  columns = 2,
  size = 'sm',
  disabled = false,
  className,
  error,
  required = false
}: CompactRadioGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn(
        "grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-4"
      )}>
        {options.map((option) => {
          const isDisabled = disabled || option.disabled;
          const isSelected = value === option.value;

          return (
            <label
              key={option.value}
              className={cn(
                "relative flex items-center gap-2 cursor-pointer rounded border p-2 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isSelected && "border-primary bg-primary/5 text-primary",
                isDisabled && "cursor-not-allowed opacity-50"
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={(e) => !isDisabled && onChange(e.target.value)}
                disabled={isDisabled}
                className="h-3 w-3 text-primary focus:ring-1 focus:ring-primary focus:ring-offset-1"
                required={required}
              />
              <span className="font-medium leading-tight">
                {option.label}
              </span>
            </label>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}