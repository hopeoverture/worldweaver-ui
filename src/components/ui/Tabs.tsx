'use client';
import * as React from 'react';
type TabKey = string;
export interface TabItem { 
  key: TabKey; 
  label: string; 
  render: React.ReactNode; 
  icon?: React.ReactNode;
  count?: number;
}
interface TabsProps { 
  tabs: TabItem[]; 
  activeKey: TabKey; 
  onChange: (key: TabKey) => void; 
  ariaLabel?: string; 
}
export function Tabs({ tabs, activeKey, onChange, ariaLabel = 'Sections' }: TabsProps) {
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = tabs.findIndex(t => t.key === activeKey);
    if (idx < 0) return;
    const focusTab = (i: number) => {
      const next = ((i % tabs.length) + tabs.length) % tabs.length;
      onChange(tabs[next].key); tabRefs.current[next]?.focus();
    };
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': e.preventDefault(); focusTab(idx + 1); break;
      case 'ArrowLeft': case 'ArrowUp': e.preventDefault(); focusTab(idx - 1); break;
      case 'Home': e.preventDefault(); focusTab(0); break;
      case 'End': e.preventDefault(); focusTab(tabs.length - 1); break;
    }
  };
  const activePanel = tabs.find(t => t.key === activeKey)?.render ?? null;
  return (
    <div className='w-full' data-testid='tabs-nav'>
      <div className='border-b border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10'>
        <div role='tablist' aria-label={ariaLabel} className='container -mb-px flex gap-1 overflow-x-auto scrollbar-hide' onKeyDown={onKeyDown}>
          {tabs.map((t, i) => {
            const isActive = t.key === activeKey;
            return (
              <button key={t.key} role='tab' type='button' aria-selected={isActive}
                aria-controls={`panel-${t.key}`} id={`tab-${t.key}`}
                ref={el => { tabRefs.current[i] = el; }}
                className={`group relative whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 transition-all duration-200 flex-shrink-0 ${
                  isActive
                    ? 'font-semibold text-brand-700 dark:text-brand-400 bg-white dark:bg-neutral-900 border-b-2 border-brand-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800/50 hover:shadow-sm hover:-translate-y-0.5'
                }`}
                onClick={() => onChange(t.key)}>
                {/* Active tab background highlight */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 to-transparent dark:from-brand-900/20 rounded-t-lg" />
                )}
                
                {/* Hover effect for inactive tabs */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/50 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                )}
                
                <span className="relative flex items-center gap-2">
                  {/* Tab icon */}
                  {t.icon && (
                    <span className={`flex-shrink-0 transition-colors ${
                      isActive 
                        ? 'text-brand-600 dark:text-brand-400' 
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`}>
                      {t.icon}
                    </span>
                  )}
                  
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.label.slice(0, 1)}</span>
                  
                  {/* Count badge */}
                  {t.count !== undefined && (
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-neutral-600'
                    }`}>
                      {t.count}
                    </span>
                  )}
                  
                  {/* Active indicator dot - only show if no count */}
                  {isActive && t.count === undefined && (
                    <div className="w-1.5 h-1.5 bg-brand-600 dark:bg-brand-400 rounded-full" />
                  )}
                </span>
                
                {/* Bottom border for active tab */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div role='tabpanel' id={`panel-${activeKey}`} aria-labelledby={`tab-${activeKey}`} className='container py-6'>
        {activePanel}
      </div>
    </div>
  );
}
