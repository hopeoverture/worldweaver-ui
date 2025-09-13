/**
 * Accessibility Utilities and Hooks
 * 
 * Provides comprehensive accessibility support including ARIA attributes,
 * keyboard navigation, focus management, and screen reader utilities.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { APP_CONFIG } from './config';

/**
 * ARIA live region announcer for screen readers
 */
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer | null = null;
  private liveRegion: HTMLElement | null = null;
  private politeRegion: HTMLElement | null = null;

  private constructor() {
    this.createLiveRegions();
  }

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }

  private createLiveRegions() {
    if (typeof window === 'undefined') return;

    // Assertive live region for immediate announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'assertive');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.setAttribute('class', 'sr-only');
    this.liveRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;

    // Polite live region for non-urgent announcements
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.setAttribute('class', 'sr-only');
    this.politeRegion.style.cssText = this.liveRegion.style.cssText;

    document.body.appendChild(this.liveRegion);
    document.body.appendChild(this.politeRegion);
  }

  /**
   * Announce message immediately (interrupts other announcements)
   */
  announceAssertive(message: string) {
    if (!this.liveRegion) return;
    
    this.liveRegion.textContent = '';
    
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, APP_CONFIG.ACCESSIBILITY.ANNOUNCEMENT_DELAY);
  }

  /**
   * Announce message politely (waits for current announcements to finish)
   */
  announcePolite(message: string) {
    if (!this.politeRegion) return;
    
    this.politeRegion.textContent = '';
    
    setTimeout(() => {
      if (this.politeRegion) {
        this.politeRegion.textContent = message;
      }
    }, APP_CONFIG.ACCESSIBILITY.ANNOUNCEMENT_DELAY);
  }
}

/**
 * Hook for screen reader announcements
 */
export function useScreenReader() {
  const announcer = ScreenReaderAnnouncer.getInstance();
  
  const announce = useCallback((message: string, priority: 'assertive' | 'polite' = 'polite') => {
    if (priority === 'assertive') {
      announcer.announceAssertive(message);
    } else {
      announcer.announcePolite(message);
    }
  }, [announcer]);
  
  return { announce };
}

/**
 * Focus management hook
 */
export function useFocusManagement() {
  const previousFocus = useRef<HTMLElement | null>(null);
  
  const saveFocus = useCallback(() => {
    previousFocus.current = document.activeElement as HTMLElement;
  }, []);
  
  const restoreFocus = useCallback(() => {
    if (previousFocus.current && previousFocus.current.focus) {
      previousFocus.current.focus();
    }
  }, []);
  
  const focusFirst = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  }, []);
  
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);
  
  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    trapFocus,
  };
}

/**
 * Keyboard navigation hook
 */
export function useKeyboardNavigation(
  onEscape?: () => void,
  onEnter?: () => void,
  onSpace?: () => void,
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void
) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;
      case 'Enter':
        if (onEnter) {
          e.preventDefault();
          onEnter();
        }
        break;
      case ' ':
      case 'Space':
        if (onSpace) {
          e.preventDefault();
          onSpace();
        }
        break;
      case 'ArrowUp':
        if (onArrowKeys) {
          e.preventDefault();
          onArrowKeys('up');
        }
        break;
      case 'ArrowDown':
        if (onArrowKeys) {
          e.preventDefault();
          onArrowKeys('down');
        }
        break;
      case 'ArrowLeft':
        if (onArrowKeys) {
          e.preventDefault();
          onArrowKeys('left');
        }
        break;
      case 'ArrowRight':
        if (onArrowKeys) {
          e.preventDefault();
          onArrowKeys('right');
        }
        break;
    }
  }, [onEscape, onEnter, onSpace, onArrowKeys]);
  
  return { handleKeyDown };
}

/**
 * ARIA attributes generator
 */
export function generateAriaAttributes(config: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  level?: number;
  setSize?: number;
  posInSet?: number;
  hasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  controls?: string;
  owns?: string;
  live?: 'off' | 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: string;
  role?: string;
}) {
  const attributes: Record<string, string | boolean | number> = {};
  
  if (config.label) attributes['aria-label'] = config.label;
  if (config.labelledBy) attributes['aria-labelledby'] = config.labelledBy;
  if (config.describedBy) attributes['aria-describedby'] = config.describedBy;
  if (config.expanded !== undefined) attributes['aria-expanded'] = config.expanded;
  if (config.selected !== undefined) attributes['aria-selected'] = config.selected;
  if (config.checked !== undefined) attributes['aria-checked'] = config.checked;
  if (config.disabled !== undefined) attributes['aria-disabled'] = config.disabled;
  if (config.required !== undefined) attributes['aria-required'] = config.required;
  if (config.invalid !== undefined) attributes['aria-invalid'] = config.invalid;
  if (config.level !== undefined) attributes['aria-level'] = config.level;
  if (config.setSize !== undefined) attributes['aria-setsize'] = config.setSize;
  if (config.posInSet !== undefined) attributes['aria-posinset'] = config.posInSet;
  if (config.hasPopup !== undefined) attributes['aria-haspopup'] = config.hasPopup;
  if (config.controls) attributes['aria-controls'] = config.controls;
  if (config.owns) attributes['aria-owns'] = config.owns;
  if (config.live) attributes['aria-live'] = config.live;
  if (config.atomic !== undefined) attributes['aria-atomic'] = config.atomic;
  if (config.relevant) attributes['aria-relevant'] = config.relevant;
  if (config.role) attributes['role'] = config.role;
  
  return attributes;
}

/**
 * Skip navigation configuration
 */
export function createSkipNavigation(targets: { href: string; label: string }[]) {
  return {
    targets,
    className: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50",
    linkClassName: "bg-blue-600 text-white px-4 py-2 rounded-md mr-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  };
}

/**
 * Color contrast utilities
 */
export function checkColorContrast(
  foreground: string,
  background: string,
  largeText: boolean = false
): { ratio: number; passesAA: boolean; passesAAA: boolean } {
  // This is a simplified implementation
  // In a real app, you'd use a proper color contrast library
  const minRatio = largeText 
    ? APP_CONFIG.ACCESSIBILITY.LARGE_TEXT_CONTRAST_RATIO 
    : APP_CONFIG.ACCESSIBILITY.MIN_CONTRAST_RATIO;
  
  // Mock calculation for demonstration
  const ratio = 4.5; // This would be calculated from actual colors
  
  return {
    ratio,
    passesAA: ratio >= minRatio,
    passesAAA: ratio >= 7.0,
  };
}

/**
 * Reduced motion detection
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  return prefersReducedMotion;
}

/**
 * High contrast mode detection
 */
export function useHighContrastMode(): boolean {
  const [highContrast, setHighContrast] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  return highContrast;
}

/**
 * Auto-focus hook for modals and dialogs
 */
export function useAutoFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  
  useEffect(() => {
    if (ref.current) {
      // Small delay to ensure the element is fully rendered
      const timer = setTimeout(() => {
        if (ref.current) {
          ref.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  return ref;
}

/**
 * Live region hook for dynamic content updates
 */
export function useLiveRegion() {
  const { announce } = useScreenReader();
  
  const announceChange = useCallback((
    message: string, 
    priority: 'assertive' | 'polite' = 'polite'
  ) => {
    announce(message, priority);
  }, [announce]);
  
  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`, 'assertive');
  }, [announce]);
  
  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`, 'polite');
  }, [announce]);
  
  const announceLoading = useCallback((message: string = 'Loading...') => {
    announce(message, 'polite');
  }, [announce]);
  
  return {
    announceChange,
    announceError,
    announceSuccess,
    announceLoading,
  };
}

/**
 * Roving tabindex hook for managing focus in lists/grids
 */
export function useRovingTabIndex<T extends HTMLElement>(
  items: React.RefObject<T>[],
  orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const handleKeyDown = useCallback((e: KeyboardEvent, index: number) => {
    let newIndex = index;
    
    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          newIndex = Math.min(items.length - 1, index + 1);
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          newIndex = Math.max(0, index - 1);
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          newIndex = Math.min(items.length - 1, index + 1);
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          newIndex = Math.max(0, index - 1);
        }
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
    }
    
    if (newIndex !== index) {
      setCurrentIndex(newIndex);
      items[newIndex]?.current?.focus();
    }
  }, [items, orientation]);
  
  const getTabIndex = useCallback((index: number) => {
    return index === currentIndex ? 0 : -1;
  }, [currentIndex]);
  
  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
    getTabIndex,
  };
}