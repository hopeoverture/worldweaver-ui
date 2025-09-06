'use client';
import * as React from 'react';
import { Button } from '../ui/Button';

export interface WorldCardProps {
  id: string; 
  name: string; 
  summary?: string; 
  entityCount: number; 
  updatedAt: string | Date;
  isArchived?: boolean;
  onEnter: (id: string) => void; 
  onEdit: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function WorldCard({ id, name, summary, entityCount, updatedAt, isArchived = false, onEnter, onEdit, onArchive, onDelete }: WorldCardProps) {
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
  
  return (
    <article 
      className='group relative rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-card hover:shadow-2xl transition-all duration-500 p-6 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer overflow-hidden' 
      data-testid='world-card' 
      aria-label={`World ${name}`}
      onClick={() => onEnter(id)}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 via-purple-50/30 to-blue-50/50 dark:from-brand-900/20 dark:via-purple-900/10 dark:to-blue-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Floating orbs effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute top-4 right-4 w-2 h-2 bg-brand-400/40 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
        <div className="absolute top-8 right-12 w-1 h-1 bg-purple-400/40 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        <div className="absolute bottom-8 left-6 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
        <div className="absolute bottom-12 right-8 w-1 h-1 bg-brand-400/30 rounded-full animate-pulse" style={{ animationDelay: '900ms' }} />
      </div>
      
      {/* Glowing border effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-blue-500/20 p-[1px]">
        <div className="w-full h-full rounded-xl bg-white dark:bg-neutral-900" />
      </div>
      
      {/* Moving geometric pattern */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 overflow-hidden rounded-xl">
        <div className="absolute -top-4 -right-4 w-16 h-16 border border-brand-200/30 dark:border-brand-700/30 rounded-full group-hover:rotate-12 transition-transform duration-1000" />
        <div className="absolute -bottom-4 -left-4 w-12 h-12 border border-purple-200/30 dark:border-purple-700/30 rounded-full group-hover:-rotate-12 transition-transform duration-1000" />
        <div className="absolute top-1/2 right-0 w-8 h-8 border border-blue-200/30 dark:border-blue-700/30 rounded-full group-hover:rotate-45 transition-transform duration-1000" />
      </div>
      
      <div className="relative z-10">
        <header className='flex items-start justify-between gap-3 mb-4'>
          <div className="group-hover:transform group-hover:translate-x-1 transition-transform duration-300">
            <div className="flex items-center gap-2">
              <h3 className='text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors duration-300'>
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
                  className="hover:scale-105 transition-transform duration-200"
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnter(id);
                  }}
                  className="hover:scale-105 transition-transform duration-200"
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
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      </div>
    </article>
  );
}
