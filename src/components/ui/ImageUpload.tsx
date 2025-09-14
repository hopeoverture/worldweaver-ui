'use client';
import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  /** Current image URL if any */
  value?: string;
  /** Callback when image is selected */
  onChange: (file: File | null) => void;
  /** Optional label */
  label?: string;
  /** Optional description */
  description?: string;
  /** Whether upload is disabled */
  disabled?: boolean;
  /** Whether field has an error */
  error?: string;
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number;
  /** Accepted file types (default: images) */
  accept?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = 'Entity Image',
  description = 'Upload an image for this entity. Drag and drop or click to select.',
  disabled = false,
  error,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif'
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const validTypes = accept.split(',').map(t => t.trim());
    if (!validTypes.includes(file.type)) {
      return `Invalid file type. Please select: ${validTypes.map(t => t.split('/')[1]).join(', ')}`;
    }

    // Check file size
    if (file.size > maxSize) {
      const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File too large. Maximum size is ${sizeMB}MB`;
    }

    return null;
  }, [accept, maxSize]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (disabled) return;

    setIsValidating(true);

    const validationError = validateFile(file);
    if (validationError) {
      setIsValidating(false);
      // You could show this error in a toast or pass it up
      console.error('File validation error:', validationError);
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    onChange(file);
    setIsValidating(false);
  }, [disabled, validateFile, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          error
            ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/20'
            : isDragging
            ? 'border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-950/20'
            : 'border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            <div className="aspect-video relative overflow-hidden rounded-lg">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              disabled={disabled}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="flex flex-col items-center space-y-2">
              {isValidating ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
              ) : (
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-brand-600 hover:text-brand-500">
                  Click to upload
                </span>
                {' or drag and drop'}
              </div>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}