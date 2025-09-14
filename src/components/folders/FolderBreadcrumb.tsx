'use client';
import { Folder } from '@/lib/types';

interface FolderBreadcrumbProps {
  /** Current folder path (array of folder objects from root to current) */
  folderPath: Folder[];
  /** Handler for navigating to a specific folder */
  onNavigate: (folderId: string | null) => void;
}

export function FolderBreadcrumb({ folderPath, onNavigate }: FolderBreadcrumbProps) {
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
      {/* Root folder */}
      <button
        onClick={() => onNavigate(null)}
        className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        📁 Root
      </button>

      {/* Breadcrumb trail */}
      {folderPath.map((folder, index) => (
        <div key={folder.id} className="flex items-center space-x-2">
          <svg
            className="w-4 h-4 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <button
            onClick={() => onNavigate(folder.id)}
            className={`hover:text-brand-600 dark:hover:text-brand-400 transition-colors ${
              index === folderPath.length - 1
                ? 'font-medium text-gray-900 dark:text-gray-100'
                : ''
            }`}
          >
            📁 {folder.name}
          </button>
        </div>
      ))}
    </div>
  );
}