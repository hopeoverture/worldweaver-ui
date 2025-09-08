/**
 * Route-specific error boundaries for critical application paths
 */
'use client';

import { ErrorBoundary } from 'react-error-boundary';
import { PageErrorFallback } from './ErrorBoundaries';
import { createErrorBoundaryLogger } from '@/lib/logging';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  routeName: string;
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

/**
 * Generic route error boundary
 */
export function RouteErrorBoundary({ children, routeName, fallback: CustomFallback }: RouteErrorBoundaryProps) {
  const FallbackComponent = CustomFallback || PageErrorFallback;
  
  return (
    <ErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={createErrorBoundaryLogger(`route_${routeName}`)}
      onReset={() => {
        // Reset any route-specific state here if needed
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * World management error boundary
 */
function WorldErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          World Loading Error
        </h2>
        <p className="text-red-600 dark:text-red-400 mb-4">
          We couldn't load this world. This might be due to network issues or the world may not exist.
        </p>
        <div className="flex gap-2">
          <button 
            onClick={resetErrorBoundary}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Try Again
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-md text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export function WorldErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <RouteErrorBoundary routeName="world" fallback={WorldErrorFallback}>
      {children}
    </RouteErrorBoundary>
  );
}

/**
 * Entity management error boundary
 */
function EntityErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
        Entity Error
      </h3>
      <p className="text-amber-600 dark:text-amber-400 text-sm mb-3">
        This entity couldn't be loaded or saved. You can try again or continue working with other entities.
      </p>
      <button 
        onClick={resetErrorBoundary}
        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm"
      >
        Retry
      </button>
    </div>
  );
}

export function EntityErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <RouteErrorBoundary routeName="entity" fallback={EntityErrorFallback}>
      {children}
    </RouteErrorBoundary>
  );
}

/**
 * Template management error boundary
 */
function TemplateErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
        Template Error
      </h3>
      <p className="text-blue-600 dark:text-blue-400 text-sm mb-3">
        This template couldn't be loaded. This might affect entity creation and editing.
      </p>
      <button 
        onClick={resetErrorBoundary}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
      >
        Reload Template
      </button>
    </div>
  );
}

export function TemplateErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <RouteErrorBoundary routeName="template" fallback={TemplateErrorFallback}>
      {children}
    </RouteErrorBoundary>
  );
}

/**
 * Authentication error boundary
 */
function AuthErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Authentication Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was a problem with authentication. Please try signing in again.
          </p>
          <div className="flex gap-2">
            <button 
              onClick={resetErrorBoundary}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.href = '/login'}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-md text-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <RouteErrorBoundary routeName="auth" fallback={AuthErrorFallback}>
      {children}
    </RouteErrorBoundary>
  );
}

/**
 * API error boundary for components that make API calls
 */
function ApiErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const isNetworkError = error.name === 'TypeError' || error.message.includes('fetch');
  const isServerError = error.message.includes('500') || error.message.includes('502') || error.message.includes('503');
  
  return (
    <div className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        {isNetworkError ? 'Connection Error' : isServerError ? 'Server Error' : 'API Error'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
        {isNetworkError 
          ? 'Check your internet connection and try again.'
          : isServerError 
          ? 'Our servers are having issues. Please try again in a moment.'
          : 'Something went wrong with this request. Please try again.'
        }
      </p>
      <div className="flex gap-2">
        <button 
          onClick={resetErrorBoundary}
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
        >
          Retry
        </button>
        {isNetworkError && (
          <button 
            onClick={() => window.location.reload()}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-900 dark:text-gray-100 px-3 py-1 rounded text-sm"
          >
            Refresh Page
          </button>
        )}
      </div>
    </div>
  );
}

export function ApiErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <RouteErrorBoundary routeName="api" fallback={ApiErrorFallback}>
      {children}
    </RouteErrorBoundary>
  );
}
