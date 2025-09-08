'use client';
import { Folder } from '@/lib/types';
import { FolderCard } from './FolderCard';

interface FolderGridProps {
  folders: Folder[];
  onFolderClick: (folderId: string) => void;
  onRename?: (folder: Folder) => void;
  onDelete?: (folder: Folder) => void;
}

export function FolderGrid({ folders, onFolderClick, onRename, onDelete }: FolderGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {folders.map(folder => (
        <FolderCard
          key={folder.id}
          folder={folder}
          onClick={() => onFolderClick(folder.id)}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
