'use client';
import { useState } from 'react';
import { Template, TemplateField } from '@/lib/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Modal } from '../ui/Modal';

interface TemplateEditorProps {
  template: Template;
  onSave?: (template: Template) => void;
  onCancel?: () => void;
  isModal?: boolean;
  isOpen?: boolean;
}

export function TemplateEditor({ 
  template: initialTemplate, 
  onSave, 
  onCancel, 
  isModal = false,
  isOpen = true 
}: TemplateEditorProps) {
  const [template, setTemplate] = useState<Template>({ ...initialTemplate });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateTemplateName = (name: string) => {
    setTemplate(t => ({ ...t, name }));
    if (errors.name) {
      setErrors(e => ({ ...e, name: '' }));
    }
  };

  const updateFieldName = (fieldId: string, newName: string) => {
    setTemplate(t => ({
      ...t,
      fields: t.fields.map(field =>
        field.id === fieldId ? { ...field, name: newName } : field
      )
    }));
    if (errors[`field-${fieldId}`]) {
      setErrors(e => ({ ...e, [`field-${fieldId}`]: '' }));
    }
  };

  const updateFieldType = (fieldId: string, newType: TemplateField['type']) => {
    setTemplate(t => ({
      ...t,
      fields: t.fields.map(field =>
        field.id === fieldId ? { ...field, type: newType } : field
      )
    }));
  };

  const updateFieldPrompt = (fieldId: string, prompt: string) => {
    setTemplate(t => ({
      ...t,
      fields: t.fields.map(field =>
        field.id === fieldId ? { ...field, prompt } : field
      )
    }));
  };

  const updateFieldRequired = (fieldId: string, required: boolean) => {
    setTemplate(t => ({
      ...t,
      fields: t.fields.map(field =>
        field.id === fieldId ? { ...field, required } : field
      )
    }));
  };

  const updateFieldOptions = (fieldId: string, options: string[]) => {
    setTemplate(t => ({
      ...t,
      fields: t.fields.map(field =>
        field.id === fieldId ? { ...field, options } : field
      )
    }));
  };

  const addField = () => {
    const newField: TemplateField = {
      id: `field-${Date.now()}`,
      name: 'New Field',
      type: 'shortText',
      required: false,
      prompt: ''
    };
    setTemplate(t => ({ ...t, fields: [...t.fields, newField] }));
  };

  const removeField = (id: string) => {
    setTemplate(t => ({ ...t, fields: t.fields.filter(f => f.id !== id) }));
    // Remove any errors for this field
    setErrors(e => {
      const newErrors = { ...e };
      delete newErrors[`field-${id}`];
      return newErrors;
    });
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    setTemplate(t => {
      const newFields = [...t.fields];
      const [removed] = newFields.splice(fromIndex, 1);
      newFields.splice(toIndex, 0, removed);
      return { ...t, fields: newFields };
    });
  };

  const validateTemplate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!template.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    template.fields.forEach(field => {
      if (!field.name.trim()) {
        newErrors[`field-${field.id}`] = 'Field name is required';
      }
    });

    if (template.fields.length === 0) {
      newErrors.fields = 'Template must have at least one field';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateTemplate()) return;
    
    onSave?.(template);
  };

  const handleCancel = () => {
    setTemplate({ ...initialTemplate });
    setErrors({});
    onCancel?.();
  };

  const renderFieldOptions = (field: TemplateField) => {
    if (field.type !== 'select' && field.type !== 'multiSelect') return null;

    const options = field.options || [];
    const optionsText = options.join('\n');

    return (
      <div className="mt-2">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Options (one per line)
        </label>
        <Textarea
          value={optionsText}
          onChange={(e) => {
            const newOptions = e.target.value.split('\n').filter(opt => opt.trim());
            updateFieldOptions(field.id, newOptions);
          }}
          placeholder="Option 1&#10;Option 2&#10;Option 3"
          rows={4}
          className="text-sm"
        />
      </div>
    );
  };

  const content = (
    <div className="space-y-6">
      {/* Template Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Template Name *
        </label>
        <Input
          value={template.name}
          onChange={(e) => updateTemplateName(e.target.value)}
          placeholder="Enter template name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Fields Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Template Fields
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addField}
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Field
          </Button>
        </div>

        {errors.fields && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.fields}</p>
          </div>
        )}

        <div className="space-y-4">
          {template.fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 dark:border-neutral-700 rounded-lg p-4 bg-gray-50 dark:bg-neutral-800">
              <div className="flex items-start gap-3 mb-3">
                {/* Field Name */}
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Field Name *
                  </label>
                  <Input
                    value={field.name}
                    onChange={(e) => updateFieldName(field.id, e.target.value)}
                    placeholder="Field name"
                  />
                  {errors[`field-${field.id}`] && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[`field-${field.id}`]}</p>
                  )}
                </div>

                {/* Field Type */}
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) => updateFieldType(field.id, e.target.value as TemplateField['type'])}
                    className="block w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                  >
                    <option value="shortText">Short Text</option>
                    <option value="longText">Long Text</option>
                    <option value="number">Number</option>
                    <option value="select">Select</option>
                    <option value="multiSelect">Multi Select</option>
                  </select>
                </div>

                {/* Required Checkbox */}
                <div className="flex items-center pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.required || false}
                      onChange={(e) => updateFieldRequired(field.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800"
                    />
                    <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">Required</span>
                  </label>
                </div>

                {/* Move and Delete Controls */}
                <div className="flex items-center gap-1 pt-6">
                  {index > 0 && (
                    <button
                      onClick={() => moveField(index, index - 1)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Move up"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  )}
                  {index < template.fields.length - 1 && (
                    <button
                      onClick={() => moveField(index, index + 1)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Move down"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => removeField(field.id)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Delete field"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Field Prompt */}
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Help Text (optional)
                </label>
                <Input
                  value={field.prompt || ''}
                  onChange={(e) => updateFieldPrompt(field.id, e.target.value)}
                  placeholder="Help text to guide users filling out this field"
                />
              </div>

              {/* Field Options for Select/MultiSelect */}
              {renderFieldOptions(field)}
            </div>
          ))}
        </div>

        {template.fields.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No fields defined yet.</p>
            <Button
              variant="outline"
              onClick={addField}
            >
              Add Your First Field
            </Button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-700">
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
        >
          Save Template
        </Button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <Modal
        open={isOpen}
        onClose={handleCancel}
        title={`Edit Template: ${template.name}`}
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {content}
        </div>
      </Modal>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Edit Template: {template.name}
      </h3>
      {content}
    </div>
  );
}
