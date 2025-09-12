'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useWorldEntities } from '@/hooks/query/useWorldEntities';
import type { Entity } from '@/lib/types';

interface CreateRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
}

export function CreateRelationshipModal({ isOpen, onClose, worldId }: CreateRelationshipModalProps) {
  const { data: entities = [] } = useWorldEntities(worldId);
  const [fromEntityId, setFromEntityId] = useState('');
  const [toEntityId, setToEntityId] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const worldEntities = entities;

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (!fromEntityId) newErrors.fromEntityId = 'From entity is required';
    if (!toEntityId) newErrors.toEntityId = 'To entity is required';
    if (!label.trim()) newErrors.label = 'Relationship label is required';
    if (fromEntityId === toEntityId) newErrors.toEntityId = 'Cannot create relationship to the same entity';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/worlds/${worldId}/relationships`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            fromEntityId,
            toEntityId,
            label: label.trim(),
            description: notes.trim() || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create relationship');
        }

        // Reset form and close modal
        setFromEntityId('');
        setToEntityId('');
        setLabel('');
        setNotes('');
        setErrors({});
        onClose();
      } catch (error) {
        setErrors({ submit: error instanceof Error ? error.message : 'Failed to create relationship' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setFromEntityId('');
    setToEntityId('');
    setLabel('');
    setNotes('');
    setErrors({});
    setIsSubmitting(false);
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
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {fromEntityId && toEntityId && label ? (
                  <>
                    <span className="font-medium">
                      {worldEntities.find((e: Entity) => e.id === fromEntityId)?.name || 'Entity'}
                    </span>
                    {' '}
                    <span className="italic">{label}</span>
                    {' '}
                    <span className="font-medium">
                      {worldEntities.find((e: Entity) => e.id === toEntityId)?.name || 'Entity'}
                    </span>
                  </>
                ) : (
                  'Select entities and enter a relationship type to see preview'
                )}
              </p>
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
        <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
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
