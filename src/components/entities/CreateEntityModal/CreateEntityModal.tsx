'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useWorldFolders } from '@/hooks/query/useWorldFolders';
import { useWorldTemplates } from '@/hooks/query/useWorldTemplates';
import { useCreateEntity } from '@/hooks/mutations/useCreateEntity';
import { StepChooseTemplate } from './StepChooseTemplate';
import { StepFillForm } from './StepFillForm';
import { Entity, Template } from '@/lib/types';
import { useToast } from '@/components/ui/ToastProvider';
import { logError } from '@/lib/logging';

interface CreateEntityModalProps {
  open: boolean;
  worldId: string;
  folderId?: string; // Optional folder to pre-select
  onClose: () => void;
}

export function CreateEntityModal({ open, worldId, folderId, onClose }: CreateEntityModalProps) {
  const { data: folders = [] } = useWorldFolders(worldId);
  const { data: worldTemplates = [] } = useWorldTemplates(worldId);
  const createEntity = useCreateEntity(worldId);
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const worldFolders = folders.filter(f => f.kind === 'entities');

  const handleSelectTemplate = (templateId: string) => {
    const template = worldTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setStep(2);
    }
  };

  const handleSave = async (entityData: Omit<Entity, 'id' | 'updatedAt'>) => {
    setIsSubmitting(true);
    
    try {
      // Use provided folderId or entityData folderId, but convert empty string to undefined
      const targetFolderId = folderId || (entityData.folderId && entityData.folderId.trim() !== '' ? entityData.folderId : undefined);

      await createEntity.mutateAsync({
        name: entityData.name,
        templateId: entityData.templateId,
        folderId: targetFolderId,
        fields: entityData.fields,
        tags: entityData.tags,
        imageUrl: entityData.imageUrl,
      });
      
      // Note: Links creation would be a follow-up mutation if needed
      
      toast({ title: 'Entity created', description: entityData.name, variant: 'success' });
      handleClose();
    } catch (error) {
      logError('Error creating entity', error as Error, {
        worldId,
        templateId: entityData.templateId,
        action: 'create_entity',
        component: 'CreateEntityModal',
        metadata: { entityName: entityData.name, folderId: entityData.folderId }
      });
      toast({ title: 'Failed to create entity', description: String((error as Error)?.message || error), variant: 'error' });
      throw error; // let StepFillForm handle its own inline error display
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedTemplate(null);
    setIsSubmitting(false);
    onClose();
  };

  const getModalTitle = () => {
    if (step === 1) return 'Create New Entity';
    if (step === 2 && selectedTemplate) return `Create ${selectedTemplate.name}`;
    return 'Create New Entity';
  };

  return (
    <Modal 
      open={open} 
      title={getModalTitle()} 
      onClose={handleClose}
    >
      <div className="min-h-[400px]">
        {step === 1 && (
          <StepChooseTemplate 
            templates={worldTemplates} 
            onSelectTemplate={handleSelectTemplate} 
          />
        )}
        
        {step === 2 && selectedTemplate && (
          <StepFillForm
            template={selectedTemplate}
            worldId={worldId}
            initialFolderId={folderId}
            onSave={handleSave}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </Modal>
  );
}
