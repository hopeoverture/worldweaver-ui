'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Folder } from '@/lib/types';
import { useUpdateFolder } from '@/hooks/mutations/useUpdateFolder';
import { useToast } from '@/components/ui/ToastProvider';

interface RenameFolderModalProps {
  open: boolean;
  folder: Folder | null;
  onClose: () => void;
}

export function RenameFolderModal({ open, folder, onClose }: RenameFolderModalProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const updateFolder = useUpdateFolder();
  const { toast } = useToast();

  useEffect(() => {
    setName(folder?.name || '');
  }, [folder]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!folder || !name.trim()) return;
    setSubmitting(true);
    try {
      await updateFolder.mutateAsync({ id: folder.id, worldId: folder.worldId, name: name.trim() });
      toast({ title: 'Folder renamed', description: `“${name.trim()}”`, variant: 'success' });
      onClose();
    } catch (err) {
      toast({ title: 'Failed to rename folder', description: String((err as Error)?.message || err), variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = !name.trim() || submitting;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rename Folder"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={disabled}>{submitting ? 'Saving...' : 'Save'}</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="rename-folder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New name
          </label>
          <Input
            id="rename-folder"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            autoFocus
          />
        </div>
      </form>
    </Modal>
  );
}

