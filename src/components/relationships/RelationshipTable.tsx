'use client';
import { useState } from 'react';
import { RelationshipRow, Entity } from '@/lib/types';
import { useWorldRelationships } from '@/hooks/query/useWorldRelationships';
import { useWorldEntities } from '@/hooks/query/useWorldEntities';
import { useToast } from '@/components/ui/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { formatDate } from '@/lib/utils';

interface RelationshipTableProps {
  worldId: string;
}

interface EditRelationshipModalProps {
  relationship: RelationshipRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<RelationshipRow>) => Promise<void>;
  entities: Entity[];
}

function EditRelationshipModal({ relationship, isOpen, onClose, onSave, entities }: EditRelationshipModalProps) {
  const [formData, setFormData] = useState({
    relationshipType: relationship?.relationshipType || '',
    description: relationship?.description || '',
    strength: relationship?.strength || 5,
    isBidirectional: relationship?.isBidirectional || false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!relationship) return;

    setIsSaving(true);
    try {
      await onSave(relationship.id, formData);
      onClose();
    } catch (error) {
      console.error('Failed to update relationship:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getEntityName = (id: string) => entities.find(e => e.id === id)?.name || 'Unknown';

  if (!relationship) return null;

  return (
    <Modal open={isOpen} onClose={onClose} title="Edit Relationship">
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{getEntityName(relationship.from)}</span>
            {' → '}
            <span className="font-medium">{getEntityName(relationship.to)}</span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Relationship Type *
          </label>
          <Input
            value={formData.relationshipType}
            onChange={(e) => setFormData(prev => ({ ...prev, relationshipType: e.target.value }))}
            placeholder="e.g., father of, ally, rival"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Additional details about this relationship..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Strength: {formData.strength}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.strength}
            onChange={(e) => setFormData(prev => ({ ...prev, strength: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Very Weak</span>
            <span>Strong</span>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="bidirectional"
            checked={formData.isBidirectional}
            onChange={(e) => setFormData(prev => ({ ...prev, isBidirectional: e.target.checked }))}
            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
          />
          <label htmlFor="bidirectional" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Bidirectional relationship
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-neutral-700 mt-6">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !formData.relationshipType.trim()}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Modal>
  );
}

export function RelationshipTable({ worldId }: RelationshipTableProps) {
  const { data: relationships = [] } = useWorldRelationships(worldId);
  const { data: entities = [] } = useWorldEntities(worldId);
  const { toast } = useToast();
  const [editingRelationship, setEditingRelationship] = useState<RelationshipRow | null>(null);
  const [sortBy, setSortBy] = useState<'from' | 'to' | 'type' | 'strength' | 'created'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState('');

  const getEntityName = (id: string) => entities.find((e: Entity) => e.id === id)?.name || 'Unknown';

  const handleUpdateRelationship = async (id: string, updates: Partial<RelationshipRow>) => {
    try {
      const response = await fetch(`/api/relationships/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update relationship');
      }

      toast({
        title: 'Relationship updated',
        description: 'Changes have been saved successfully.',
        variant: 'success'
      });

      // Refresh the page or trigger a refetch
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update relationship. Please try again.',
        variant: 'error'
      });
    }
  };

  const handleDeleteRelationship = async (relationship: RelationshipRow) => {
    if (!confirm(`Delete relationship "${relationship.relationshipType}" between ${getEntityName(relationship.from)} and ${getEntityName(relationship.to)}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/relationships/${relationship.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete relationship');
      }

      toast({
        title: 'Relationship deleted',
        description: 'The relationship has been removed.',
        variant: 'success'
      });

      // Refresh the page or trigger a refetch
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete relationship. Please try again.',
        variant: 'error'
      });
    }
  };

  const getStrengthColor = (strength: number = 5) => {
    if (strength >= 8) return 'text-green-600 dark:text-green-400';
    if (strength >= 6) return 'text-blue-600 dark:text-blue-400';
    if (strength >= 4) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStrengthLabel = (strength: number = 5) => {
    if (strength >= 8) return 'Strong';
    if (strength >= 6) return 'Medium';
    if (strength >= 4) return 'Weak';
    return 'Very Weak';
  };

  // Filter and sort relationships
  const filteredAndSortedRelationships = relationships
    .filter(rel => {
      if (!filterType) return true;
      return rel.relationshipType.toLowerCase().includes(filterType.toLowerCase());
    })
    .sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'from':
          compareValue = getEntityName(a.from).localeCompare(getEntityName(b.from));
          break;
        case 'to':
          compareValue = getEntityName(a.to).localeCompare(getEntityName(b.to));
          break;
        case 'type':
          compareValue = a.relationshipType.localeCompare(b.relationshipType);
          break;
        case 'strength':
          compareValue = (a.strength || 5) - (b.strength || 5);
          break;
        case 'created':
          compareValue = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  if (relationships.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No relationships yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create relationships between entities to see them listed here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by relationship type..."
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1"
          >
            <option value="created">Created Date</option>
            <option value="from">From Entity</option>
            <option value="to">To Entity</option>
            <option value="type">Relationship Type</option>
            <option value="strength">Strength</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            title={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {sortOrder === 'asc' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-neutral-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
          <thead className="bg-gray-50 dark:bg-neutral-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strength</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-950 divide-y divide-gray-200 dark:divide-neutral-800">
            {filteredAndSortedRelationships.map(rel => (
              <tr key={rel.id} className="hover:bg-gray-50 dark:hover:bg-neutral-900/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {getEntityName(rel.from)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">{rel.relationshipType}</div>
                  {rel.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{rel.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {getEntityName(rel.to)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`font-medium ${getStrengthColor(rel.strength)}`}>
                    {rel.strength || 5}/10
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getStrengthLabel(rel.strength)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {rel.isBidirectional ? (
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Both ways
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      One way
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {rel.createdAt ? formatDate(rel.createdAt) : 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingRelationship(rel)}
                      className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                      title="Edit relationship"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteRelationship(rel)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete relationship"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedRelationships.length === 0 && filterType && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No relationships match "{filterType}"</p>
        </div>
      )}

      {/* Edit Modal */}
      <EditRelationshipModal
        relationship={editingRelationship}
        isOpen={!!editingRelationship}
        onClose={() => setEditingRelationship(null)}
        onSave={handleUpdateRelationship}
        entities={entities}
      />
    </div>
  );
}
