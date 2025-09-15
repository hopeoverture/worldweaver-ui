/**
 * Performance Optimization Utilities
 * 
 * Provides utilities for improving React performance including memoization,
 * lazy loading, and performance monitoring.
 */

import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { APP_CONFIG } from './config';
import { getLogger } from './enhanced-logging';

/**
 * Enhanced React.memo with custom equality check for common patterns
 */
export function memoWithComparison<T extends object>(
  component: React.ComponentType<T>,
  customCompare?: (prevProps: T, nextProps: T) => boolean
) {
  return memo(component, customCompare);
}

/**
 * Memoization helper for entity-like objects with common props
 */
export function memoEntityComponent<T extends { id: string; updatedAt?: string }>(
  component: React.ComponentType<T>
) {
  return memo(component, (prevProps, nextProps) => {
    // Quick reference equality check first
    if (prevProps === nextProps) return true;
    
    // Check ID and updatedAt for entity-like objects
    if (prevProps.id !== nextProps.id) return false;
    if (prevProps.updatedAt !== nextProps.updatedAt) return false;
    
    // Shallow compare other props
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    for (const key of prevKeys) {
      if (prevProps[key as keyof T] !== nextProps[key as keyof T]) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Debounced callback hook for expensive operations
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = APP_CONFIG.PERFORMANCE.SEARCH_DEBOUNCE
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

/**
 * Throttled callback hook for high-frequency events
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): T {
  const lastExecuted = useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastExecuted.current >= delay) {
      lastExecuted.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;
}

/**
 * Memoized computation hook with dependency tracking
 */
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Optimized filter/search hook for large collections
 */
export function useOptimizedFilter<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  dependencies: React.DependencyList = []
): T[] {
  return useMemo(() => {
    // Only filter if we have a reasonable number of items
    if (items.length < APP_CONFIG.PERFORMANCE.VIRTUAL_GRID_THRESHOLD) {
      return items.filter(filterFn);
    }
    
    // For large collections, consider implementing virtualization
    return items.filter(filterFn);
  }, [items, filterFn, ...dependencies]);
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(
  componentName: string,
  dependencies: React.DependencyList = []
) {
  const renderStart = useRef<number>(0);
  const logger = getLogger();
  
  // Mark render start
  renderStart.current = performance.now();
  
  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    
    // Log slow renders in development
    if (renderTime > 16) { // Slower than 60fps
      logger.performance(`${componentName} render`, renderTime, {
        component: componentName,
        renderTime,
        isSlowRender: true,
      });
    }
  }, dependencies);
  
  useEffect(() => {
    // Log component mount/unmount
    logger.debug(`${componentName} mounted`);
    
    return () => {
      logger.debug(`${componentName} unmounted`);
    };
  }, []);
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  threshold: number = 0.1,
  rootMargin: string = APP_CONFIG.PERFORMANCE.LAZY_LOAD_THRESHOLD
) {
  const targetRef = useRef<HTMLElement>(null);
  const isIntersecting = useRef<boolean>(false);
  const observerRef = useRef<IntersectionObserver | undefined>(undefined);
  
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        isIntersecting.current = entry.isIntersecting;
      },
      { threshold, rootMargin }
    );
    
    observerRef.current.observe(target);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin]);
  
  return [targetRef, () => isIntersecting.current] as const;
}

/**
 * Virtual scrolling hook for large lists
 */
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number = APP_CONFIG.PERFORMANCE.VIRTUAL_SCROLL_ITEM_HEIGHT,
  containerHeight: number = 400
) {
  const scrollTop = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop.current / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 1, items.length);
    
    return { start, end };
  }, [scrollTop.current, itemHeight, containerHeight, items.length]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;
  
  const handleScroll = useThrottledCallback((e: React.UIEvent<HTMLDivElement>) => {
    scrollTop.current = e.currentTarget.scrollTop;
  }, 16); // ~60fps
  
  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  };
}

/**
 * Bundle splitting helper for dynamic imports
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  return React.lazy(importFn);
}

/**
 * Query optimization hook for TanStack Query
 */
export function useOptimizedQuery() {
  const config = useMemo(() => ({
    staleTime: APP_CONFIG.PERFORMANCE.STALE_TIME,
    cacheTime: APP_CONFIG.PERFORMANCE.CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount: number, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  }), []);
  
  return config;
}

/**
 * Image optimization hook
 */
export function useOptimizedImage(src: string, alt: string) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    
    const handleLoad = () => setIsLoaded(true);
    const handleError = () => setError('Failed to load image');
    
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    
    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [src]);
  
  return {
    imgRef,
    isLoaded,
    error,
    imgProps: {
      src,
      alt,
      loading: 'lazy' as const,
      decoding: 'async' as const,
    },
  };
}

/**
 * Production-safe logging utilities
 * Only logs in development or when explicitly enabled
 */
const isDevelopment = process.env.NODE_ENV === 'development';
const isLoggingEnabled = isDevelopment || process.env.ENABLE_PERFORMANCE_LOGS === 'true';

export const performanceLog = {
  /**
   * Log performance-related information only in development
   */
  log: (message: string, data?: any) => {
    if (isLoggingEnabled) {
      console.log(`[PERF] ${message}`, data);
    }
  },

  /**
   * Time a function execution and log the result
   */
  time: <T>(label: string, fn: () => T): T => {
    if (isLoggingEnabled) {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      console.log(`[PERF] ${label}: ${(end - start).toFixed(2)}ms`);
      return result;
    }
    return fn();
  },

  /**
   * Time an async function execution and log the result
   */
  timeAsync: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    if (isLoggingEnabled) {
      const start = performance.now();
      const result = await fn();
      const end = performance.now();
      console.log(`[PERF] ${label}: ${(end - start).toFixed(2)}ms`);
      return result;
    }
    return await fn();
  }
};

/**
 * Development-only console logging that gets stripped in production
 */
export const devLog = {
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.error(message, ...args);
    }
  }
};

// Note: React is already imported and available