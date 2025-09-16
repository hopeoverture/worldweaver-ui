'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { ArtStyle, BUILTIN_ART_STYLES, SavedArtStyle, createCustomArtStyle, isValidArtStyleName, isValidPromptModifier } from '@/lib/artStyles';

interface AIPromptModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, artStyle?: ArtStyle) => void;
  title: string;
  description?: string;
  placeholder?: string;
  isGenerating?: boolean;
  maxLength?: number;
  showArtStyleSelection?: boolean;
  savedArtStyles?: SavedArtStyle[];
  onSaveArtStyle?: (artStyle: SavedArtStyle) => void;
}

export function AIPromptModal({
  open,
  onClose,
  onGenerate,
  title,
  description,
  placeholder = "Describe what you want to generate...",
  isGenerating = false,
  maxLength = 500,
  showArtStyleSelection = false,
  savedArtStyles = [],
  onSaveArtStyle
}: AIPromptModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedArtStyle, setSelectedArtStyle] = useState<ArtStyle | null>(null);
  const [showCustomStyle, setShowCustomStyle] = useState(false);
  const [customStyleName, setCustomStyleName] = useState('');
  const [customStyleModifier, setCustomStyleModifier] = useState('');
  const [saveAsCustom, setSaveAsCustom] = useState(false);

  const handleSubmit = () => {
    if (isGenerating) return;

    // Handle custom style creation if needed
    let finalArtStyle = selectedArtStyle;
    if (showCustomStyle && customStyleName && customStyleModifier) {
      const customStyle = createCustomArtStyle(
        customStyleName.trim(),
        `Custom style: ${customStyleName.trim()}`,
        customStyleModifier.trim()
      );

      if (saveAsCustom && onSaveArtStyle) {
        onSaveArtStyle(customStyle);
      }

      finalArtStyle = customStyle;
    }

    onGenerate(prompt.trim(), finalArtStyle || undefined);
  };

  const handleClose = () => {
    if (!isGenerating) {
      setPrompt('');
      setSelectedArtStyle(null);
      setShowCustomStyle(false);
      setCustomStyleName('');
      setCustomStyleModifier('');
      setSaveAsCustom(false);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className="space-y-4">
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}

        {showArtStyleSelection && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Art Style
              </label>

              {/* Built-in Art Styles */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {BUILTIN_ART_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setSelectedArtStyle(style);
                      setShowCustomStyle(false);
                    }}
                    disabled={isGenerating}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      selectedArtStyle?.id === style.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {style.icon && <span className="text-sm">{style.icon}</span>}
                      <span className="text-xs font-medium">{style.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {style.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* Saved Custom Styles */}
              {savedArtStyles.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Your Saved Styles:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {savedArtStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setSelectedArtStyle(style);
                          setShowCustomStyle(false);
                        }}
                        disabled={isGenerating}
                        className={`p-2 text-left rounded-lg border transition-colors ${
                          selectedArtStyle?.id === style.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300'
                            : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800'
                        }`}
                      >
                        <span className="text-xs font-medium">{style.name}</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {style.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Style Toggle */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => {
                    setShowCustomStyle(!showCustomStyle);
                    if (!showCustomStyle) setSelectedArtStyle(null);
                  }}
                  disabled={isGenerating}
                  className={`px-3 py-1 rounded text-xs border transition-colors ${
                    showCustomStyle
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-300 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-500'
                  }`}
                >
                  {showCustomStyle ? '✓ Custom Style' : '+ Custom Style'}
                </button>
                {!selectedArtStyle && !showCustomStyle && (
                  <span className="text-xs text-gray-500">No style selected (default quality)</span>
                )}
              </div>

              {/* Custom Style Form */}
              {showCustomStyle && (
                <div className="space-y-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div>
                    <label className="block text-xs font-medium text-orange-800 dark:text-orange-200 mb-1">
                      Style Name
                    </label>
                    <Input
                      value={customStyleName}
                      onChange={(e) => setCustomStyleName(e.target.value)}
                      placeholder="e.g., Vintage Comic Book"
                      disabled={isGenerating}
                      maxLength={50}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-orange-800 dark:text-orange-200 mb-1">
                      Style Modifier
                    </label>
                    <Input
                      value={customStyleModifier}
                      onChange={(e) => setCustomStyleModifier(e.target.value)}
                      placeholder="e.g., , vintage comic book style, bold outlines, retro colors"
                      disabled={isGenerating}
                      maxLength={200}
                      className="text-sm"
                    />
                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                      This text will be added to your image prompt. Start with a comma.
                    </p>
                  </div>
                  {onSaveArtStyle && (
                    <label className="flex items-center gap-2 text-xs text-orange-800 dark:text-orange-200">
                      <input
                        type="checkbox"
                        checked={saveAsCustom}
                        onChange={(e) => setSaveAsCustom(e.target.checked)}
                        disabled={isGenerating || !isValidArtStyleName(customStyleName) || !isValidPromptModifier(customStyleModifier)}
                        className="rounded"
                      />
                      Save this style for future use
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Generation Prompt (optional)
          </label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            rows={4}
            maxLength={maxLength}
            disabled={isGenerating}
            className="resize-none"
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {prompt.length}/{maxLength}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-700">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? (
              <>
                <svg className="h-4 w-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
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
              'Generate'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}