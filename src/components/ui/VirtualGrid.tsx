'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Virtual Grid component for efficient rendering of large lists
 * Only renders visible items plus a buffer to improve performance
 */

export interface VirtualGridProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Number of columns in the grid */
  columns: number;
  /** Gap between items in pixels */
  gap?: number;
  /** Container height in pixels (if not provided, uses viewport height) */
  containerHeight?: number;
  /** Buffer of items to render outside visible area */
  overscan?: number;
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Optional loading state */
  isLoading?: boolean;
  /** Optional empty state component */
  emptyState?: React.ReactNode;
  /** Optional className for the container */
  className?: string;
}

export function VirtualGrid<T>({
  items,
  itemHeight,
  columns,
  gap = 16,
  containerHeight,
  overscan = 5,
  renderItem,
  isLoading = false,
  emptyState,
  className = ''
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate dimensions and visible range
  const { visibleRange, totalHeight, itemWidth } = useMemo(() => {
    const effectiveHeight = containerHeight || containerSize.height || 600;
    const rowHeight = itemHeight + gap;
    const totalRows = Math.ceil(items.length / columns);
    const totalHeight = Math.max(totalRows * rowHeight - gap, 0);
    
    // Calculate visible row range
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.min(
      startRow + Math.ceil(effectiveHeight / rowHeight) + 1,
      totalRows
    );

    // Add overscan
    const startRowWithOverscan = Math.max(0, startRow - overscan);
    const endRowWithOverscan = Math.min(totalRows, endRow + overscan);

    // Convert to item indices
    const startIndex = startRowWithOverscan * columns;
    const endIndex = Math.min(endRowWithOverscan * columns, items.length);

    // Calculate item width
    const availableWidth = containerSize.width - (columns - 1) * gap;
    const itemWidth = Math.max(0, availableWidth / columns);

    return {
      visibleRange: { startIndex, endIndex },
      totalHeight,
      itemWidth
    };
  }, [items.length, columns, itemHeight, gap, scrollTop, containerSize, containerHeight, overscan]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Measure container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Generate visible items with positioning
  const visibleItems = useMemo(() => {
    if (!items.length) return [];
    
    const result = [];
    const { startIndex, endIndex } = visibleRange;
    
    for (let i = startIndex; i < endIndex; i++) {
      if (i >= items.length) break;
      
      const item = items[i];
      const row = Math.floor(i / columns);
      const col = i % columns;
      
      const top = row * (itemHeight + gap);
      const left = col * (itemWidth + gap);
      
      result.push({
        item,
        index: i,
        style: {
          position: 'absolute' as const,
          top,
          left,
          width: itemWidth,
          height: itemHeight
        }
      });
    }
    
    return result;
  }, [items, visibleRange, columns, itemHeight, gap, itemWidth]);

  // Show empty state
  if (!isLoading && items.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  // Show loading state
  if (isLoading && emptyState) {
    return <div className={className}>{emptyState}</div>;
  } else if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-gray-200 dark:border-neutral-700 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full ${containerHeight ? '' : 'h-[600px]'} ${className}`}
      style={containerHeight ? { height: containerHeight } : undefined}
    >
      <div
        ref={scrollElementRef}
        className="w-full h-full overflow-auto"
        onScroll={handleScroll}
      >
        <div
          className="relative w-full"
          style={{ height: totalHeight }}
        >
          {visibleItems.map(({ item, index, style }) => (
            <div
              key={index}
              style={style}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for responsive column calculation
 * Automatically adjusts columns based on container width
 */
export function useResponsiveColumns({
  minItemWidth = 280,
  maxColumns = 6,
  gap = 16
}: {
  minItemWidth?: number;
  maxColumns?: number;
  gap?: number;
} = {}) {
  const [columns, setColumns] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateColumns = () => {
      const containerWidth = container.offsetWidth;
      const availableWidth = containerWidth - gap;
      const possibleColumns = Math.floor(availableWidth / (minItemWidth + gap));
      const finalColumns = Math.min(Math.max(1, possibleColumns), maxColumns);
      setColumns(finalColumns);
    };

    const resizeObserver = new ResizeObserver(updateColumns);
    resizeObserver.observe(container);
    
    // Initial calculation
    updateColumns();

    return () => resizeObserver.disconnect();
  }, [minItemWidth, maxColumns, gap]);

  return { columns, containerRef };
}

/**
 * Virtual Grid with automatic responsive columns
 * Combines VirtualGrid with responsive column calculation
 */
export function ResponsiveVirtualGrid<T>(props: Omit<VirtualGridProps<T>, 'columns'> & {
  minItemWidth?: number;
  maxColumns?: number;
}) {
  const { minItemWidth, maxColumns, ...gridProps } = props;
  const { columns, containerRef } = useResponsiveColumns({ 
    minItemWidth, 
    maxColumns, 
    gap: gridProps.gap 
  });

  return (
    <div ref={containerRef} className="w-full">
      <VirtualGrid
        {...gridProps}
        columns={columns}
      />
    </div>
  );
}