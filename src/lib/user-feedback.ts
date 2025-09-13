/**
 * User Feedback and UX Enhancement Utilities
 * 
 * Provides improved loading states, error messages, confirmation dialogs,
 * and other user experience enhancements.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { APP_CONFIG } from './config';
import { useLiveRegion } from './accessibility';
import { ServiceError } from './services/errors';

/**
 * Enhanced loading state management
 */
export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number; // 0-100 for progress bars
  stage?: string; // Current stage for multi-step operations
}

export function useLoadingState(initialMessage?: string): [
  LoadingState,
  {
    startLoading: (message?: string) => void;
    updateLoading: (update: Partial<LoadingState>) => void;
    stopLoading: () => void;
    setProgress: (progress: number, stage?: string) => void;
  }
] {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loadingMessage: initialMessage,
  });
  
  const { announceLoading } = useLiveRegion();
  
  const startLoading = useCallback((message?: string) => {
    const newMessage = message || initialMessage || 'Loading...';
    setLoadingState({
      isLoading: true,
      loadingMessage: newMessage,
      progress: undefined,
      stage: undefined,
    });
    announceLoading(newMessage);
  }, [initialMessage, announceLoading]);
  
  const updateLoading = useCallback((update: Partial<LoadingState>) => {
    setLoadingState(prev => ({ ...prev, ...update }));
    if (update.loadingMessage) {
      announceLoading(update.loadingMessage);
    }
  }, [announceLoading]);
  
  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({ ...prev, isLoading: false }));
  }, []);
  
  const setProgress = useCallback((progress: number, stage?: string) => {
    setLoadingState(prev => ({ ...prev, progress, stage }));
    if (stage) {
      announceLoading(`${stage}${progress > 0 ? ` (${Math.round(progress)}% complete)` : ''}`);
    }
  }, [announceLoading]);
  
  return [
    loadingState,
    { startLoading, updateLoading, stopLoading, setProgress }
  ];
}

/**
 * Enhanced error message utilities
 */
export interface UserFriendlyError {
  title: string;
  message: string;
  actionable?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
  details?: string; // Technical details for developers
}

export function createUserFriendlyError(
  error: unknown,
  context?: string
): UserFriendlyError {
  // Handle ServiceError instances
  if (error instanceof ServiceError) {
    return {
      title: getErrorTitle(error.code),
      message: error.getUserMessage(),
      actionable: true,
      actions: getErrorActions(error.code),
      details: error.message,
    };
  }
  
  // Handle network errors
  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        actionable: true,
        actions: [
          { label: 'Try Again', action: () => window.location.reload(), primary: true }
        ],
        details: error.message,
      };
    }
    
    if (error.message.includes('timeout')) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete. This might be due to a slow connection.',
        actionable: true,
        actions: [
          { label: 'Try Again', action: () => window.location.reload(), primary: true }
        ],
        details: error.message,
      };
    }
  }
  
  // Handle HTTP errors
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as any).status;
    
    switch (status) {
      case 401:
        return {
          title: 'Authentication Required',
          message: 'Your session has expired. Please sign in again.',
          actionable: true,
          actions: [
            { label: 'Sign In', action: () => window.location.href = '/auth/sign-in', primary: true }
          ],
        };
        
      case 403:
        return {
          title: 'Access Denied',
          message: 'You don\'t have permission to perform this action.',
          actionable: false,
        };
        
      case 404:
        return {
          title: 'Not Found',
          message: context ? `The ${context} you're looking for doesn't exist.` : 'The requested item was not found.',
          actionable: true,
          actions: [
            { label: 'Go Back', action: () => window.history.back(), primary: true }
          ],
        };
        
      case 429:
        return {
          title: 'Too Many Requests',
          message: 'You\'re making requests too quickly. Please wait a moment before trying again.',
          actionable: true,
          actions: [
            { label: 'Try Again Later', action: () => {}, primary: true }
          ],
        };
        
      case 500:
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Our team has been notified.',
          actionable: true,
          actions: [
            { label: 'Try Again', action: () => window.location.reload(), primary: true }
          ],
        };
    }
  }
  
  // Generic error fallback
  return {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    actionable: true,
    actions: [
      { label: 'Try Again', action: () => window.location.reload(), primary: true }
    ],
    details: error instanceof Error ? error.message : String(error),
  };
}

function getErrorTitle(errorCode: string): string {
  switch (errorCode) {
    case 'NOT_FOUND': return 'Not Found';
    case 'ACCESS_DENIED': return 'Access Denied';
    case 'VALIDATION_ERROR': return 'Invalid Input';
    case 'RATE_LIMITED': return 'Too Many Requests';
    case 'DATABASE_ERROR': return 'Data Error';
    default: return 'Error';
  }
}

function getErrorActions(errorCode: string) {
  switch (errorCode) {
    case 'NOT_FOUND':
      return [
        { label: 'Go Back', action: () => window.history.back(), primary: true }
      ];
    case 'ACCESS_DENIED':
      return [
        { label: 'Sign In', action: () => window.location.href = '/auth/sign-in', primary: true }
      ];
    case 'RATE_LIMITED':
      return [
        { label: 'Try Again Later', action: () => {}, primary: true }
      ];
    default:
      return [
        { label: 'Try Again', action: () => window.location.reload(), primary: true }
      ];
  }
}

/**
 * Confirmation dialog utilities
 */
export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  details?: string;
}

export function useConfirmationDialog(): [
  boolean, // isOpen
  (config: ConfirmationConfig) => Promise<boolean>,
  () => void, // close
  ConfirmationConfig | null // current config
] {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmationConfig | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  
  const confirm = useCallback((config: ConfirmationConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig(config);
      setIsOpen(true);
      resolveRef.current = resolve;
    });
  }, []);
  
  const close = useCallback((confirmed = false) => {
    setIsOpen(false);
    setConfig(null);
    if (resolveRef.current) {
      resolveRef.current(confirmed);
      resolveRef.current = null;
    }
  }, []);
  
  return [isOpen, confirm, () => close(), config];
}

/**
 * Smart loading skeleton hook
 */
export function useSmartSkeleton(
  isLoading: boolean,
  minDisplayTime: number = 300 // Minimum time to show skeleton to prevent flashing
) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const startTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setShowSkeleton(true);
    } else if (showSkeleton) {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
      setTimeout(() => {
        setShowSkeleton(false);
      }, remainingTime);
    }
  }, [isLoading, minDisplayTime, showSkeleton]);
  
  return showSkeleton;
}

/**
 * Toast notification enhancement
 */
export interface EnhancedToast {
  id: string;
  title?: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
  }>;
  icon?: React.ReactNode;
  progress?: number; // For progress toasts
}

export function createEnhancedToast(
  message: string,
  variant: EnhancedToast['variant'] = 'info',
  options: Partial<EnhancedToast> = {}
): EnhancedToast {
  return {
    id: Math.random().toString(36).substring(2, 9),
    message,
    variant,
    duration: APP_CONFIG.UI.TOAST_DURATION,
    ...options,
  };
}

/**
 * Progress tracking for multi-step operations
 */
export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description?: string;
  estimatedDuration?: number;
}

export function useProgressTracker(steps: Omit<ProgressStep, 'status'>[]) {
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>(
    steps.map(step => ({ ...step, status: 'pending' }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const { announceChange } = useLiveRegion();
  
  const startStep = useCallback((stepId: string) => {
    setProgressSteps(prev => prev.map(step => ({
      ...step,
      status: step.id === stepId ? 'active' : 
              step.status === 'completed' ? 'completed' : 'pending'
    })));
    
    const stepIndex = progressSteps.findIndex(s => s.id === stepId);
    setCurrentStepIndex(stepIndex);
    
    const step = progressSteps[stepIndex];
    if (step) {
      announceChange(`Starting step ${stepIndex + 1} of ${progressSteps.length}: ${step.label}`);
    }
  }, [progressSteps, announceChange]);
  
  const completeStep = useCallback((stepId: string) => {
    setProgressSteps(prev => prev.map(step => ({
      ...step,
      status: step.id === stepId ? 'completed' : step.status
    })));
    
    const stepIndex = progressSteps.findIndex(s => s.id === stepId);
    const step = progressSteps[stepIndex];
    if (step) {
      announceChange(`Completed step ${stepIndex + 1} of ${progressSteps.length}: ${step.label}`);
    }
  }, [progressSteps, announceChange]);
  
  const errorStep = useCallback((stepId: string, error?: string) => {
    setProgressSteps(prev => prev.map(step => ({
      ...step,
      status: step.id === stepId ? 'error' : step.status
    })));
    
    const stepIndex = progressSteps.findIndex(s => s.id === stepId);
    const step = progressSteps[stepIndex];
    if (step) {
      announceChange(`Error in step ${stepIndex + 1}: ${step.label}${error ? ` - ${error}` : ''}`, 'assertive');
    }
  }, [progressSteps, announceChange]);
  
  const resetProgress = useCallback(() => {
    setProgressSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));
    setCurrentStepIndex(0);
  }, []);
  
  const completedSteps = progressSteps.filter(s => s.status === 'completed').length;
  const progress = Math.round((completedSteps / progressSteps.length) * 100);
  
  return {
    progressSteps,
    currentStepIndex,
    progress,
    startStep,
    completeStep,
    errorStep,
    resetProgress,
  };
}

/**
 * Autosave hook with user feedback
 */
export function useAutosave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  options: {
    delay?: number;
    enabled?: boolean;
    onSave?: () => void;
    onError?: (error: unknown) => void;
  } = {}
) {
  const {
    delay = APP_CONFIG.PERFORMANCE.AUTOSAVE_DEBOUNCE,
    enabled = true,
    onSave,
    onError
  } = options;
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSavedRef = useRef<T>(data);
  
  const { announceChange } = useLiveRegion();
  
  useEffect(() => {
    if (!enabled) return;
    
    // Check if data has actually changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(lastSavedRef.current);
    if (!hasChanged) return;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set status to indicate unsaved changes
    setSaveStatus('idle');
    
    // Schedule save
    timeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      announceChange('Saving changes...');
      
      try {
        await saveFn(data);
        lastSavedRef.current = data;
        setSaveStatus('saved');
        announceChange('Changes saved');
        onSave?.();
        
        // Reset status after showing saved state
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('error');
        announceChange('Failed to save changes', 'assertive');
        onError?.(error);
      }
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, delay, saveFn, onSave, onError, announceChange]);
  
  return {
    saveStatus,
    hasUnsavedChanges: saveStatus === 'idle' && JSON.stringify(data) !== JSON.stringify(lastSavedRef.current),
  };
}