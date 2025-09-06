'use client';
import { useState } from 'react';
import { Template, Entity, Link, TemplateField } from '@/lib/types';
import { useStore } from '@/lib/store';
import { LinkEditor } from './LinkEditor';
import { FieldControls } from './FieldControls';
import { Button } from '../../ui/Button';

interface StepFillFormProps {
  template: Template;
  worldId: string;
  onSave: (entityData: Omit<Entity, 'id' | 'updatedAt'>) => void;
  onBack: () => void;
}

export function StepFillForm({ template, worldId, onSave, onBack }: StepFillFormProps) {
  const { folders } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    summary: '',
    folderId: template.folderId || '', // Use template's folder as default
    fields: {} as Record<string, any>,
    links: [] as Link[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get entity folders for this world
  const entityFolders = folders.filter(f => f.worldId === worldId && f.kind === 'entities');

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldId]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate required template fields (if any have validation rules)
    template.fields.forEach(field => {
      const value = formData.fields[field.id];
      if (field.name.toLowerCase().includes('required') && (!value || value.toString().trim() === '')) {
        newErrors[field.id] = `${field.name} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSave({
        worldId,
        templateId: template.id,
        folderId: formData.folderId,
        name: formData.name.trim(),
        summary: formData.summary.trim(),
        fields: formData.fields,
        links: formData.links,
      });
    } catch (error) {
      console.error('Error saving entity:', error);
      setErrors({ submit: 'Failed to save entity. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: TemplateField) => {
    const value = formData.fields[field.id] || '';
    const hasError = !!errors[field.id];
    
    const baseClasses = `block w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${
      hasError 
        ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/20' 
        : 'border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'
    } placeholder:text-gray-400 dark:placeholder:text-neutral-500`;

    switch (field.type) {
      case 'shortText':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseClasses}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        );
        
      case 'longText':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            rows={3}
            className={baseClasses}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        );
        
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.valueAsNumber || '')}
            className={baseClasses}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        );
        
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseClasses}
          >
            <option value="">Select {field.name.toLowerCase()}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
        
      case 'multiSelect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter(v => v !== option);
                    handleFieldChange(field.id, newValues);
                  }}
                  className="h-4 w-4 text-brand-600 border-gray-300 rounded focus:ring-brand-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );
        
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseClasses}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template info */}
      <div className="bg-brand-50 dark:bg-brand-950/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-brand-900 dark:text-brand-100">
              Creating: {template.name}
            </h3>
            <p className="text-sm text-brand-700 dark:text-brand-300">
              {template.fields.length} {template.fields.length === 1 ? 'field' : 'fields'} to fill
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Change Template
          </Button>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{errors.submit}</p>
        </div>
      )}

      {/* Basic fields */}
      <div className="space-y-4">
        <div>
          <label htmlFor="entity-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="entity-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`block w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${
              errors.name 
                ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/20' 
                : 'border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'
            } placeholder:text-gray-400 dark:placeholder:text-neutral-500`}
            placeholder="Enter entity name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="entity-summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Summary
          </label>
          <textarea
            id="entity-summary"
            value={formData.summary}
            onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
            rows={3}
            className="block w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            placeholder="Enter a brief description"
          />
        </div>

        {/* Folder Selection - Make it more prominent */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <label htmlFor="entity-folder" className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Folder Organization
            </span>
          </label>
          <select
            id="entity-folder"
            value={formData.folderId}
            onChange={(e) => setFormData(prev => ({ ...prev, folderId: e.target.value }))}
            className="block w-full rounded-md border border-blue-300 dark:border-blue-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
          >
            <option value="">📋 No folder (appears in main grid below folders)</option>
            {entityFolders.map(folder => (
              <option key={folder.id} value={folder.id}>
                📁 {folder.name} ({folder.count} {folder.count === 1 ? 'entity' : 'entities'})
              </option>
            ))}
          </select>
          <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">💡 Folder Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
              <li><strong>With folder:</strong> Entity appears inside the selected folder</li>
              <li><strong>No folder:</strong> Entity appears in the main grid below all folders</li>
              <li>You can organize entities by type, importance, or any system you prefer</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Template fields */}
      {template.fields.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Template Fields</h4>
          {template.fields.map(field => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {field.name}
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                  ({field.type})
                </span>
              </label>
              {renderField(field)}
              {errors[field.id] && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[field.id]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Links section */}
      <LinkEditor
        worldId={worldId}
        links={formData.links}
        onChange={(links) => setFormData(prev => ({ ...prev, links }))}
      />

      {/* Submit buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Entity'}
        </Button>
      </div>
    </form>
  );
}
