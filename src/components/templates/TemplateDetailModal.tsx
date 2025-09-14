'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Template } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TemplateEditor } from './TemplateEditor';
import { CORE_TEMPLATE_NAMES } from '@/lib/coreTemplates';
import { useUpdateTemplate } from '@/hooks/mutations/useUpdateTemplate';
import { useDeleteTemplate } from '@/hooks/mutations/useDeleteTemplate';
import { useToast } from '@/components/ui/ToastProvider';

interface TemplateDetailModalProps {
  template: Template;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (templateId: string) => void;
  /** Whether this template is a customized version of a system template */
  isCustomized?: boolean;
}

export function TemplateDetailModal({ template, isOpen, onClose, onDelete, isCustomized }: TemplateDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateTemplate = useStore(state => state.updateTemplate);
  const params = useParams();
  const worldId = String(params?.id || '');
  const updateTemplateMut = useUpdateTemplate(worldId);
  const deleteTemplateMut = useDeleteTemplate(worldId);
  const { toast } = useToast();

  // Check if this is a core template
  const isCoreTemplate = Object.values(CORE_TEMPLATE_NAMES).includes(template.name as any);

  const handleSave = (updatedTemplate: Template) => {
    // Optimistic local update for snappy UI
    updateTemplate(template.id, updatedTemplate);
    // Persist to API; include worldId so system templates create per‑world overrides
    updateTemplateMut.mutate(
      { id: template.id, patch: {
        name: updatedTemplate.name,
        description: (updatedTemplate as any).description,
        icon: (updatedTemplate as any).icon,
        category: (updatedTemplate as any).category,
        fields: updatedTemplate.fields,
      } },
      {
        onSuccess: () => {
          if (isCoreTemplate) {
            // Check if this is the first customization of the system template
            // If template.worldId exists, it means it was already customized
            const isFirstCustomization = !template.worldId;
            toast({
              title: isFirstCustomization
                ? `Created world customization of ${template.name}`
                : `Updated world customization of ${template.name}`,
              description: 'Your changes only apply to this world',
              variant: 'success'
            });
          } else {
            toast({ title: 'Template saved', variant: 'success' });
          }
          setIsEditing(false);
        },
        onError: (e) => {
          toast({ title: 'Failed to save template', description: String((e as Error)?.message || e), variant: 'error' });
        }
      }
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete && !isCoreTemplate) {
      if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
        onDelete(template.id);
        onClose();
      }
    }
  };

  const handleResetToDefault = () => {
    if (isCustomized && isCoreTemplate) {
      if (confirm('Reset this template to the original core template version? Your customizations will be lost.')) {
        deleteTemplateMut.mutate(template.id, {
          onSuccess: () => {
            toast({
              title: `Reset ${template.name} to default`,
              description: 'Template reverted to original core template version',
              variant: 'success'
            });
            onClose();
          },
          onError: (e) => {
            toast({
              title: 'Failed to reset template',
              description: String((e as Error)?.message || e),
              variant: 'error'
            });
          }
        });
      }
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (isEditing) {
    return (
      <TemplateEditor
        template={template}
        onSave={handleSave}
        onCancel={handleCancel}
        isModal={true}
        isOpen={isOpen}
      />
    );
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={template.name}
    >
      <div className="space-y-6">
        {/* Template Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {template.name}
            </h2>
            {isCoreTemplate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                Core Template
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
              {template.fields.length} {template.fields.length === 1 ? 'field' : 'fields'}
            </span>
          </div>
        </div>

        {/* Template Description */}
        {isCoreTemplate && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This is a core template that provides essential fields for world-building.
              You can customize it for this world without affecting other worlds or users.
            </p>
            {isCustomized && (
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-2 font-medium">
                ⚠️ This template has been customized for this world.
              </p>
            )}
          </div>
        )}

        {/* Fields List */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Template Fields
          </h3>
          {template.fields.length > 0 ? (
            <div className="space-y-3">
              {template.fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 dark:border-neutral-700 rounded-lg p-4 bg-gray-50 dark:bg-neutral-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {index + 1}. {field.name}
                        </h4>
                        {field.required && (
                          <span className="text-xs text-red-600 dark:text-red-400">*</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300">
                          {field.type}
                        </span>
                        {field.required && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                            Required
                          </span>
                        )}
                      </div>
                      {field.prompt && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {field.prompt}
                        </p>
                      )}
                      {field.options && field.options.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Options:</p>
                          <div className="flex flex-wrap gap-1">
                            {field.options.slice(0, 5).map((option, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                                {option}
                              </span>
                            ))}
                            {field.options.length > 5 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{field.options.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">No fields defined yet.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-neutral-700">
          <div className="flex gap-2">
            {onDelete && !isCoreTemplate && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
              >
                Delete Template
              </Button>
            )}
            {isCustomized && isCoreTemplate && (
              <Button
                variant="outline"
                onClick={handleResetToDefault}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/20"
              >
                Reset to Default
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button
              onClick={() => setIsEditing(true)}
            >
              {isCoreTemplate ? 'Customize Template' : 'Edit Template'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
