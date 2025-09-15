'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

interface AIPromptModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
  title: string;
  description?: string;
  placeholder?: string;
  isGenerating?: boolean;
  maxLength?: number;
}

export function AIPromptModal({
  open,
  onClose,
  onGenerate,
  title,
  description,
  placeholder = "Describe what you want to generate...",
  isGenerating = false,
  maxLength = 500
}: AIPromptModalProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (!isGenerating) {
      onGenerate(prompt.trim());
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setPrompt('');
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