'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Something went wrong</h1>
        </div>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          An unexpected error occurred while rendering this page.
          {error?.message ? ' ' + error.message : ''}
        </p>
        {error?.digest && (
          <p className="mt-2 text-xs text-gray-400">Error ID: {error.digest}</p>
        )}
        <div className="mt-6 flex gap-3">
          <Button onClick={() => reset()} className="">Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}

