'use client';
import { Template } from '@/lib/types';
import { TemplateCard } from './TemplateCard';
import { EmptyState } from '../ui/EmptyState';

interface TemplateGridProps {
  templates: Template[];
  onEdit?: (template: Template) => void;
  onDelete?: (templateId: string) => void;
  onCreateTemplate?: () => void;
}

export function TemplateGrid({ templates, onEdit, onDelete, onCreateTemplate }: TemplateGridProps) {
  if (templates.length === 0) {
    return (
      <EmptyState
        illustration="templates"
        title="No templates in this folder"
        description="Templates define the structure and fields for your entities. Create a template to start building organized content."
        action={onCreateTemplate ? {
          label: "Create Template",
          onClick: onCreateTemplate
        } : undefined}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {templates.map(template => (
        <TemplateCard 
          key={template.id} 
          template={template} 
          glow='purple'
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
