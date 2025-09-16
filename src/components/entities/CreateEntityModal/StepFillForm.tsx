'use client';
import { useState } from 'react';
import { Template, Entity, Link, TemplateField } from '@/lib/types';
import { useWorldFolders } from '@/hooks/query/useWorldFolders';
import { useWorld } from '@/hooks/query/useWorld';
import { useGenerateEntityFields } from '@/hooks/mutations/useGenerateEntityFields';
import { sanitizeTemplateField, validateJsonField } from '@/lib/security';
import { logError } from '@/lib/logging';
import { LinkEditor } from './LinkEditor';
import { FieldControls } from './FieldControls';
import { Button } from '../../ui/Button';
import { AIImageUpload } from '@/components/ai/AIImageUpload';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { AIPromptModal } from '@/components/ai/AIPromptModal';

interface StepFillFormProps {
  template: Template;
  worldId: string;
  initialFolderId?: string;
  onSave: (entityData: Omit<Entity, 'id' | 'updatedAt'>) => void;
  onBack: () => void;
}

export function StepFillForm({ template, worldId, initialFolderId, onSave, onBack }: StepFillFormProps) {
  const { data: folders = [] } = useWorldFolders(worldId);
  const { data: world } = useWorld(worldId);
  const generateEntityFields = useGenerateEntityFields();
  const [formData, setFormData] = useState({
    name: '',
    summary: '',
    folderId: initialFolderId || '', // Use initialFolderId if provided, otherwise default to no folder
    fields: {} as Record<string, any>,
    links: [] as Link[],
    imageFile: null as File | null,
    aiImageUrl: null as string | null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGenerationTarget, setAiGenerationTarget] = useState<'all' | string>('all');

  // Get entity folders for this world
  const entityFolders = folders.filter(f => f.kind === 'entities');

  const handleFieldChange = (fieldId: string, value: any) => {
    // Find the field definition to get its type
    const field = template.fields.find(f => f.id === fieldId);
    const fieldType = field?.type || 'shortText';
    
    // Sanitize the value based on field type
    const sanitizedValue = sanitizeTemplateField(fieldType, value);
    
    // Additional validation for rich text and long text fields
    if (fieldType === 'richText' || fieldType === 'longText') {
      const validation = validateJsonField(sanitizedValue);
      if (!validation.isValid && validation.error) {
        setErrors(prev => ({
          ...prev,
          [fieldId]: validation.error!
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldId]: sanitizedValue
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

  const handleImageChange = (file: File | null) => {
    setFormData(prev => ({
      ...prev,
      imageFile: file,
      aiImageUrl: null // Clear AI image when user uploads a file
    }));
  };

  const handleAIImageGenerate = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      aiImageUrl: imageUrl,
      imageFile: null // Clear file when AI generates an image
    }));
  };

  const handleAIGenerate = async (prompt: string) => {
    if (!world) return;

    try {
      const result = await generateEntityFields.mutateAsync({
        prompt,
        entityName: formData.name || undefined,
        templateId: template.id,
        existingFields: formData.fields,
        worldId,
        generateAllFields: aiGenerationTarget === 'all',
        specificField: aiGenerationTarget !== 'all' ? aiGenerationTarget : undefined
      });

      // Update form data with generated fields
      setFormData(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          ...result.fields
        }
      }));

      setShowAIModal(false);
    } catch (error) {
      // Error handling is done by the mutation hook
      console.error('AI generation failed:', error);
    }
  };

  // Check AI context fields for AI generation guidance
  const getAIContextFieldsStatus = () => {
    const aiContextFields = template.fields.filter(f => f.requireForAIContext);
    const missingFields: string[] = [];

    aiContextFields.forEach(field => {
      const value = formData.fields[field.id];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field.name);
      }
    });

    return {
      hasAIContextFields: missingFields.length === 0,
      missingFields,
      aiContextFields: aiContextFields.map(f => f.name),
      totalAIContextFields: aiContextFields.length
    };
  };

  const openAIModal = (target: 'all' | string) => {
    const { hasAIContextFields, missingFields, totalAIContextFields } = getAIContextFieldsStatus();

    // Show warning but don't block if AI context fields are missing
    if (target === 'all' && totalAIContextFields > 0 && !hasAIContextFields) {
      // Don't block, just show a toast warning
      console.warn('AI context fields missing for optimal generation:', missingFields);
    }

    setAiGenerationTarget(target);
    setShowAIModal(true);
  };


  // Get status of required fields for AI generation and validation
  const getRequiredFieldsStatus = () => {
    const requiredFields = template.fields.filter(f => f.required);
    const missingFields: string[] = [];

    requiredFields.forEach(field => {
      const value = formData.fields[field.id];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field.name);
      }
    });

    return {
      hasRequiredFields: missingFields.length === 0,
      missingFields,
      requiredFields
    };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate required template fields
    template.fields.forEach(field => {
      const value = formData.fields[field.id];
      if (field.required && (!value || value.toString().trim() === '')) {
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
      // Handle image - either uploaded file or AI-generated URL
      let imageUrl: string | undefined = undefined;

      if (formData.imageFile) {
        // Upload user-provided image
        const formDataForUpload = new FormData();
        formDataForUpload.append('file', formData.imageFile);

        const response = await fetch(`/api/worlds/${worldId}/files/upload?kind=entity-images`, {
          method: 'POST',
          body: formDataForUpload,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const result = await response.json();

        // Get public URL for the uploaded image
        const { createClient } = await import('@/lib/supabase/browser');
        const supabase = createClient();
        const { data: urlData } = supabase.storage
          .from('world-assets')
          .getPublicUrl(result.file.path);

        imageUrl = urlData.publicUrl;
      } else if (formData.aiImageUrl) {
        // Use AI-generated image URL directly
        imageUrl = formData.aiImageUrl;
      }

      await onSave({
        worldId,
        templateId: template.id,
        folderId: formData.folderId,
        name: formData.name.trim(),
        summary: formData.summary.trim(),
        fields: formData.fields,
        links: formData.links,
        imageUrl,
      });
    } catch (error) {
      logError('Error saving entity', error as Error, {
        worldId,
        templateId: template.id,
        action: 'save_entity',
        component: 'StepFillForm',
        metadata: { entityName: formData.name.trim(), folderId: formData.folderId }
      });
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

        {/* Image Upload */}
        <AIImageUpload
          value={formData.aiImageUrl || undefined}
          onChange={handleImageChange}
          onAIGenerate={handleAIImageGenerate}
          worldId={worldId}
          label="Entity Image"
          description="Upload an image or generate one with AI. Drag and drop or click to select."
          error={errors.image}
          disabled={isSubmitting}
          aiType="entity"
          entityName={formData.name}
          templateName={template.name}
          entityFields={formData.fields}
          worldContext={world ? {
            name: world.name,
            description: world.description,
            genreBlend: world.genreBlend,
            overallTone: world.overallTone,
            keyThemes: world.keyThemes
          } : undefined}
        />

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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Template Fields</h4>
              <AIGenerateButton
                onClick={() => openAIModal('all')}
                disabled={generateEntityFields.isPending || !getRequiredFieldsStatus().hasRequiredFields}
                isGenerating={generateEntityFields.isPending && aiGenerationTarget === 'all'}
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400"
                title={
                  !getRequiredFieldsStatus().hasRequiredFields
                    ? `Fill required fields first: ${getRequiredFieldsStatus().missingFields.join(', ')}`
                    : getAIContextFieldsStatus().totalAIContextFields > 0 && !getAIContextFieldsStatus().hasAIContextFields
                    ? `Consider filling AI context fields for better results: ${getAIContextFieldsStatus().missingFields.join(', ')}`
                    : 'Generate values for all fields using AI'
                }
              >
                Generate All Fields
              </AIGenerateButton>
            </div>

            {/* Field legend */}
            {(template.fields.some(f => f.required) || template.fields.some(f => f.requireForAIContext)) && (
              <div className="text-xs text-gray-600 dark:text-gray-400 flex gap-4">
                {template.fields.some(f => f.required) && (
                  <span className="flex items-center gap-1">
                    <span className="text-red-500">*</span>
                    Required
                  </span>
                )}
                {template.fields.some(f => f.requireForAIContext) && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    AI Context
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Warning banners */}
          {!getRequiredFieldsStatus().hasRequiredFields && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Required fields needed for AI generation
                  </h3>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                    Fill these required fields first to enable AI generation: <strong>{getRequiredFieldsStatus().missingFields.join(', ')}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI context fields guidance */}
          {getRequiredFieldsStatus().hasRequiredFields && getAIContextFieldsStatus().totalAIContextFields > 0 && !getAIContextFieldsStatus().hasAIContextFields && (
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    AI context fields for better results
                  </h3>
                  <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                    Consider filling these fields for more contextual AI generation: <strong>{getAIContextFieldsStatus().missingFields.join(', ')}</strong>
                  </p>
                  <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                    AI generation will work without these, but filling them helps create more accurate content.
                  </p>
                </div>
              </div>
            </div>
          )}

          {template.fields.map(field => (
            <div key={field.id}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.name}
                  {field.required && (
                    <span className="text-red-500 ml-1" title="Required field">*</span>
                  )}
                  {field.requireForAIContext && (
                    <span className="text-purple-500 ml-1" title="AI Context field - helps generate better content">
                      <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    ({field.type})
                  </span>
                </label>
                <AIGenerateButton
                  onClick={() => openAIModal(field.id)}
                  disabled={generateEntityFields.isPending || !getRequiredFieldsStatus().hasRequiredFields}
                  isGenerating={generateEntityFields.isPending && aiGenerationTarget === field.id}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                  title={
                    !getRequiredFieldsStatus().hasRequiredFields
                      ? `Fill required fields first: ${getRequiredFieldsStatus().missingFields.join(', ')}`
                      : `Generate ${field.name} using AI`
                  }
                >
                  Generate
                </AIGenerateButton>
              </div>
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

      {/* AI Generation Modal */}
      <AIPromptModal
        open={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerate={handleAIGenerate}
        title={
          aiGenerationTarget === 'all'
            ? 'Generate All Entity Fields'
            : `Generate ${template.fields.find(f => f.id === aiGenerationTarget)?.name || 'Field'}`
        }
        description={
          aiGenerationTarget === 'all'
            ? `Generate values for all ${template.fields.length} fields in this ${template.name}. The AI will use your world context and any existing field values. You can leave the prompt empty to generate based on context alone.`
            : `Generate a value for the "${template.fields.find(f => f.id === aiGenerationTarget)?.name}" field. The AI will consider your world context and other field values. You can leave the prompt empty to generate based on context alone.`
        }
        placeholder={
          aiGenerationTarget === 'all'
            ? `Optional: Describe what kind of ${template.name.toLowerCase()} you want to create...`
            : `Optional: Describe what you want for the ${template.fields.find(f => f.id === aiGenerationTarget)?.name} field...`
        }
        isGenerating={generateEntityFields.isPending}
      />
    </form>
  );
}
