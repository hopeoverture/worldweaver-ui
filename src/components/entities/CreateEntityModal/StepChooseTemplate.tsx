'use client';
import { Template } from '@/lib/types';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';

interface StepChooseTemplateProps {
  templates: Template[];
  onSelectTemplate: (templateId: string) => void;
}

export function StepChooseTemplate({ templates, onSelectTemplate }: StepChooseTemplateProps) {
  if (templates.length === 0) {
    return (
      <EmptyState
        illustration="templates"
        title="No templates available"
        description="You need to create templates first before you can create entities. Templates define the structure and fields for your entities."
        action={{
          label: "Create Template First",
          onClick: () => {
            // TODO: Navigate to template creation
            console.log('Navigate to template creation');
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Choose a Template
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select a template to define the structure for your new entity.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map(template => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className="group relative p-6 border border-gray-200 dark:border-neutral-800 rounded-xl text-left hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
          >
            {/* Gradient overlay for visual interest */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-transparent dark:from-brand-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
                  {template.name}
                </h4>
                <svg className="h-5 w-5 text-gray-400 group-hover:text-brand-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {template.fields.length} {template.fields.length === 1 ? 'field' : 'fields'}
              </p>
              {template.fields.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.fields.slice(0, 3).map(field => (
                    <span
                      key={field.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
                    >
                      {field.name}
                    </span>
                  ))}
                  {template.fields.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
                      +{template.fields.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
