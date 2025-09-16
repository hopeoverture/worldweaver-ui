'use client';
import { useState } from 'react';
import { Template } from '@/lib/types';
import { TemplateDetailModal } from './TemplateDetailModal';
import { CORE_TEMPLATE_NAMES } from '@/lib/coreTemplates';
import { useDeleteTemplate } from '@/hooks/mutations/useDeleteTemplate';
import { useToast } from '@/components/ui/ToastProvider';

interface TemplateCardProps {
  template: Template;
  onEdit?: (template: Template) => void;
  onDelete?: (templateId: string) => void;
  onDragStart?: (template: Template) => void;
  /** Whether this template is a world-specific customization of a system template */
  isCustomized?: boolean;
  /** World ID for cache invalidation */
  worldId?: string;
}

export function TemplateCard({ template, onEdit, onDelete, onDragStart, isCustomized, worldId }: TemplateCardProps) {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteTemplate = useDeleteTemplate(worldId || template.worldId || '');
  const { toast } = useToast();

  // Check if this is a core template
  const isCoreTemplate = Object.values(CORE_TEMPLATE_NAMES).includes(template.name as any);

  const handleCardClick = () => {
    setIsDetailModalOpen(true);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'template',
      id: template.id,
      name: template.name
    }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(template);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteTemplate.mutateAsync(template.id);
      toast({
        title: 'Template deleted',
        description: `${template.name} has been deleted`,
        variant: 'success'
      });
      onDelete?.(template.id);
    } catch (error) {
      toast({
        title: 'Failed to delete template',
        description: String((error as Error)?.message || error),
        variant: 'error'
      });
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  // Core templates can be deleted (they become world-specific customizations)
  const canDelete = true;

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`group relative rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card hover:shadow-xl transition-all duration-300 p-6 hover:-translate-y-1 cursor-pointer ${isDragging ? 'opacity-50 scale-95' : ''}`}
        draggable={!!onDragStart}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Gradient overlay for visual interest */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative">
          {/* Delete button - top right corner */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            {!showDeleteConfirm ? (
              <button
                onClick={handleDeleteClick}
                className="p-2 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800 text-red-600 dark:text-red-400 transition-colors"
                title={isCoreTemplate ? "Create world-specific version" : "Delete template"}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : (
              <div className="flex gap-1 bg-white dark:bg-neutral-800 rounded-lg p-1 shadow-lg border border-gray-200 dark:border-neutral-700">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteTemplate.isPending}
                  className="p-1.5 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
                  title="Confirm delete"
                >
                  {deleteTemplate.isPending ? (
                    <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleteTemplate.isPending}
                  className="p-1.5 rounded bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50 transition-colors"
                  title="Cancel delete"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <header className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                {template.name}
              </h3>
              {isCoreTemplate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                  Core
                </span>
              )}
              {isCustomized && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
                  Customized
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                {template.fields.length} {template.fields.length === 1 ? 'field' : 'fields'}
              </span>
            </div>
          </header>

          {/* Field preview */}
          {template.fields.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fields:</h4>
              <div className="space-y-1">
                {template.fields.slice(0, 3).map(field => (
                  <div key={field.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                      {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 rounded ml-2 text-xs">
                      {field.type}
                    </span>
                  </div>
                ))}
                {template.fields.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{template.fields.length - 3} more fields
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Click hint */}
          <div className="pt-4 border-t border-gray-100 dark:border-neutral-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Click to view and edit template
            </p>
          </div>
          
          {isCoreTemplate && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Core templates can be customized for this world without affecting other worlds.
              </p>
            </div>
          )}
        </div>
      </div>

      <TemplateDetailModal
        template={template}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onDelete={onDelete}
        isCustomized={isCustomized}
      />
    </>
  );
}
