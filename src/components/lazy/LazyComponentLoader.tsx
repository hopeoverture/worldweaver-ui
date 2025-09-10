/**
 * Loading fallback component for lazy-loaded components
 */

import { loadingSpinner, pulseDots } from '@/lib/animation-utils';

interface LazyComponentLoaderProps {
  /** Optional custom loading message */
  message?: string;
  /** Minimum height to prevent layout shift */
  minHeight?: string;
}

/**
 * Fallback component shown while lazy components are loading
 * Prevents layout shift and provides visual feedback
 */
export function LazyComponentLoader({ 
  message = "Loading...", 
  minHeight = "200px" 
}: LazyComponentLoaderProps) {
  const dots = pulseDots();
  
  return (
    <div 
      className="flex items-center justify-center p-8 rounded-lg border border-gray-200 dark:border-neutral-800"
      style={{ minHeight }}
    >
      <div className="flex flex-col items-center space-y-3">
        {/* Animated spinner */}
        <div className="relative">
          <div className={loadingSpinner()} />
          <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-t-blue-400 rounded-full animate-spin animate-reverse" style={{ animationDuration: '1.5s' }} />
        </div>
        
        {/* Loading text */}
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {message}
        </p>
        
        {/* Optional pulse effect */}
        <div className="flex space-x-1">
          {dots.map((dot, index) => (
            <div key={index} className={dot.className} style={dot.style} />
          ))}
        </div>
      </div>
    </div>
  );
}