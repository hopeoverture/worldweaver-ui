'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Link } from '@/lib/types';
import { Button } from '../../ui/Button';
import { v4 as uuidv4 } from 'uuid';

interface LinkEditorProps {
  worldId: string;
  links?: Link[];
  onChange?: (links: Link[]) => void;
}

export function LinkEditor({ worldId, links = [], onChange }: LinkEditorProps) {
  const { entities } = useStore();
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [relationshipLabel, setRelationshipLabel] = useState('');
  
  const worldEntities = entities.filter(e => e.worldId === worldId);

  const addLink = () => {
    if (!selectedEntityId || !relationshipLabel.trim()) {
      return;
    }

    const newLink: Link = {
      id: uuidv4(),
      fromEntityId: '', // Will be set when entity is created
      toEntityId: selectedEntityId,
      relationshipType: relationshipLabel.trim()
    };

    const updatedLinks = [...links, newLink];
    onChange?.(updatedLinks);
    
    // Reset form
    setSelectedEntityId('');
    setRelationshipLabel('');
  };

  const removeLink = (linkId: string) => {
    const updatedLinks = links.filter(link => link.id !== linkId);
    onChange?.(updatedLinks);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          Entity Relationships
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Connect this entity to other entities in your world.
        </p>
      </div>

      {/* Existing links */}
      {links.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Relationships:</h5>
          {links.map(link => {
            const targetEntity = worldEntities.find(e => e.id === link.toEntityId);
            return (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">relates to</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {targetEntity?.name || 'Unknown Entity'}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">as</span>
                  <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/50 text-brand-800 dark:text-brand-200 rounded text-sm">
                    {link.relationshipType}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLink(link.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new link form */}
      {worldEntities.length > 0 ? (
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Add New Relationship:</h5>
          <div className="flex gap-2">
            <div className="flex-1">
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="block w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              >
                <option value="">Select entity...</option>
                {worldEntities.map(entity => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={relationshipLabel}
                onChange={(e) => setRelationshipLabel(e.target.value)}
                placeholder="Relationship type (e.g., 'lives in', 'owns', 'friend of')"
                className="block w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </div>
            <Button
              type="button"
              onClick={addLink}
              disabled={!selectedEntityId || !relationshipLabel.trim()}
              size="sm"
            >
              Add
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 dark:bg-neutral-800 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No other entities exist in this world yet.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Create more entities to establish relationships between them.
          </p>
        </div>
      )}
    </div>
  );
}
