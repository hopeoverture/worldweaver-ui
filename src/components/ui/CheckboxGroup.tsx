"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  maxSelections?: number;
  minSelections?: number;
  disabled?: boolean;
  className?: string;
  error?: string;
  required?: boolean;
  columns?: number;
  showSelectAll?: boolean;
}

export function CheckboxGroup({
  options,
  value,
  onChange,
  maxSelections,
  minSelections,
  disabled = false,
  className,
  error,
  required = false,
  columns = 2,
  showSelectAll = false
}: CheckboxGroupProps) {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      // Remove option
      onChange(value.filter(v => v !== optionValue));
    } else {
      // Add option (if not at max limit)
      if (!maxSelections || value.length < maxSelections) {
        onChange([...value, optionValue]);
      }
    }
  };

  const selectAll = () => {
    const maxToSelect = maxSelections ? Math.min(options.length, maxSelections) : options.length;
    const availableOptions = options.filter(opt => !opt.disabled).slice(0, maxToSelect);
    onChange(availableOptions.map(opt => opt.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const canAddMore = !maxSelections || value.length < maxSelections;
  const hasMinimum = !minSelections || value.length >= minSelections;
  const allSelected = options.filter(opt => !opt.disabled).every(opt => value.includes(opt.value));
  const someSelected = value.length > 0;

  const getGridClasses = () => {
    switch (columns) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-1 sm:grid-cols-2";
      case 3: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case 4: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      default: return "grid-cols-1 sm:grid-cols-2";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with selection info and controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {maxSelections && (
            <span>
              {value.length} of {maxSelections} selected
            </span>
          )}
          {minSelections && !hasMinimum && (
            <span className="text-destructive ml-2">
              (Minimum {minSelections} required)
            </span>
          )}
          {required && value.length === 0 && (
            <span className="text-destructive">
              Required field
            </span>
          )}
        </div>

        {/* Select All / Clear All buttons */}
        {showSelectAll && (
          <div className="flex gap-2">
            {!allSelected && canAddMore && (
              <button
                type="button"
                onClick={selectAll}
                disabled={disabled}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                Select All
              </button>
            )}
            {someSelected && (
              <button
                type="button"
                onClick={clearAll}
                disabled={disabled}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Checkbox Grid */}
      <div className={cn("grid gap-3", getGridClasses())}>
        {options.map((option) => {
          const isSelected = value.includes(option.value);
          const isDisabled = disabled || option.disabled || (!isSelected && !canAddMore);

          return (
            <label
              key={option.value}
              className={cn(
                "relative flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isSelected && "border-primary bg-primary/5 text-primary",
                isDisabled && "cursor-not-allowed opacity-50",
                error && "border-destructive"
              )}
            >
              <div className="flex items-center pt-0.5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => !isDisabled && toggleOption(option.value)}
                  disabled={isDisabled}
                  className={cn(
                    "h-4 w-4 rounded border-muted text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
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

      {/* Selection summary for accessibility */}
      {value.length > 0 && (
        <div className="sr-only" aria-live="polite">
          {value.length} option{value.length !== 1 ? 's' : ''} selected: {
            options
              .filter(opt => value.includes(opt.value))
              .map(opt => opt.label)
              .join(', ')
          }
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
interface CompactCheckboxGroupProps extends Omit<CheckboxGroupProps, 'columns'> {
  columns?: number;
  size?: 'sm' | 'md';
}

export function CompactCheckboxGroup({
  options,
  value,
  onChange,
  maxSelections,
  minSelections,
  disabled = false,
  className,
  error,
  required = false,
  columns = 3,
  size = 'sm',
  showSelectAll = true
}: CompactCheckboxGroupProps) {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      if (!maxSelections || value.length < maxSelections) {
        onChange([...value, optionValue]);
      }
    }
  };

  const selectAll = () => {
    const maxToSelect = maxSelections ? Math.min(options.length, maxSelections) : options.length;
    const availableOptions = options.filter(opt => !opt.disabled).slice(0, maxToSelect);
    onChange(availableOptions.map(opt => opt.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const canAddMore = !maxSelections || value.length < maxSelections;
  const hasMinimum = !minSelections || value.length >= minSelections;
  const allSelected = options.filter(opt => !opt.disabled).every(opt => value.includes(opt.value));
  const someSelected = value.length > 0;

  const getGridClasses = () => {
    switch (columns) {
      case 2: return "grid-cols-2";
      case 3: return "grid-cols-2 md:grid-cols-3";
      case 4: return "grid-cols-2 md:grid-cols-4";
      case 5: return "grid-cols-2 md:grid-cols-3 lg:grid-cols-5";
      default: return "grid-cols-2 md:grid-cols-3";
    }
  };

  const sizeClasses = {
    sm: "text-sm p-2",
    md: "text-base p-3"
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Compact header */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {maxSelections && `${value.length}/${maxSelections}`}
          {minSelections && !hasMinimum && (
            <span className="text-destructive ml-1">
              (min {minSelections})
            </span>
          )}
        </span>
        {showSelectAll && (
          <div className="flex gap-2">
            {!allSelected && canAddMore && (
              <button
                type="button"
                onClick={selectAll}
                disabled={disabled}
                className="text-primary hover:underline disabled:opacity-50"
              >
                All
              </button>
            )}
            {someSelected && (
              <button
                type="button"
                onClick={clearAll}
                disabled={disabled}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Compact checkbox grid */}
      <div className={cn("grid gap-2", getGridClasses())}>
        {options.map((option) => {
          const isSelected = value.includes(option.value);
          const isDisabled = disabled || option.disabled || (!isSelected && !canAddMore);

          return (
            <label
              key={option.value}
              className={cn(
                "relative flex items-center gap-2 cursor-pointer rounded border transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isSelected && "border-primary bg-primary/5 text-primary",
                isDisabled && "cursor-not-allowed opacity-50",
                sizeClasses[size]
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => !isDisabled && toggleOption(option.value)}
                disabled={isDisabled}
                className="h-3 w-3 rounded text-primary focus:ring-1 focus:ring-primary focus:ring-offset-1"
              />
              <span className={cn(
                "font-medium leading-tight flex-1",
                isSelected && "text-primary"
              )}>
                {option.label}
              </span>
            </label>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}