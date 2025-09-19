'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useWorldEntities } from '@/hooks/query/useWorldEntities';
import { useCreateRelationship } from '@/hooks/mutations/useCreateRelationship';
import { useToast } from '@/components/ui/ToastProvider';
import type { Entity } from '@/lib/types';

interface CreateRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
}

export function CreateRelationshipModal({ isOpen, onClose, worldId }: CreateRelationshipModalProps) {
  const { data: entities = [] } = useWorldEntities(worldId);
  const createRelationshipMutation = useCreateRelationship(worldId);
  const { toast } = useToast();
  const [fromEntityId, setFromEntityId] = useState('');
  const [toEntityId, setToEntityId] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [strength, setStrength] = useState(5);
  const [isBidirectional, setIsBidirectional] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const worldEntities = entities;

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (!fromEntityId) newErrors.fromEntityId = 'From entity is required';
    if (!toEntityId) newErrors.toEntityId = 'To entity is required';
    if (!label.trim()) newErrors.label = 'Relationship label is required';
    if (fromEntityId === toEntityId) newErrors.toEntityId = 'Cannot create relationship to the same entity';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        await createRelationshipMutation.mutateAsync({
          fromEntityId,
          toEntityId,
          relationshipType: label.trim(),
          description: notes.trim() || null,
          strength,
          isBidirectional,
        });

        // Show success toast
        const fromEntity = entities.find((e: Entity) => e.id === fromEntityId);
        const toEntity = entities.find((e: Entity) => e.id === toEntityId);
        toast({
          title: 'Relationship created!',
          description: `${fromEntity?.name || 'Entity'} ${label.trim()} ${toEntity?.name || 'Entity'}`,
          variant: 'success',
        });

        // Reset form and close modal
        setFromEntityId('');
        setToEntityId('');
        setLabel('');
        setNotes('');
        setStrength(5);
        setIsBidirectional(false);
        setErrors({});
        onClose();
      } catch (error) {
        console.error('Relationship creation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create relationship';
        setErrors({ submit: errorMessage });
      }
    }
  };

  const handleClose = () => {
    setFromEntityId('');
    setToEntityId('');
    setLabel('');
    setNotes('');
    setStrength(5);
    setIsBidirectional(false);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={handleClose} title="Create New Relationship">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            From Entity *
          </label>
          <Select
            value={fromEntityId}
            onChange={(e) => {
              setFromEntityId(e.target.value);
              if (errors.fromEntityId) {
                setErrors(prev => ({ ...prev, fromEntityId: '' }));
              }
              if (errors.submit) {
                setErrors(prev => ({ ...prev, submit: '' }));
              }
            }}
            className={errors.fromEntityId ? 'border-red-500' : ''}
          >
            <option value="">Select an entity</option>
            {worldEntities.map((entity: Entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </Select>
          {errors.fromEntityId && <p className="mt-1 text-sm text-red-600">{errors.fromEntityId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Relationship Type *
          </label>
          <Input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (errors.label) {
                setErrors(prev => ({ ...prev, label: '' }));
              }
              if (errors.submit) {
                setErrors(prev => ({ ...prev, submit: '' }));
              }
            }}
            placeholder="e.g., father of, lives in, owns, allies with"
            className={errors.label ? 'border-red-500' : ''}
          />
          {errors.label && <p className="mt-1 text-sm text-red-600">{errors.label}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            To Entity *
          </label>
          <Select
            value={toEntityId}
            onChange={(e) => {
              setToEntityId(e.target.value);
              if (errors.toEntityId) {
                setErrors(prev => ({ ...prev, toEntityId: '' }));
              }
              if (errors.submit) {
                setErrors(prev => ({ ...prev, submit: '' }));
              }
            }}
            className={errors.toEntityId ? 'border-red-500' : ''}
          >
            <option value="">Select an entity</option>
            {worldEntities.map((entity: Entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </Select>
          {errors.toEntityId && <p className="mt-1 text-sm text-red-600">{errors.toEntityId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Relationship Strength: {strength}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={strength}
            onChange={(e) => setStrength(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Very Weak</span>
            <span>Weak</span>
            <span>Medium</span>
            <span>Strong</span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            How strong or significant is this relationship? (1 = very weak, 10 = very strong)
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="bidirectional"
            checked={isBidirectional}
            onChange={(e) => setIsBidirectional(e.target.checked)}
            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
          />
          <label htmlFor="bidirectional" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Bidirectional relationship
          </label>
          <div className="ml-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Check this if the relationship works both ways (e.g., "friends with" vs "parent of")
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add additional details about this relationship..."
            rows={3}
            className="block w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 resize-none"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Optional context, background, or specific details about this relationship
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Relationship Preview
              </h4>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                {fromEntityId && toEntityId && label ? (
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">
                        {worldEntities.find((e: Entity) => e.id === fromEntityId)?.name || 'Entity'}
                      </span>
                      {' '}
                      <span className="italic">{label}</span>
                      {' '}
                      <span className="font-medium">
                        {worldEntities.find((e: Entity) => e.id === toEntityId)?.name || 'Entity'}
                      </span>
                      {isBidirectional && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Both ways
                        </span>
                      )}
                    </p>
                    <p>
                      <span className="font-medium">Strength:</span> {strength}/10 ({
                        strength >= 8 ? 'Very Strong' :
                        strength >= 6 ? 'Strong' :
                        strength >= 4 ? 'Medium' :
                        'Weak'
                      })
                    </p>
                    {notes.trim() && (
                      <p><span className="font-medium">Notes:</span> {notes.trim()}</p>
                    )}
                  </div>
                ) : (
                  'Select entities and enter a relationship type to see preview'
                )}
              </div>
            </div>
          </div>
        </div>

        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-neutral-700 mt-6">
        <Button variant="outline" onClick={handleClose} disabled={createRelationshipMutation.isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={createRelationshipMutation.isPending}>
          {createRelationshipMutation.isPending ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            'Create Relationship'
          )}
        </Button>
      </div>
    </Modal>
  );
}
