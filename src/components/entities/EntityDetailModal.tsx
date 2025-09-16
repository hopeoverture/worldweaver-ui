'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { useCreateEntity } from '@/hooks/mutations/useCreateEntity';
import { useGenerateEntityFields } from '@/hooks/mutations/useGenerateEntityFields';
import { useGenerateEntitySummary } from '@/hooks/mutations/useGenerateEntitySummary';
import { useGenerateImage } from '@/hooks/mutations/useGenerateImage';
import { useToast } from '@/components/ui/ToastProvider';
import { formatDate } from '@/lib/utils';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { AIPromptModal } from '@/components/ai/AIPromptModal';
// Note: StepChooseTemplate component needs to be created or moved to a different location
// For now, let's create a simple inline template selection component

interface EntityDetailModalProps {
  entity: Entity | null;  // null for creation mode
  worldId: string;        // Required for both modes
  initialFolderId?: string;  // Pre-select folder in creation
  initialTemplateId?: string; // Pre-select template in creation
  open: boolean;
  onClose: () => void;
}

export function EntityDetailModal({
  entity,
  worldId: propWorldId,
  initialFolderId,
  initialTemplateId,
  open,
  onClose
}: EntityDetailModalProps) {
  const worldId = propWorldId || entity?.worldId || '';
  const isCreating = !entity;
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
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<Partial<Entity> | null>(null);
  const updateEntityMut = useUpdateEntity(worldId);
  const createEntityMut = useCreateEntity(worldId);
  const { toast } = useToast();

  // Template selection state for creation mode
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(() => {
    if (entity) return templates.find(t => t.id === entity.templateId) || null;
    if (initialTemplateId) return templates.find(t => t.id === initialTemplateId) || null;
    return null;
  });

  // Step state for creation flow
  const [step, setStep] = useState<'template' | 'form'>(() => {
    if (entity || selectedTemplate) return 'form';
    return 'template';
  });

  // Get the template for this entity (edit mode) or selected template (creation mode)
  const template = isCreating ? selectedTemplate : templates.find(t => t.id === entity?.templateId);

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
      // Edit mode - populate with existing entity data
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
      setIsEditing(false); // Start in view mode for existing entities

      // Set initial saved state for change tracking
      lastSavedDataRef.current = {
        name: entity.name,
        summary: entity.summary,
        folderId: entity.folderId,
        fields: { ...entity.fields }
      };
      setHasUnsavedChanges(false);
    } else if (isCreating) {
      // Creation mode - initialize with defaults
      setFormData({
        name: '',
        summary: '',
        folderId: initialFolderId || '',
        fields: {}
      });
      setCurrentImageUrl(null);
      setImageFile(null);
      setAiImageUrl(null);
      setErrors({});
      setIsEditing(true); // Start in edit mode for creation

      // No saved state for creation mode
      lastSavedDataRef.current = null;
      setHasUnsavedChanges(false);
    }
  }, [entity, isCreating, initialFolderId]);

  // Helper to check if data has changed from last saved state
  const hasDataChanged = useCallback(() => {
    if (!lastSavedDataRef.current) return true;

    const current = lastSavedDataRef.current;
    return (
      formData.name !== current.name ||
      formData.summary !== current.summary ||
      formData.folderId !== current.folderId ||
      JSON.stringify(formData.fields) !== JSON.stringify(current.fields)
    );
  }, [formData]);

  // Auto-save functionality - debounced save on form changes
  const debouncedAutoSave = useCallback(async () => {
    if (!entity || isCreating || !autoSaveEnabled || !isEditing || !hasUnsavedChanges) return;
    if (!template) return;

    // Don't auto-save if there are validation errors
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    template.fields.forEach(field => {
      if (field.required && !formData.fields?.[field.id]) {
        newErrors[`field_${field.id}`] = `${field.name} is required`;
      }
    });
    if (Object.keys(newErrors).length > 0) return;

    try {
      await updateEntityMut.mutateAsync({
        id: entity.id,
        patch: {
          name: formData.name!,
          folderId: formData.folderId || undefined,
          fields: formData.fields || {},
          summary: formData.summary || undefined,
        },
      });

      // Update last saved state and clear unsaved changes flag
      lastSavedDataRef.current = { ...formData };
      setHasUnsavedChanges(false);
      setErrors({});
    } catch (error) {
      // Silently fail auto-saves, user can manually save
      console.error('Auto-save failed:', error);
    }
  }, [entity, isCreating, autoSaveEnabled, isEditing, hasUnsavedChanges, formData, template, updateEntityMut]);

  // Track changes to formData and set unsaved flag
  useEffect(() => {
    if (!entity || isCreating || !autoSaveEnabled) return;

    const changed = hasDataChanged();
    setHasUnsavedChanges(changed);
  }, [entity, isCreating, autoSaveEnabled, hasDataChanged]);

  // Debounced auto-save effect - only runs when there are unsaved changes
  useEffect(() => {
    if (!entity || isCreating || !autoSaveEnabled || !isEditing || !hasUnsavedChanges) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      debouncedAutoSave();
    }, 2000); // 2 second debounce

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, debouncedAutoSave, entity, isCreating, autoSaveEnabled, isEditing]);

  // Enable auto-save after initial load to prevent immediate saves
  useEffect(() => {
    if (entity && !isCreating) {
      const timer = setTimeout(() => setAutoSaveEnabled(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setAutoSaveEnabled(false);
    }
  }, [entity, isCreating]);

  // Don't render if we need a template but don't have one
  if (step === 'form' && !template) return null;

  // Don't render if modal is not open
  if (!open) return null;

  const handleSave = async () => {
    if (!template) return;

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
      } else if (currentImageUrl === null && entity?.imageUrl) {
        // User explicitly removed the image
        finalImageUrl = null;
      }

      if (isCreating) {
        // Create new entity
        await createEntityMut.mutateAsync({
          name: formData.name!,
          templateId: template.id,
          folderId: formData.folderId && formData.folderId.trim() !== '' ? formData.folderId : undefined,
          fields: formData.fields || {},
          imageUrl: finalImageUrl || undefined,
        });
        toast({ title: 'Entity created', description: formData.name, variant: 'success' });
        onClose();
      } else if (entity) {
        // Update existing entity
        await updateEntityMut.mutateAsync({
          id: entity.id,
          patch: {
            name: formData.name!,
            folderId: formData.folderId || undefined,
            fields: formData.fields || {},
            imageUrl: finalImageUrl || null,
          // tags and templateId unchanged here
        },
        });
        setIsEditing(false);
        setErrors({});
        setImageFile(null);
        setAutoSaveEnabled(false); // Disable auto-save when manually saving

        // Update last saved state and clear unsaved changes
        lastSavedDataRef.current = { ...formData };
        setHasUnsavedChanges(false);

        toast({ title: 'Entity updated', variant: 'success' });

        // Re-enable auto-save after a short delay
        setTimeout(() => setAutoSaveEnabled(true), 1000);
      }
    } catch (e) {
      const errorMessage = isCreating ? 'Failed to create entity' : 'Failed to update entity';
      toast({ title: errorMessage, description: String((e as Error)?.message || e), variant: 'error' });
    }
  };

  const handleCancel = () => {
    if (isCreating) {
      // In creation mode, just close the modal
      onClose();
    } else if (entity) {
      // In edit mode, revert to original data
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
      setAutoSaveEnabled(false); // Disable auto-save when canceling

      // Reset to last saved state
      if (lastSavedDataRef.current) {
        lastSavedDataRef.current = {
          name: entity.name,
          summary: entity.summary,
          folderId: entity.folderId,
          fields: { ...entity.fields }
        };
      }
      setHasUnsavedChanges(false);

      // Re-enable auto-save after a short delay
      setTimeout(() => setAutoSaveEnabled(true), 1000);
    }
  };

  // Template selection for creation mode
  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setStep('form');
    }
  };

  const handleBackToTemplateSelection = () => {
    setStep('template');
    setSelectedTemplate(null);
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
    toast({ title: 'Image generated', description: 'AI image has been set for this entity.', variant: 'success' });
  };

  const handleRemoveLink = (linkId: string) => {
    // TODO: Replace with useDeleteRelationship mutation
    console.log('Remove link:', linkId);
  };

  // Build a contextual prompt from entity data
  const buildImagePromptFromContext = (entityName: string, template: Template, entityFields: Record<string, any>, customPrompt: string = '') => {
    const parts: string[] = [];

    // Start with entity name and template type
    if (entityName && entityName !== 'New Entity') {
      parts.push(`${entityName}, a ${template.name.toLowerCase()}`);
    } else {
      parts.push(`A ${template.name.toLowerCase()}`);
    }

    // Add significant field values
    if (entityFields) {
      template.fields.forEach(field => {
        const value = entityFields[field.id];
        if (value && typeof value === 'string' && value.trim()) {
          // Include important visual or descriptive fields
          if (field.name.toLowerCase().includes('appearance') ||
              field.name.toLowerCase().includes('description') ||
              field.name.toLowerCase().includes('look') ||
              field.name.toLowerCase().includes('color') ||
              field.name.toLowerCase().includes('size') ||
              field.name.toLowerCase().includes('style') ||
              field.name.toLowerCase().includes('outfit') ||
              field.name.toLowerCase().includes('clothing') ||
              field.name.toLowerCase().includes('feature')) {
            parts.push(value.trim());
          }
        }
      });
    }

    // Add custom prompt if provided
    if (customPrompt && customPrompt.trim()) {
      parts.push(customPrompt.trim());
    }

    // Ensure we have at least a basic description
    if (parts.length === 1) {
      parts.push('detailed and visually striking');
    }

    return parts.join(', ');
  };

  // Generate image using context without requiring user prompt
  const handleGenerateImageFromContext = async (artStyle?: any) => {
    if (!template || !world) {
      toast({
        title: 'Error',
        description: 'Missing required data for image generation',
        variant: 'error'
      });
      return;
    }

    try {
      const entityName = isCreating ? (formData.name || 'New Entity') : entity!.name;
      const entityFields = isCreating ? formData.fields : entity!.fields;

      // Build a contextual prompt from the entity data
      const contextualPrompt = buildImagePromptFromContext(entityName, template, entityFields || {}, '');

      console.log('Context-based image generation:', {
        entityName,
        templateName: template.name,
        entityFields: entityFields || {},
        contextualPrompt,
        promptLength: contextualPrompt.length
      });

      const result = await generateImage.mutateAsync({
        worldId: worldId,
        type: 'entity' as const,
        prompt: contextualPrompt,
        artStyle,
        entityName,
        templateName: template.name,
        entityFields: entityFields || {},
        worldName: world.name,
        worldDescription: world.description
      });

      if (isCreating) {
        // For creation mode, set the image in the form
        setAiImageUrl(result.imageUrl);
        setCurrentImageUrl(result.imageUrl);
        setImageFile(null);
        toast({ title: 'Image generated', description: 'AI image has been generated from entity context.', variant: 'success' });
      } else {
        // For edit mode, update the entity immediately
        await updateEntityMut.mutateAsync({
          id: entity!.id,
          patch: { imageUrl: result.imageUrl }
        });

        // Update local state
        setCurrentImageUrl(result.imageUrl);
        toast({ title: 'Image updated', description: 'Entity image has been updated with context-based AI image.', variant: 'success' });
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      toast({ title: 'Image generation failed', description: 'Failed to generate AI image. Please try again.', variant: 'error' });
    }
  };

  const handleAIGenerate = async (prompt: string) => {
    if (!world) {
      console.error('AI Generation failed: World not loaded');
      toast({ title: 'Error', description: 'World not loaded', variant: 'error' });
      return;
    }

    // Validate prompt is not empty
    if (!prompt || prompt.trim().length === 0) {
      toast({
        title: 'Prompt required',
        description: 'Please provide a description for the AI generation.',
        variant: 'error'
      });
      return;
    }

    // In creation mode, entity is null - this is expected
    if (!isCreating && !entity) {
      console.error('AI Generation failed: Entity not provided for edit mode');
      toast({ title: 'Error', description: 'Entity not found', variant: 'error' });
      return;
    }

    if (!template) {
      console.error('AI Generation failed: Template not found', {
        entityTemplateId: entity?.templateId,
        entityName: entity?.name || formData.name,
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
        description: `${isCreating ? 'Please select a template first.' : `This entity references a template that doesn't exist (ID: ${entity?.templateId}).`} ${hasTemplates ? `Available templates: ${templateList}` : 'No templates are loaded for this world.'}`,
        variant: 'error'
      });
      return;
    }

    console.log('Starting AI generation for entity fields', {
      entityName: formData.name || entity?.name,
      templateId: template.id,
      templateName: template.name,
      worldId,
      generateAllFields: aiGenerationTarget === 'all',
      specificField: aiGenerationTarget !== 'all' ? aiGenerationTarget : undefined,
      isCreating
    });

    try {
      const result = await generateEntityFields.mutateAsync({
        prompt,
        entityName: formData.name || entity?.name || 'New Entity',
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
    if (!template || !world) {
      toast({
        title: 'Error',
        description: 'Missing required data for summary generation',
        variant: 'error'
      });
      return;
    }

    // For creation mode, we can't generate summary until entity is created
    if (isCreating) {
      toast({
        title: 'Cannot generate summary',
        description: 'Please create the entity first, then you can generate a summary.',
        variant: 'warning'
      });
      return;
    }

    if (!entity) {
      toast({
        title: 'Error',
        description: 'Entity not found',
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

  const handleGenerateImageInViewMode = async (customPrompt: string = '', artStyle?: any) => {
    if (!template || !world) {
      toast({
        title: 'Error',
        description: 'Missing required data for image generation',
        variant: 'error'
      });
      return;
    }

    try {
      const entityName = isCreating ? (formData.name || 'New Entity') : entity!.name;
      const entityFields = isCreating ? formData.fields : entity!.fields;

      // Build a contextual prompt from the entity data
      const contextualPrompt = buildImagePromptFromContext(entityName, template, entityFields || {}, customPrompt);

      const result = await generateImage.mutateAsync({
        worldId: worldId,
        type: 'entity' as const,
        prompt: contextualPrompt,
        artStyle,
        entityName,
        templateName: template.name,
        entityFields: entityFields || {},
        worldName: world.name,
        worldDescription: world.description
      });

      if (isCreating) {
        // For creation mode, set the image in the form
        setAiImageUrl(result.imageUrl);
        setCurrentImageUrl(result.imageUrl);
        setImageFile(null);
        setShowImageModal(false);
        toast({ title: 'Image generated', description: 'AI image has been generated for your new entity.', variant: 'success' });
      } else {
        // For edit mode, update the entity immediately
        await updateEntityMut.mutateAsync({
          id: entity!.id,
          patch: { imageUrl: result.imageUrl }
        });

        // Update local state
        setCurrentImageUrl(result.imageUrl);
        setShowImageModal(false);
        toast({ title: 'Image updated', description: 'Entity image has been updated with AI-generated image.', variant: 'success' });
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      toast({ title: 'Image generation failed', description: 'Failed to generate AI image. Please try again.', variant: 'error' });
    }
  };

  // Check if required fields are filled for basic validation
  const getRequiredFieldsStatus = () => {
    if (!template) return { hasRequiredFields: false, missingFields: [] };

    const requiredFields = template.fields.filter(f => f.required);
    const missingFields: string[] = [];

    requiredFields.forEach(field => {
      const value = formData.fields?.[field.id] || entity?.fields?.[field.id];
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
      const value = formData.fields?.[field.id] || entity?.fields?.[field.id];
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
    const value = entity?.fields[field.id];
    
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

  // Modal title based on mode and step
  const getModalTitle = () => {
    if (isCreating) {
      if (step === 'template') return 'Create New Entity';
      if (step === 'form' && selectedTemplate) return `Create ${selectedTemplate.name}`;
      return 'Create New Entity';
    } else {
      return entity?.name || 'Entity Details';
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={getModalTitle()}>
      <div className="min-h-[400px]">
        {/* Template Selection Step (Creation Mode Only) */}
        {isCreating && step === 'template' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Choose a Template
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select a template to define the structure for your new entity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className="p-4 border border-gray-200 dark:border-neutral-700 rounded-lg hover:border-brand-500 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-left"
                >
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {template.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {template.fields.length} field{template.fields.length !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>

            {templates.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No templates available. Please create a template first.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Form Step (Both Creation and Edit Modes) */}
        {step === 'form' && template && (
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
                {entity?.name || formData.name || 'New Entity'}
              </h2>
            )}

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Template: {template.name}</span>
              {folder && <span>Folder: {folder.name}</span>}
              {!isCreating && entity?.updatedAt && <span>Updated {formatDate(entity.updatedAt)}</span>}
              {isCreating && step === 'form' && (
                <Button
                  onClick={handleBackToTemplateSelection}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Change Template
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={updateEntityMut.isPending || createEntityMut.isPending}
                >
                  {isCreating
                    ? (createEntityMut.isPending ? 'Creating...' : 'Create Entity')
                    : (updateEntityMut.isPending ? 'Saving...' : 'Save Changes')
                  }
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
              disabled={!entity || generateEntitySummary.isPending || updateEntityMut.isPending}
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
              {(formData.summary !== undefined ? formData.summary : entity?.summary) || <span className="text-gray-400 italic">No summary provided</span>}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Entity Image
                </label>
                <AIGenerateButton
                  onClick={() => handleGenerateImageFromContext()}
                  disabled={generateImage.isPending}
                  isGenerating={generateImage.isPending}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Generate from Context
                </AIGenerateButton>
              </div>

              <AIImageUpload
              value={currentImageUrl || undefined}
              onChange={handleImageChange}
              onAIGenerate={handleAIImageGenerate}
              worldId={worldId}
              label=""
              description="Upload an image or use 'Generate with Prompt' for custom AI generation. Drag and drop or click to select."
              error={errors.image}
              disabled={updateEntityMut.isPending}
              aiType="entity"
              entityName={formData.name || entity?.name}
              templateName={template.name}
              entityFields={formData.fields || entity?.fields}
              worldContext={world ? {
                name: world.name,
                description: world.description,
                genreBlend: world.genreBlend,
                overallTone: world.overallTone,
                keyThemes: world.keyThemes
              } : undefined}
            />
            </div>
          ) : (
            <div className="text-gray-700 dark:text-gray-300">
              {currentImageUrl ? (
                <div className="max-w-sm">
                  <img
                    src={currentImageUrl}
                    alt={entity?.name || formData.name || 'Entity'}
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
                .filter(f => f.worldId === worldId && f.kind === 'entities')
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
                const otherEntityId = link.fromEntityId === entity?.id ? link.toEntityId : link.fromEntityId;
                const otherEntity = entities.find((e: any) => e.id === otherEntityId);
                const isOutgoing = link.fromEntityId === entity?.id;
                
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
