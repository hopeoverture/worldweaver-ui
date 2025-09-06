'use client';
import { Button } from '../../ui/Button';

interface FieldControlsProps {
  onBack: () => void;
  isSubmitting?: boolean;
  onEnhance?: () => void;
  onGenerate?: () => void;
}

export function FieldControls({ onBack, isSubmitting = false, onEnhance, onGenerate }: FieldControlsProps) {
  return (
    <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-gray-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm px-6 py-4 -mx-6 -mb-6">
      <div className="flex gap-2">
        {onEnhance && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={onEnhance}
            disabled={isSubmitting}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Enhance
          </Button>
        )}
        {onGenerate && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={onGenerate}
            disabled={isSubmitting}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Generate
          </Button>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button 
          type="submit" 
          loading={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Entity'}
        </Button>
      </div>
    </div>
  );
}
