'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import type { AuthErrorState } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { signIn, error, clearError, retryLastOperation } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    clearError()

    const { error: signInError } = await signIn(email, password)
    
    if (!signInError) {
      router.push('/')
    }
    
    setIsLoading(false)
  }

  const handleRetry = async () => {
    setIsLoading(true)
    await retryLastOperation()
    setIsLoading(false)
  }

  const getErrorDisplay = (error: AuthErrorState) => {
    const isRetryable = error.retryable
    const isRateLimit = error.type === 'rate_limit'
    
    return (
      <div className={`border rounded-md p-4 ${
        error.type === 'network' ? 'bg-blue-50 border-blue-200' :
        error.type === 'credentials' ? 'bg-red-50 border-red-200' :
        error.type === 'rate_limit' ? 'bg-amber-50 border-amber-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {error.type === 'network' ? (
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : error.type === 'rate_limit' ? (
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm ${
              error.type === 'network' ? 'text-blue-800' :
              error.type === 'rate_limit' ? 'text-amber-800' :
              'text-red-800'
            }`}>
              {error.message}
            </p>
            
            {isRetryable && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleRetry}
                  disabled={isLoading}
                  className={`text-sm font-medium px-3 py-1 rounded ${
                    error.type === 'network' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                    error.type === 'rate_limit' ? 'bg-amber-600 hover:bg-amber-700 text-white' :
                    'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:opacity-50`}
                >
                  {isLoading ? 'Retrying...' : isRateLimit ? 'Try Again' : 'Retry'}
                </button>
                
                <button
                  onClick={clearError}
                  className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1"
                >
                  Dismiss
                </button>
              </div>
            )}
            
            {!isRetryable && (
              <button
                onClick={clearError}
                className="mt-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 dark:bg-brand-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Welcome back to WorldWeaver
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in to continue building your worlds
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1"
              />
            </div>
          </div>

          {error && getErrorDisplay(error)}

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-blue-600 dark:text-brand-400 hover:text-blue-500 dark:hover:text-brand-300">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}