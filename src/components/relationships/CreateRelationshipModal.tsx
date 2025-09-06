'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useStore } from '@/lib/store';

interface CreateRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
}

export function CreateRelationshipModal({ isOpen, onClose, worldId }: CreateRelationshipModalProps) {
  const { entities, addLink } = useStore();
  const [fromEntityId, setFromEntityId] = useState('');
  const [toEntityId, setToEntityId] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const worldEntities = entities.filter(e => e.worldId === worldId);

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!fromEntityId) newErrors.fromEntityId = 'From entity is required';
    if (!toEntityId) newErrors.toEntityId = 'To entity is required';
    if (!label.trim()) newErrors.label = 'Relationship label is required';
    if (fromEntityId === toEntityId) newErrors.toEntityId = 'Cannot create relationship to the same entity';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      addLink({
        fromEntityId,
        toEntityId,
        label: label.trim(),
      });

      // Reset form and close modal
      setFromEntityId('');
      setToEntityId('');
      setLabel('');
      setNotes('');
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFromEntityId('');
    setToEntityId('');
    setLabel('');
    setNotes('');
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
            }}
            className={errors.fromEntityId ? 'border-red-500' : ''}
          >
            <option value="">Select an entity</option>
            {worldEntities.map(entity => (
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
            }}
            className={errors.toEntityId ? 'border-red-500' : ''}
          >
            <option value="">Select an entity</option>
            {worldEntities.map(entity => (
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
                      {worldEntities.find(e => e.id === fromEntityId)?.name || 'Entity'}
                    </span>
                    {' '}
                    <span className="italic">{label}</span>
                    {' '}
                    <span className="font-medium">
                      {worldEntities.find(e => e.id === toEntityId)?.name || 'Entity'}
                    </span>
                  </>
                ) : (
                  'Select entities and enter a relationship type to see preview'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-neutral-700 mt-6">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          Create Relationship
        </Button>
      </div>
    </Modal>
  );
}
