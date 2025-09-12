'use client';
import * as React from 'react';
import { memo } from 'react';
import { Button } from '../ui/Button';
import { 
  worldCardAnimation, 
  gradientOverlay, 
  floatingOrbs, 
  geometricPattern, 
  shineEffect,
  textColorTransition,
  buttonHover
} from '@/lib/animation-utils';

/**
 * WorldCard component for displaying world information with interactive menu
 */
export interface WorldCardProps {
  /** Unique identifier for the world */
  id: string; 
  /** Display name of the world */
  name: string; 
  /** Optional brief description of the world */
  summary?: string; 
  /** Number of entities in the world */
  entityCount: number; 
  /** Last updated timestamp */
  updatedAt: string | Date;
  /** Whether the world is archived */
  isArchived?: boolean;
  /** Handler for entering the world */
  onEnter: (id: string) => void; 
  /** Handler for editing the world */
  onEdit: (id: string) => void;
  /** Optional handler for archiving the world */
  onArchive?: (id: string) => void;
  /** Optional handler for deleting the world */
  onDelete?: (id: string) => void;
}

function WorldCardComponent({ id, name, summary, entityCount, updatedAt, isArchived = false, onEnter, onEdit, onArchive, onDelete }: WorldCardProps) {
  const date = typeof updatedAt === 'string' ? new Date(updatedAt) : (updatedAt as Date);
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get animation configurations
  const backgroundGradient = gradientOverlay({
    from: 'from-brand-50/50',
    to: 'via-purple-50/30 to-blue-50/50',
    darkFrom: 'dark:from-brand-900/20 dark:via-purple-900/10 dark:to-blue-900/20',
    duration: 500
  });
  const orbs = floatingOrbs();
  const patterns = geometricPattern();
  const shine = shineEffect();
  
  return (
    <article 
      className={`group relative rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card cursor-pointer overflow-hidden p-6 ${worldCardAnimation()}`}
      data-testid='world-card' 
      aria-label={`World ${name}`}
      onClick={() => onEnter(id)}
    >
      {/* Animated background gradient */}
      <div className={backgroundGradient.className} style={backgroundGradient.style} />
      
      {/* Floating orbs effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        {orbs.map((orb, index) => (
          <div key={index} className={orb.className} style={orb.style} />
        ))}
      </div>
      
      {/* Glowing border effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-blue-500/20 p-[1px]">
        <div className="w-full h-full rounded-xl bg-white dark:bg-neutral-900" />
      </div>
      
      {/* Moving geometric pattern */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 overflow-hidden rounded-xl">
        {patterns.map((pattern, index) => (
          <div key={index} className={pattern.className} />
        ))}
      </div>
      
      <div className="relative z-10">
        <header className='flex items-start justify-between gap-3 mb-4'>
          <div className="group-hover:transform group-hover:translate-x-1 transition-transform duration-300">
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-bold ${textColorTransition('text-gray-900 dark:text-gray-100', 'group-hover:text-brand-700 dark:group-hover:text-brand-400')}`}>
                {name}
              </h3>
              {isArchived && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  Archived
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200 group-hover:bg-brand-200 dark:group-hover:bg-brand-800/70 group-hover:scale-105 transition-all duration-300">
                {entityCount} {entityCount === 1 ? 'entity' : 'entities'}
              </span>
            </div>
          </div>
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 hover:scale-110 transform"
              aria-label="World options"
            >
              <svg className="h-4 w-4 text-gray-400 hover:text-brand-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-gray-200 dark:border-neutral-700 z-10">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit(id);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit World
                  </button>
                  
                  {onArchive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onArchive(id);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2"
                    >
                      {isArchived ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                          </svg>
                          Unarchive World
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0 0l6-6m-6 6V3" />
                          </svg>
                          Archive World
                        </>
                      )}
                    </button>
                  )}
                  
                  <hr className="my-1 border-gray-200 dark:border-neutral-700" />
                  
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete(id);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete World
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {summary ? (
          <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300'>
            {summary}
          </p>
        ) : (
          <p className='text-sm text-gray-400 italic mb-4 group-hover:text-gray-500 transition-colors duration-300'>No summary yet</p>
        )}

        <footer className='flex items-center justify-between pt-4 border-t border-gray-100 dark:border-neutral-800 group-hover:border-brand-200 dark:group-hover:border-brand-700/50 transition-colors duration-300'>
          <span className='text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300'>
            Updated {date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            })}
          </span>
          
          <div className='flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1 transform'>
            {!isArchived && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(id);
                  }}
                  className={buttonHover()}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnter(id);
                  }}
                  className={buttonHover()}
                >
                  Enter
                </Button>
              </>
            )}
            {isArchived && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive?.(id);
                }}
                className="hover:scale-105 transition-transform duration-200 text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                Unarchive
              </Button>
            )}
          </div>
        </footer>
      </div>
      
      {/* Shine effect */}
      <div className={shine.containerClass}>
        <div className={shine.shineClass} />
      </div>
    </article>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const WorldCard = memo(WorldCardComponent);
