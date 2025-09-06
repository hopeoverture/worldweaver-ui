'use client';
import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useStore } from '@/lib/store';
import { TemplateField, FieldType } from '@/lib/types';

interface CreateTemplateModalProps {
  open: boolean;
  worldId: string;
  onClose: () => void;
}

export function CreateTemplateModal({ open, worldId, onClose }: CreateTemplateModalProps) {
  const { addTemplate, folders } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    folderId: ''
  });
  const [fields, setFields] = useState<Omit<TemplateField, 'id'>[]>([
    { name: 'Name', type: 'shortText' as FieldType, required: true }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templateFolders = folders.filter(f => f.worldId === worldId && f.kind === 'templates');

  const fieldTypeOptions = [
    { value: 'shortText', label: 'Short Text' },
    { value: 'longText', label: 'Long Text' },
    { value: 'richText', label: 'Rich Text' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select' },
    { value: 'multiSelect', label: 'Multi Select' },
    { value: 'image', label: 'Image' },
    { value: 'reference', label: 'Reference' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    
    try {
      const templateFields: TemplateField[] = fields.map(field => ({
        ...field,
        id: crypto.randomUUID()
      }));

      addTemplate({
        name: formData.name.trim(),
        worldId,
        folderId: formData.folderId || undefined,
        fields: templateFields
      });

      // Reset form and close modal
      setFormData({ name: '', folderId: '' });
      setFields([{ name: 'Name', type: 'shortText', required: true }]);
      onClose();
    } catch (error) {
      console.error('Error creating template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', folderId: '' });
    setFields([{ name: 'Name', type: 'shortText', required: true }]);
    onClose();
  };

  const addField = () => {
    setFields(prev => [...prev, { name: '', type: 'shortText', required: false }]);
  };

  const updateField = (index: number, update: Partial<Omit<TemplateField, 'id'>>) => {
    setFields(prev => prev.map((field, i) => i === index ? { ...field, ...update } : field));
  };

  const removeField = (index: number) => {
    if (fields.length > 1) {
      setFields(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title="Create Template"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.name.trim() || isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Template Name *
          </label>
          <Input
            id="templateName"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter template name (e.g., Character, Location, Item)"
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="templateFolder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Folder (optional)
          </label>
          <Select
            id="templateFolder"
            value={formData.folderId}
            onChange={(e) => setFormData(prev => ({ ...prev, folderId: e.target.value }))}
          >
            <option value="">No Folder</option>
            {templateFolders.map(folder => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Template Fields
            </h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addField}
            >
              Add Field
            </Button>
          </div>

          <div className="space-y-4 max-h-64 overflow-y-auto">
            {fields.map((field, index) => (
              <div key={index} className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Field Name
                        </label>
                        <Input
                          value={field.name}
                          onChange={(e) => updateField(index, { name: e.target.value })}
                          placeholder="Field name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Field Type
                        </label>
                        <Select
                          value={field.type}
                          onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                        >
                          {fieldTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    
                    {field.prompt !== undefined && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Prompt (optional)
                        </label>
                        <Input
                          value={field.prompt || ''}
                          onChange={(e) => updateField(index, { prompt: e.target.value })}
                          placeholder="Help text for this field"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={field.required || false}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        Required
                      </label>
                    </div>
                  </div>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeField(index)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Design Your Template
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Templates define the structure for your entities. Add fields that will be common across entities of this type.
              </p>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
