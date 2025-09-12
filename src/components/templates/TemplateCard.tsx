'use client';
import { useState } from 'react';
import { Template } from '@/lib/types';
import { TemplateDetailModal } from './TemplateDetailModal';
import { CORE_TEMPLATE_NAMES } from '@/lib/coreTemplates';

interface TemplateCardProps {
  template: Template;
  onEdit?: (template: Template) => void;
  onDelete?: (templateId: string) => void;
}

export function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Check if this is a core template
  const isCoreTemplate = Object.values(CORE_TEMPLATE_NAMES).includes(template.name as any);

  const handleCardClick = () => {
    setIsDetailModalOpen(true);
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="group relative rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card hover:shadow-xl transition-all duration-300 p-6 hover:-translate-y-1 cursor-pointer"
      >
        {/* Gradient overlay for visual interest */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative">
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
      />
    </>
  );
}
