'use client';
import { Folder } from '@/lib/types';
import { FolderCard } from './FolderCard';

interface FolderGridProps {
  folders: Folder[];
  onFolderClick: (folderId: string) => void;
  onRename?: (folder: Folder) => void;
  onDelete?: (folder: Folder) => void;
  onEntityDrop?: (entityId: string, entityName: string, folderId: string) => void;
  onTemplateDrop?: (templateId: string, templateName: string, folderId: string) => void;
  /** Optional entities array for calculating folder counts */
  entities?: Array<{ id: string; folderId?: string }>;
  /** Optional templates array for calculating folder counts */
  templates?: Array<{ id: string; folderId?: string }>;
}

export function FolderGrid({ folders, onFolderClick, onRename, onDelete, onEntityDrop, onTemplateDrop, entities, templates }: FolderGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {folders.map(folder => (
        <FolderCard
          key={folder.id}
          folder={folder}
          onClick={() => onFolderClick(folder.id)}
          onRename={onRename}
          onDelete={onDelete}
          onEntityDrop={onEntityDrop ? (entityId, entityName) => onEntityDrop(entityId, entityName, folder.id) : undefined}
          onTemplateDrop={onTemplateDrop ? (templateId, templateName) => onTemplateDrop(templateId, templateName, folder.id) : undefined}
          entities={entities}
          templates={templates}
        />
      ))}
    </div>
  );
}
