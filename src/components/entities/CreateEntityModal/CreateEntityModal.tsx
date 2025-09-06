'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/lib/store';
import { StepChooseTemplate } from './StepChooseTemplate';
import { StepFillForm } from './StepFillForm';
import { Entity, Template } from '@/lib/types';

interface CreateEntityModalProps {
  open: boolean;
  worldId: string;
  folderId?: string; // Optional folder to pre-select
  onClose: () => void;
}

export function CreateEntityModal({ open, worldId, folderId, onClose }: CreateEntityModalProps) {
  const { templates, folders, addEntity } = useStore();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const worldTemplates = templates.filter(t => t.worldId === worldId);
  const worldFolders = folders.filter(f => f.worldId === worldId && f.kind === 'entities');

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
      // Use provided folderId or template's folder, but allow undefined for ungrouped entities
      const targetFolderId = folderId || entityData.folderId || undefined;

      const finalEntityData = {
        ...entityData,
        folderId: targetFolderId
      };

      const newEntity = addEntity(finalEntityData);
      
      // Update links to reference the new entity
      if (finalEntityData.links.length > 0) {
        // Note: In a real app, you'd update the links in the store
        console.log('Entity created with links:', newEntity);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error creating entity:', error);
      throw error; // Re-throw to let StepFillForm handle the error display
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
            onSave={handleSave}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </Modal>
  );
}
