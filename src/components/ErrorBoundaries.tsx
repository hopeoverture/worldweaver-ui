/**
 * Global error boundary components
 */
'use client';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function AppErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center mb-4">
            <svg className="w-8 h-8 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Something went wrong</h2>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            An unexpected error occurred. Our team has been notified and is working to fix this issue.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                Show error details
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-neutral-800 p-2 rounded overflow-auto max-h-32">
                {error.message}
                {'\n'}
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={resetErrorBoundary}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeaderErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-4">
      <div className="flex items-center justify-between">
        <span className="text-red-800 dark:text-red-200">Header error occurred</span>
        <button 
          onClick={resetErrorBoundary}
          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function PageErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Page Error
        </h2>
        <p className="text-red-600 dark:text-red-400 mb-4">
          This page encountered an error. Please try refreshing or go back.
        </p>
        <button 
          onClick={resetErrorBoundary}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
