'use client';
import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { folderColorOptions } from './folderColors';
import { useCreateFolder } from '@/hooks/mutations/useCreateFolder';
import { useWorldFolders } from '@/hooks/query/useWorldFolders';
import { useToast } from '@/components/ui/ToastProvider';
import { logError } from '@/lib/logging';

interface CreateFolderModalProps {
  open: boolean;
  worldId: string;
  folderType: 'entities' | 'templates';
  currentParentFolderId?: string;
  onClose: () => void;
}

export function CreateFolderModal({ open, worldId, folderType, currentParentFolderId, onClose }: CreateFolderModalProps) {
  const createFolder = useCreateFolder(worldId);
  const { data: folders = [] } = useWorldFolders(worldId);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
    parentFolderId: currentParentFolderId || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter folders to only show appropriate parent folders
  const availableParentFolders = folders.filter(folder =>
    folder.kind === folderType && // Same type (entities/templates)
    folder.id !== currentParentFolderId // Don't show current folder as option
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    
    try {
      await createFolder.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        kind: folderType,
        parentFolderId: formData.parentFolderId || undefined,
      });
      toast({ title: 'Folder created', description: `"${formData.name.trim()}" added`, variant: 'success' });
      setFormData({ name: '', description: '', color: 'blue', parentFolderId: currentParentFolderId || '' });
      onClose();
    } catch (error) {
      logError('Error creating folder', error as Error, { 
        worldId, 
        action: 'create_folder',
        component: 'CreateFolderModal',
        metadata: { folderType, folderName: formData.name.trim() }
      });
      toast({ title: 'Failed to create folder', description: String((error as Error)?.message || error), variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', color: 'blue', parentFolderId: currentParentFolderId || '' });
    onClose();
  };

  const colorOptions = folderColorOptions;

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={`Create ${folderType === 'entities' ? 'Entity' : 'Template'} Folder`}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.name.trim() || isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? 'Creating...' : 'Create Folder'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Folder Name *
          </label>
          <Input
            id="folderName"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={`Enter ${folderType} folder name`}
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="folderDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (optional)
          </label>
          <Textarea
            id="folderDescription"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder={`Describe what this folder will contain...`}
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="parentFolder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Parent Folder (optional)
          </label>
          <Select
            id="parentFolder"
            value={formData.parentFolderId}
            onChange={(e) => setFormData(prev => ({ ...prev, parentFolderId: e.target.value }))}
          >
            <option value="">📁 No parent folder (create at root level)</option>
            {availableParentFolders.map(folder => (
              <option key={folder.id} value={folder.id}>
                📁 {folder.name}
              </option>
            ))}
          </Select>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Choose a parent folder to create a subfolder, or leave empty to create at the root level.
          </p>
        </div>

        <div>
          <label htmlFor="folderColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Folder Color
          </label>
          <div className="grid grid-cols-4 gap-3">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                className={`group relative p-3 rounded-lg border-2 transition-all ${
                  formData.color === color.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
                    : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${color.preview}`} />
                  <span className="text-sm font-medium">{color.label}</span>
                </div>
                {formData.color === color.value && (
                  <div className="absolute top-1 right-1">
                    <svg className="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Organize Your {folderType === 'entities' ? 'Entities' : 'Templates'}
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Use folders to group related {folderType} by theme, importance, or any system that works for you.
              </p>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
