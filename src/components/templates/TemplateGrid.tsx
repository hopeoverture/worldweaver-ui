'use client';
import { Template } from '@/lib/types';
import { TemplateCard } from './TemplateCard';
import { EmptyState } from '../ui/EmptyState';
import { SmartGrid, VIRTUALIZATION_THRESHOLDS } from '../ui/SmartGrid';
import { VirtualTemplateGrid } from './VirtualTemplateGrid';

interface TemplateGridProps {
  templates: Template[];
  onEdit?: (template: Template) => void;
  onDelete?: (templateId: string) => void;
  onCreateTemplate?: () => void;
  onDragStart?: (template: Template) => void;
  /** List of template IDs that are customized versions of system templates */
  customizedTemplateIds?: string[];
}

export function TemplateGrid({ templates, onEdit, onDelete, onCreateTemplate, onDragStart, customizedTemplateIds = [] }: TemplateGridProps) {
  
  // Empty state component
  const emptyState = (
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

  // Regular grid rendering function
  const renderRegular = (items: Template[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={onEdit}
          onDelete={onDelete}
          onDragStart={onDragStart}
          isCustomized={customizedTemplateIds.includes(template.id)}
        />
      ))}
    </div>
  );

  // Virtual grid rendering function
  const renderVirtual = (items: Template[]) => (
    <VirtualTemplateGrid
      templates={items}
      onEdit={onEdit}
      onDelete={onDelete}
      onCreateTemplate={onCreateTemplate}
      onDragStart={onDragStart}
      customizedTemplateIds={customizedTemplateIds}
    />
  );

  return (
    <SmartGrid
      items={templates}
      renderRegular={renderRegular}
      renderVirtual={renderVirtual}
      virtualThreshold={VIRTUALIZATION_THRESHOLDS.complex}
      emptyState={emptyState}
    />
  );
}
