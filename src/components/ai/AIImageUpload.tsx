'use client';
import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { AIGenerateButton } from './AIGenerateButton';
import { AIPromptModal } from './AIPromptModal';
import { useGenerateImage } from '@/hooks/mutations/useGenerateImage';
import { useUserArtStyles } from '@/hooks/query/useUserArtStyles';
import { useSaveArtStyle } from '@/hooks/mutations/useSaveArtStyle';
import { ArtStyle, SavedArtStyle } from '@/lib/artStyles';

interface AIImageUploadProps {
  /** Current image URL if any */
  value?: string;
  /** Callback when image is selected */
  onChange: (file: File | null) => void;
  /** Callback when AI image is generated */
  onAIGenerate?: (imageUrl: string) => void;
  /** World ID for AI generation */
  worldId: string;
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
  /** AI generation type */
  aiType?: 'entity' | 'world-cover';
  /** Entity name for AI generation */
  entityName?: string;
  /** Template name for AI generation */
  templateName?: string;
  /** Entity fields for AI generation context */
  entityFields?: Record<string, unknown>;
  /** World context for AI generation */
  worldContext?: {
    name?: string;
    description?: string;
    genreBlend?: string[];
    overallTone?: string;
    keyThemes?: string[];
  };
}

export function AIImageUpload({
  value,
  onChange,
  onAIGenerate,
  worldId,
  label = 'Image',
  description = 'Upload an image or generate one with AI. Drag and drop or click to select.',
  disabled = false,
  error,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif',
  aiType = 'entity',
  entityName,
  templateName,
  entityFields,
  worldContext
}: AIImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isValidating, setIsValidating] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateImage = useGenerateImage();
  const { data: savedArtStyles = [], isLoading: isLoadingArtStyles } = useUserArtStyles();
  const saveArtStyle = useSaveArtStyle();

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
      console.error('File validation error:', validationError);
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setGeneratedImageUrl(null); // Clear any generated image
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
    setGeneratedImageUrl(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const handleAIGenerate = async (prompt: string, artStyle?: ArtStyle) => {
    try {
      const result = await generateImage.mutateAsync({
        worldId,
        type: aiType,
        prompt,
        artStyle,
        entityName,
        templateName,
        entityFields,
        worldName: worldContext?.name,
        worldDescription: worldContext?.description
      });

      setGeneratedImageUrl(result.imageUrl);
      setPreview(result.imageUrl);
      setShowAIModal(false);

      // Call the onAIGenerate callback if provided
      if (onAIGenerate) {
        onAIGenerate(result.imageUrl);
      }
    } catch (error) {
      // Error handling is done by the mutation hook
      console.error('AI image generation failed:', error);
    }
  };

  const handleUseGeneratedImage = () => {
    if (generatedImageUrl && onAIGenerate) {
      onAIGenerate(generatedImageUrl);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <AIGenerateButton
            onClick={() => setShowAIModal(true)}
            disabled={disabled || generateImage.isPending}
            isGenerating={generateImage.isPending}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Generate with AI
          </AIGenerateButton>
        </div>
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

            {/* AI Generated Badge */}
            {generatedImageUrl && (
              <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                AI Generated
              </div>
            )}

            <div className="absolute top-2 right-2 flex gap-1">
              {generatedImageUrl && onAIGenerate && (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseGeneratedImage();
                  }}
                  disabled={disabled}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-full p-1 transition-colors"
                  size="sm"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </Button>
              )}
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                disabled={disabled}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                size="sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="flex flex-col items-center space-y-2">
              {isValidating || generateImage.isPending ? (
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

      {/* AI Generation Modal */}
      <AIPromptModal
        open={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerate={handleAIGenerate}
        title={`Generate ${aiType === 'entity' ? 'Entity' : 'World Cover'} Image`}
        description={
          aiType === 'entity'
            ? `Generate an image for ${entityName || 'this entity'}. Select an art style and provide an optional description.`
            : `Generate a cover image for your world. Select an art style and describe the scene.`
        }
        placeholder={
          aiType === 'entity'
            ? `Describe how ${entityName || 'this entity'} should look...`
            : 'Describe the landscape, setting, or scene for your world cover...'
        }
        isGenerating={generateImage.isPending}
        maxLength={1000}
        showArtStyleSelection={true}
        savedArtStyles={savedArtStyles}
        onSaveArtStyle={(artStyle) => saveArtStyle.mutate(artStyle)}
      />
    </div>
  );
}