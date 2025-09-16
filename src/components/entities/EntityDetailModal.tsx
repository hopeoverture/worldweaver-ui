'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { AIImageUpload } from '@/components/ai/AIImageUpload';
import { Entity, Template, Folder, TemplateField, Link } from '@/lib/types';
import { useWorldTemplates } from '@/hooks/query/useWorldTemplates';
import { useWorldFolders } from '@/hooks/query/useWorldFolders';
import { useWorldEntities } from '@/hooks/query/useWorldEntities';
import { useWorldRelationships } from '@/hooks/query/useWorldRelationships';
import { useWorld } from '@/hooks/query/useWorld';
import { useUpdateEntity } from '@/hooks/mutations/useUpdateEntity';
import { useGenerateEntityFields } from '@/hooks/mutations/useGenerateEntityFields';
import { useGenerateEntitySummary } from '@/hooks/mutations/useGenerateEntitySummary';
import { useGenerateImage } from '@/hooks/mutations/useGenerateImage';
import { useToast } from '@/components/ui/ToastProvider';
import { formatDate } from '@/lib/utils';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { AIPromptModal } from '@/components/ai/AIPromptModal';

interface EntityDetailModalProps {
  entity: Entity | null;
  onClose: () => void;
}

export function EntityDetailModal({ entity, onClose }: EntityDetailModalProps) {
  const worldId = entity?.worldId || '';
  const { data: templates = [] } = useWorldTemplates(worldId);
  const { data: folders = [] } = useWorldFolders(worldId);
  const { data: entities = [] } = useWorldEntities(worldId);
  const { data: relationships = [] } = useWorldRelationships(worldId);
  const { data: world } = useWorld(worldId);
  const generateEntityFields = useGenerateEntityFields();
  const generateEntitySummary = useGenerateEntitySummary();
  const generateImage = useGenerateImage();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Entity>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null | undefined>(undefined);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGenerationTarget, setAiGenerationTarget] = useState<'all' | string>('all');
  const [showImageModal, setShowImageModal] = useState(false);
  const updateEntityMut = useUpdateEntity(worldId);
  const { toast } = useToast();

  // Get the template for this entity
  const template = entity ? templates.find(t => t.id === entity.templateId) : null;

  // Get the folder for this entity
  const folder = entity?.folderId ? folders.find(f => f.id === entity.folderId) : null;

  // Get entity links (relationships) - convert to old format temporarily
  const entityLinks = entity ? relationships.filter(r => r.from === entity.id || r.to === entity.id).map(r => ({
    id: r.id,
    fromEntityId: r.from,
    toEntityId: r.to,
    relationshipType: r.relationshipType
  })) : [];

  // Get other entities in the same world for linking
  const worldEntities = entity ? entities.filter((e: any) => e.id !== entity.id) : [];

  useEffect(() => {
    if (entity) {
      setFormData({
        name: entity.name,
        summary: entity.summary,
        folderId: entity.folderId,
        fields: { ...entity.fields }
      });
      setCurrentImageUrl(entity.imageUrl);
      setImageFile(null);
      setAiImageUrl(null);
      setErrors({});
    }
  }, [entity]);

  if (!entity || !template) return null;

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate template fields
    template.fields.forEach(field => {
      if (field.required && !formData.fields?.[field.id]) {
        newErrors[`field_${field.id}`] = `${field.name} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Handle image - upload, AI-generated, or removal
      let finalImageUrl = currentImageUrl;

      if (imageFile) {
        // Upload new image
        const formDataForUpload = new FormData();
        formDataForUpload.append('file', imageFile);

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

        finalImageUrl = urlData.publicUrl;
      } else if (aiImageUrl) {
        // Use AI-generated image URL directly
        finalImageUrl = aiImageUrl;
      } else if (currentImageUrl === null && entity.imageUrl) {
        // User explicitly removed the image
        finalImageUrl = null;
      }

      await updateEntityMut.mutateAsync({
        id: entity.id,
        patch: {
          name: formData.name!,
          folderId: (formData.folderId ?? null) as string | null,
          fields: formData.fields || {},
          imageUrl: finalImageUrl || null,
          // tags and templateId unchanged here
        },
      });
      setIsEditing(false);
      setErrors({});
      setImageFile(null);
      toast({ title: 'Entity updated', variant: 'success' });
    } catch (e) {
      toast({ title: 'Failed to update entity', description: String((e as Error)?.message || e), variant: 'error' });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: entity.name,
      summary: entity.summary,
      folderId: entity.folderId,
      fields: { ...entity.fields }
    });
    setCurrentImageUrl(entity.imageUrl);
    setImageFile(null);
    setAiImageUrl(null);
    setIsEditing(false);
    setErrors({});
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldId]: value
      }
    }));
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setAiImageUrl(null); // Clear AI image when user uploads a file
    if (!file) {
      // If removing image, set current URL to null to indicate removal
      setCurrentImageUrl(null);
    }
  };

  const handleAIImageGenerate = (imageUrl: string) => {
    setAiImageUrl(imageUrl);
    setCurrentImageUrl(imageUrl);
    setImageFile(null); // Clear file when AI generates an image
  };

  const handleRemoveLink = (linkId: string) => {
    // TODO: Replace with useDeleteRelationship mutation
    console.log('Remove link:', linkId);
  };

  const handleAIGenerate = async (prompt: string) => {
    if (!world) {
      console.error('AI Generation failed: World not loaded');
      toast({ title: 'Error', description: 'World not loaded', variant: 'error' });
      return;
    }

    if (!entity) {
      console.error('AI Generation failed: Entity not provided');
      toast({ title: 'Error', description: 'Entity not found', variant: 'error' });
      return;
    }

    if (!template) {
      console.error('AI Generation failed: Template not found', {
        entityTemplateId: entity.templateId,
        entityName: entity.name,
        availableTemplates: templates.map(t => ({ id: t.id, name: t.name })),
        templatesLoaded: templates.length > 0,
        totalTemplatesCount: templates.length
      });

      const hasTemplates = templates.length > 0;
      const templateList = hasTemplates
        ? templates.map(t => t.name).slice(0, 3).join(', ') + (templates.length > 3 ? '...' : '')
        : 'None loaded';

      toast({
        title: 'Template not found',
        description: `This entity references a template that doesn't exist (ID: ${entity.templateId}). ${hasTemplates ? `Available templates: ${templateList}` : 'No templates are loaded for this world.'}`,
        variant: 'error'
      });
      return;
    }

    console.log('Starting AI generation for entity fields', {
      entityName: formData.name || entity.name,
      templateId: template.id,
      templateName: template.name,
      worldId,
      generateAllFields: aiGenerationTarget === 'all',
      specificField: aiGenerationTarget !== 'all' ? aiGenerationTarget : undefined
    });

    try {
      const result = await generateEntityFields.mutateAsync({
        prompt,
        entityName: formData.name || entity.name,
        templateId: template.id,
        existingFields: {
          // Include name and summary from form
          ...(formData.name ? { name: formData.name } : {}),
          ...(formData.summary ? { summary: formData.summary } : {}),

          // Include folder context with actual name
          ...(formData.folderId && folders.length > 0 ? {
            folder: folders.filter(f => f.kind === 'entities').find(f => f.id === formData.folderId)?.name || 'Unknown Folder'
          } : {}),

          // Include template fields with human-readable names (not IDs) - ALWAYS from form
          ...Object.fromEntries(
            Object.entries(formData.fields || {})
              .map(([fieldId, value]) => {
                const field = template?.fields.find(f => f.id === fieldId);
                return field ? [field.name, value] : null;
              })
              .filter(Boolean) as [string, any][]
          )
        },
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

  const handleGenerateSummary = async () => {
    if (!entity || !template || !world) {
      toast({
        title: 'Error',
        description: 'Missing required data for summary generation',
        variant: 'error'
      });
      return;
    }

    try {
      const result = await generateEntitySummary.mutateAsync({
        worldId: entity.worldId,
        entityId: entity.id,
      });

      // Update the form data with the generated summary
      setFormData(prev => ({
        ...prev,
        summary: result.summary
      }));

      // If not in editing mode, we should trigger a save or update the entity directly
      if (!isEditing) {
        try {
          await updateEntityMut.mutateAsync({
            id: entity.id,
            patch: { summary: result.summary }
          });
        } catch (error) {
          // Error handling done by mutation hook
          console.error('Failed to save generated summary:', error);
        }
      }
    } catch (error) {
      // Error handling is done by the mutation hook
      console.error('Summary generation failed:', error);
    }
  };

  const handleGenerateImageInViewMode = async (prompt: string, artStyle?: any) => {
    if (!entity || !template || !world) {
      toast({
        title: 'Error',
        description: 'Missing required data for image generation',
        variant: 'error'
      });
      return;
    }

    try {
      const result = await generateImage.mutateAsync({
        worldId: entity.worldId,
        type: 'entity' as const,
        prompt,
        artStyle,
        entityName: entity.name,
        templateName: template.name,
        entityFields: entity.fields,
        worldName: world.name,
        worldDescription: world.description
      });

      // Update entity with generated image
      try {
        await updateEntityMut.mutateAsync({
          id: entity.id,
          patch: { imageUrl: result.imageUrl }
        });

        // Update local state
        setCurrentImageUrl(result.imageUrl);
        setShowImageModal(false);
      } catch (error) {
        console.error('Failed to save generated image:', error);
      }
    } catch (error) {
      console.error('Image generation failed:', error);
    }
  };

  // Check if required fields are filled for basic validation
  const getRequiredFieldsStatus = () => {
    if (!template) return { hasRequiredFields: false, missingFields: [] };

    const requiredFields = template.fields.filter(f => f.required);
    const missingFields: string[] = [];

    requiredFields.forEach(field => {
      const value = formData.fields?.[field.id] || entity.fields?.[field.id];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field.name);
      }
    });

    return {
      hasRequiredFields: missingFields.length === 0,
      missingFields,
      requiredFields: requiredFields.map(f => f.name)
    };
  };

  // Check if AI context fields are filled for AI generation
  const getAIContextFieldsStatus = () => {
    if (!template) return { hasAIContextFields: false, missingFields: [], aiContextFields: [], totalAIContextFields: 0 };

    const aiContextFields = template.fields.filter(f => f.requireForAIContext);
    const missingFields: string[] = [];

    aiContextFields.forEach(field => {
      const value = formData.fields?.[field.id] || entity.fields?.[field.id];
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

    // Show warning for 'all' generation if AI context fields are missing, but don't block
    if (target === 'all' && totalAIContextFields > 0 && !hasAIContextFields) {
      toast({
        title: 'AI context fields missing',
        description: `For better results, consider filling these AI context fields: ${missingFields.join(', ')}. Generation will proceed but may be less contextually relevant.`,
        variant: 'warning'
      });
    }

    setAiGenerationTarget(target);
    setShowAIModal(true);
  };

  const renderFieldInput = (field: TemplateField) => {
    const value = formData.fields?.[field.id] || '';
    const error = errors[`field_${field.id}`];

    switch (field.type) {
      case 'shortText':
        return (
          <Input
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.prompt}
            className={error ? 'border-red-500' : ''}
          />
        );
      
      case 'longText':
      case 'richText':
        return (
          <Textarea
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.prompt}
            rows={4}
            className={error ? 'border-red-500' : ''}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value as number}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            placeholder={field.prompt}
            className={error ? 'border-red-500' : ''}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={error ? 'border-red-500' : ''}
          >
            <option value="">{field.prompt || 'Select an option'}</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
        );
      
      default:
        return (
          <Input
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.prompt}
            className={error ? 'border-red-500' : ''}
          />
        );
    }
  };

  const renderFieldDisplay = (field: TemplateField) => {
    const value = entity.fields[field.id];
    
    if (!value) {
      return <span className="text-gray-400 italic">Not specified</span>;
    }

    switch (field.type) {
      case 'longText':
      case 'richText':
        return <div className="whitespace-pre-wrap">{value as string}</div>;
      
      case 'number':
        return <span>{String(value)}</span>;
      
      default:
        return <span>{String(value)}</span>;
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Entity Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`text-xl font-semibold ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Entity name"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {entity.name}
              </h2>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Template: {template.name}</span>
              {folder && <span>Folder: {folder.name}</span>}
              <span>Updated {formatDate(entity.updatedAt)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={updateEntityMut.isPending}
                >
                  {updateEntityMut.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                Edit Entity
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Summary</h3>
            <AIGenerateButton
              onClick={handleGenerateSummary}
              disabled={generateEntitySummary.isPending || updateEntityMut.isPending}
              isGenerating={generateEntitySummary.isPending}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              title="Generate a comprehensive summary from all entity details"
            >
              Generate Summary
            </AIGenerateButton>
          </div>
          {isEditing ? (
            <Textarea
              value={formData.summary || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Entity summary..."
              rows={4}
              disabled={generateEntitySummary.isPending}
            />
          ) : (
            <div className="text-gray-700 dark:text-gray-300">
              {(formData.summary !== undefined ? formData.summary : entity.summary) || <span className="text-gray-400 italic">No summary provided</span>}
            </div>
          )}
        </div>

        {/* Image */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Image</h3>
            {!isEditing && (
              <AIGenerateButton
                onClick={() => setShowImageModal(true)}
                disabled={generateImage.isPending || updateEntityMut.isPending}
                isGenerating={generateImage.isPending}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                title="Generate an AI image for this entity"
              >
                Generate Image
              </AIGenerateButton>
            )}
          </div>
          {isEditing ? (
            <AIImageUpload
              value={currentImageUrl || undefined}
              onChange={handleImageChange}
              onAIGenerate={handleAIImageGenerate}
              worldId={worldId}
              label=""
              description="Upload an image or generate one with AI. Drag and drop or click to select."
              error={errors.image}
              disabled={updateEntityMut.isPending}
              aiType="entity"
              entityName={formData.name || entity.name}
              templateName={template.name}
              entityFields={formData.fields || entity.fields}
              worldContext={world ? {
                name: world.name,
                description: world.description,
                genreBlend: world.genreBlend,
                overallTone: world.overallTone,
                keyThemes: world.keyThemes
              } : undefined}
            />
          ) : (
            <div className="text-gray-700 dark:text-gray-300">
              {currentImageUrl ? (
                <div className="max-w-sm">
                  <img
                    src={currentImageUrl}
                    alt={entity.name}
                    className="w-full h-auto rounded-lg border border-gray-200 dark:border-neutral-700"
                  />
                </div>
              ) : (
                <span className="text-gray-400 italic">No image uploaded</span>
              )}
            </div>
          )}
        </div>

        {/* Folder Assignment */}
        {isEditing && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Folder</h3>
            <Select
              value={formData.folderId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, folderId: e.target.value || undefined }))}
            >
              <option value="">No folder</option>
              {folders
                .filter(f => f.worldId === entity.worldId && f.kind === 'entities')
                .map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
            </Select>
          </div>
        )}

        {/* Template Fields */}
        {template.fields.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Details</h3>
              {isEditing && (
                <div className="relative">
                  <AIGenerateButton
                    onClick={() => openAIModal('all')}
                    disabled={generateEntityFields.isPending || !getRequiredFieldsStatus().hasRequiredFields}
                    isGenerating={generateEntityFields.isPending && aiGenerationTarget === 'all'}
                    className={`text-white ${
                      getRequiredFieldsStatus().hasRequiredFields
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    title={
                      getRequiredFieldsStatus().hasRequiredFields
                        ? 'Generate all empty fields using AI'
                        : `Please fill required fields first: ${getRequiredFieldsStatus().missingFields.join(', ')}`
                    }
                  >
                    Generate All Fields
                  </AIGenerateButton>
                  {!getRequiredFieldsStatus().hasRequiredFields && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Warning banner for missing required fields */}
            {isEditing && !getRequiredFieldsStatus().hasRequiredFields && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                  </div>
                  <div className="ml-2">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Required fields needed for AI generation
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Please fill in: <strong>{getRequiredFieldsStatus().missingFields.join(', ')}</strong>
                      <br />
                      <span className="text-xs">AI needs these core details to generate contextually appropriate content.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {template.fields.map(field => (
                <div key={field.id}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {field.name}
                      {field.required && (
                        <span className="text-red-500 ml-1 font-bold" title="Required field">*</span>
                      )}
                    </label>
                    {isEditing && (
                      <AIGenerateButton
                        onClick={() => openAIModal(field.id)}
                        disabled={generateEntityFields.isPending}
                        isGenerating={generateEntityFields.isPending && aiGenerationTarget === field.id}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        title={
                          !getRequiredFieldsStatus().hasRequiredFields
                            ? 'Note: Fill required fields for better AI generation quality'
                            : 'Generate this field using AI'
                        }
                      >
                        Generate
                        {!getRequiredFieldsStatus().hasRequiredFields && (
                          <span className="ml-1 text-xs">⚠️</span>
                        )}
                      </AIGenerateButton>
                    )}
                  </div>

                  {isEditing ? (
                    <div>
                      {renderFieldInput(field)}
                      {errors[`field_${field.id}`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`field_${field.id}`]}</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-700 dark:text-gray-300">
                      {renderFieldDisplay(field)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relationships */}
        {entityLinks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Relationships</h3>
            <div className="space-y-2">
              {entityLinks.map(link => {
                const otherEntityId = link.fromEntityId === entity.id ? link.toEntityId : link.fromEntityId;
                const otherEntity = entities.find((e: any) => e.id === otherEntityId);
                const isOutgoing = link.fromEntityId === entity.id;
                
                if (!otherEntity) return null;
                
                return (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${isOutgoing ? 'bg-blue-500' : 'bg-green-500'}`} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {isOutgoing ? 'to' : 'from'}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {otherEntity.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({link.relationshipType})
                      </span>
                    </div>
                    
                    {isEditing && (
                      <Button
                        onClick={() => handleRemoveLink(link.id)}
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-neutral-700">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>

      {/* AI Generation Modal */}
      <AIPromptModal
        open={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerate={handleAIGenerate}
        title={
          aiGenerationTarget === 'all'
            ? 'Generate All Entity Fields'
            : `Generate ${template?.fields.find(f => f.id === aiGenerationTarget)?.name || 'Field'}`
        }
        description={
          aiGenerationTarget === 'all'
            ? `Generate values for all ${template?.fields.length || 0} fields in this ${template?.name}. The AI will use your world context and any existing field values.`
            : `Generate a value for the "${template?.fields.find(f => f.id === aiGenerationTarget)?.name}" field. The AI will consider your world context and other field values.`
        }
        placeholder={
          aiGenerationTarget === 'all'
            ? `Describe what kind of ${template?.name.toLowerCase()} you want to update...`
            : `Describe what you want for the ${template?.fields.find(f => f.id === aiGenerationTarget)?.name} field...`
        }
        isGenerating={generateEntityFields.isPending}
      />

      {/* Image Generation Modal */}
      <AIPromptModal
        open={showImageModal}
        onClose={() => setShowImageModal(false)}
        onGenerate={handleGenerateImageInViewMode}
        title={`Generate Image for ${entity?.name || 'Entity'}`}
        description={`Generate an AI image for this ${template?.name.toLowerCase() || 'entity'}. Select an art style and provide an optional description.`}
        placeholder={`Describe how ${entity?.name || 'this entity'} should look...`}
        isGenerating={generateImage.isPending}
        maxLength={1000}
        showArtStyleSelection={true}
      />
    </Modal>
  );
}
