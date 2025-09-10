'use client';
import { memo } from 'react';
import { Folder } from '@/lib/types';
import { useStore } from '@/lib/store';
import { itemCardAnimation, gradientOverlay, iconBackgroundTransition } from '@/lib/animation-utils';

/**
 * FolderCard component for displaying folder information
 */
interface FolderCardProps {
  /** The folder data to display */
  folder: Folder;
  /** Click handler for folder interaction */
  onClick: () => void;
  /** Optional handler for renaming the folder */
  onRename?: (folder: Folder) => void;
  /** Optional handler for deleting the folder */
  onDelete?: (folder: Folder) => void;
}

const colorClasses = {
  blue: {
    gradient: 'from-blue-50/50 dark:from-blue-900/20',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textHover: 'group-hover:text-blue-700 dark:group-hover:text-blue-400'
  },
  green: {
    gradient: 'from-green-50/50 dark:from-green-900/20',
    iconBg: 'bg-green-100 dark:bg-green-900/50 group-hover:bg-green-200 dark:group-hover:bg-green-800/50',
    iconColor: 'text-green-600 dark:text-green-400',
    textHover: 'group-hover:text-green-700 dark:group-hover:text-green-400'
  },
  purple: {
    gradient: 'from-purple-50/50 dark:from-purple-900/20',
    iconBg: 'bg-purple-100 dark:bg-purple-900/50 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50',
    iconColor: 'text-purple-600 dark:text-purple-400',
    textHover: 'group-hover:text-purple-700 dark:group-hover:text-purple-400'
  },
  red: {
    gradient: 'from-red-50/50 dark:from-red-900/20',
    iconBg: 'bg-red-100 dark:bg-red-900/50 group-hover:bg-red-200 dark:group-hover:bg-red-800/50',
    iconColor: 'text-red-600 dark:text-red-400',
    textHover: 'group-hover:text-red-700 dark:group-hover:text-red-400'
  },
  yellow: {
    gradient: 'from-yellow-50/50 dark:from-yellow-900/20',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/50 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800/50',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    textHover: 'group-hover:text-yellow-700 dark:group-hover:text-yellow-400'
  },
  pink: {
    gradient: 'from-pink-50/50 dark:from-pink-900/20',
    iconBg: 'bg-pink-100 dark:bg-pink-900/50 group-hover:bg-pink-200 dark:group-hover:bg-pink-800/50',
    iconColor: 'text-pink-600 dark:text-pink-400',
    textHover: 'group-hover:text-pink-700 dark:group-hover:text-pink-400'
  },
  indigo: {
    gradient: 'from-indigo-50/50 dark:from-indigo-900/20',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/50 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    textHover: 'group-hover:text-indigo-700 dark:group-hover:text-indigo-400'
  },
  gray: {
    gradient: 'from-gray-50/50 dark:from-gray-900/20',
    iconBg: 'bg-gray-100 dark:bg-gray-900/50 group-hover:bg-gray-200 dark:group-hover:bg-gray-800/50',
    iconColor: 'text-gray-600 dark:text-gray-400',
    textHover: 'group-hover:text-gray-700 dark:group-hover:text-gray-400'
  }
};

function FolderCardComponent({ folder, onClick, onRename, onDelete }: FolderCardProps) {
  const { entities, templates } = useStore();
  const colors = colorClasses[folder.color as keyof typeof colorClasses] || colorClasses.blue;

  // Calculate dynamic count based on folder type
  const dynamicCount = folder.kind === 'entities' 
    ? entities.filter(e => e.folderId === folder.id).length
    : templates.filter(t => t.folderId === folder.id).length;

  // Get animation utilities
  const folderGradient = gradientOverlay({ 
    from: colors.gradient,
    to: 'to-transparent',
    darkFrom: colors.gradient
  });
  const iconStyles = iconBackgroundTransition(colors);

  return (
    <button
      onClick={onClick}
      data-testid="folder-card"
      className={`group relative rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card text-left w-full p-6 ${itemCardAnimation()}`}
    >
      {/* Gradient overlay for visual interest */}
      <div className={folderGradient.className} style={folderGradient.style} />
      
      <div className="relative">
        {(onRename || onDelete) && (
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onRename && (
              <button
                aria-label="Rename folder"
                className="p-1.5 rounded-md bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
                onClick={(e) => { e.stopPropagation(); onRename(folder); }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            )}
            {onDelete && (
              <button
                aria-label="Delete folder"
                className="p-1.5 rounded-md bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300"
                onClick={(e) => { e.stopPropagation(); onDelete(folder); }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 7h4m-1-3h-2a2 2 0 00-2 2h6a2 2 0 00-2-2z"/></svg>
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${iconStyles.iconBg}`}>
            <svg className={`h-5 w-5 ${colors.iconColor}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
            </svg>
          </div>
          <div>
            <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${iconStyles.textHover}`}>{folder.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{dynamicCount} items</p>
          </div>
        </div>
        {folder.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
            {folder.description}
          </p>
        )}
      </div>
    </button>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const FolderCard = memo(FolderCardComponent);
