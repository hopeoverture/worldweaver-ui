'use client';
import { Template } from '@/lib/types';
import { TemplateCard } from './TemplateCard';
import { ResponsiveVirtualGrid } from '../ui/VirtualGrid';
import { EmptyState } from '../ui/EmptyState';

interface VirtualTemplateGridProps {
  templates: Template[];
  onEdit?: (template: Template) => void;
  onDelete?: (templateId: string) => void;
  onCreateTemplate?: () => void;
  onDragStart?: (template: Template) => void;
  /** Height of each template card in pixels */
  itemHeight?: number;
  /** Minimum width for each template card */
  minItemWidth?: number;
  /** Maximum number of columns */
  maxColumns?: number;
  /** Container height (optional, defaults to viewport-based) */
  containerHeight?: number;
}

export function VirtualTemplateGrid({
  templates,
  onEdit,
  onDelete,
  onCreateTemplate,
  onDragStart,
  itemHeight = 220,
  minItemWidth = 300,
  maxColumns = 4,
  containerHeight
}: VirtualTemplateGridProps) {
  
  // Empty state
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

  const renderTemplate = (template: Template, index: number) => (
    <div className="h-full w-full p-1">
      <TemplateCard
        key={template.id}
        template={template}
        onEdit={() => onEdit?.(template)}
        onDelete={() => onDelete?.(template.id)}
        onDragStart={onDragStart}
      />
    </div>
  );

  return (
    <ResponsiveVirtualGrid
      items={templates}
      itemHeight={itemHeight}
      minItemWidth={minItemWidth}
      maxColumns={maxColumns}
      containerHeight={containerHeight}
      renderItem={renderTemplate}
      emptyState={emptyState}
      gap={16}
      className="template-virtual-grid"
    />
  );
}