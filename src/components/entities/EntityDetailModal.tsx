'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Entity, Template, Folder, TemplateField, Link } from '@/lib/types';
import { useWorldTemplates } from '@/hooks/query/useWorldTemplates';
import { useWorldFolders } from '@/hooks/query/useWorldFolders';
import { useWorldEntities } from '@/hooks/query/useWorldEntities';
import { useWorldRelationships } from '@/hooks/query/useWorldRelationships';
import { useUpdateEntity } from '@/hooks/mutations/useUpdateEntity';
import { useToast } from '@/components/ui/ToastProvider';
import { formatDate } from '@/lib/utils';

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

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Entity>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
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
      await updateEntityMut.mutateAsync({
        id: entity.id,
        patch: {
          name: formData.name!,
          folderId: (formData.folderId ?? null) as string | null,
          fields: formData.fields || {},
          // tags and templateId unchanged here
        },
      });
      setIsEditing(false);
      setErrors({});
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

  const handleRemoveLink = (linkId: string) => {
    // TODO: Replace with useDeleteRelationship mutation
    console.log('Remove link:', linkId);
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
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save Changes
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Summary</h3>
          {isEditing ? (
            <Textarea
              value={formData.summary || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Entity summary..."
              rows={3}
            />
          ) : (
            <div className="text-gray-700 dark:text-gray-300">
              {entity.summary || <span className="text-gray-400 italic">No summary provided</span>}
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Details</h3>
            <div className="space-y-4">
              {template.fields.map(field => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.name}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
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
    </Modal>
  );
}
