"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  minSelections?: number;
  disabled?: boolean;
  className?: string;
  error?: string;
  required?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  maxSelections,
  minSelections,
  disabled = false,
  className,
  error,
  required = false
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter(option => value.includes(option.value));

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

  const removeOption = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue));
  };

  const clearAll = () => {
    onChange([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canAddMore = !maxSelections || value.length < maxSelections;
  const hasMinimum = !minSelections || value.length >= minSelections;

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Selected items display */}
      <div
        className={cn(
          "flex min-h-[40px] w-full flex-wrap gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
          error && "border-destructive focus-within:ring-destructive",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {selectedOptions.length > 0 ? (
          <>
            {selectedOptions.map(option => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
              >
                {option.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(option.value);
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
            {selectedOptions.length > 0 && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">
            {placeholder}
            {required && <span className="text-destructive ml-1">*</span>}
          </span>
        )}

        <ChevronDown className={cn(
          "ml-auto h-4 w-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {/* Search input */}
          <div className="px-2 py-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border-0 bg-transparent px-2 py-1 text-sm outline-none focus:ring-0"
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => {
                const isSelected = value.includes(option.value);
                const canSelect = canAddMore || isSelected;

                return (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground",
                      !canSelect && "cursor-not-allowed opacity-50"
                    )}
                    onClick={() => canSelect && toggleOption(option.value)}
                  >
                    <div className="flex h-4 w-4 items-center justify-center mr-2">
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No options found
              </div>
            )}
          </div>

          {/* Footer with selection info */}
          {(maxSelections || minSelections) && (
            <div className="border-t px-2 py-1 text-xs text-muted-foreground">
              {maxSelections && (
                <span>
                  {value.length} of {maxSelections} selected
                </span>
              )}
              {minSelections && !hasMinimum && (
                <span className="text-destructive ml-2">
                  Minimum {minSelections} required
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}