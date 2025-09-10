'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { Folder } from '@/lib/types';
import { useUpdateFolder } from '@/hooks/mutations/useUpdateFolder';
import { useToast } from '@/components/ui/ToastProvider';

interface EditFolderModalProps {
  open: boolean;
  folder: Folder | null;
  onClose: () => void;
}

export function EditFolderModal({ open, folder, onClose }: EditFolderModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>('blue');
  const [submitting, setSubmitting] = useState(false);
  const updateFolder = useUpdateFolder();
  const { toast } = useToast();

  useEffect(() => {
    setName(folder?.name || '');
    setDescription(folder?.description || '');
    setColor((folder?.color as string) || 'blue');
  }, [folder]);

  const colorOptions = useMemo(() => ([
    { value: 'blue', label: 'Blue', preview: 'bg-blue-500' },
    { value: 'green', label: 'Green', preview: 'bg-green-500' },
    { value: 'purple', label: 'Purple', preview: 'bg-purple-500' },
    { value: 'red', label: 'Red', preview: 'bg-red-500' },
    { value: 'yellow', label: 'Yellow', preview: 'bg-yellow-500' },
    { value: 'pink', label: 'Pink', preview: 'bg-pink-500' },
    { value: 'indigo', label: 'Indigo', preview: 'bg-indigo-500' },
    { value: 'gray', label: 'Gray', preview: 'bg-gray-500' }
  ]), []);

  const handleSubmit = async () => {
    if (!folder || !name.trim()) return;
    setSubmitting(true);
    try {
      await updateFolder.mutateAsync({ id: folder.id, worldId: folder.worldId, name: name.trim(), description: description.trim(), color });
      toast({ title: 'Folder updated', description: `“${name.trim()}”`, variant: 'success' });
      onClose();
    } catch (err) {
      toast({ title: 'Failed to update folder', description: String((err as Error)?.message || err), variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Folder"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
          <div className="grid grid-cols-4 gap-3">
            {colorOptions.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`group relative p-3 rounded-lg border-2 transition-all ${
                  color === c.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
                    : 'border-gray-200 dark:border-neutral-800 hover:border-brand-300 dark:hover:border-brand-700'
                }`}
              >
                <div className={`h-8 w-full rounded-md ${c.preview}`} />
                <span className="absolute inset-x-0 bottom-1 text-center text-xs text-gray-600 dark:text-gray-400">
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

