'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/types'
import { logAuthError } from '@/lib/logging'

export interface AuthErrorState {
  type: 'network' | 'credentials' | 'session' | 'profile' | 'rate_limit' | 'server' | 'unknown'
  message: string
  code?: string
  retryable: boolean
  retryAfter?: number
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  isLoading: boolean
  error: AuthErrorState | null
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthErrorState | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthErrorState | null }>
  signOut: () => Promise<{ error: AuthErrorState | null }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: AuthErrorState | null }>
  clearError: () => void
  retryLastOperation: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth error classification
function classifyAuthError(error: AuthError | Error | any): AuthErrorState {
  const message = error?.message || 'An unexpected error occurred'
  const code = error?.code || error?.status?.toString()
  
  // Network errors
  if (error?.name === 'TypeError' || message.includes('fetch') || message.includes('network')) {
    return {
      type: 'network',
      message: 'Network connection failed. Please check your internet connection.',
      code,
      retryable: true
    }
  }
  
  // Supabase specific errors
  if (error?.status === 400 || message.includes('Invalid login credentials')) {
    return {
      type: 'credentials',
      message: 'Invalid email or password. Please check your credentials and try again.',
      code,
      retryable: false
    }
  }
  
  if (error?.status === 422 || message.includes('email not confirmed')) {
    return {
      type: 'credentials',
      message: 'Please check your email and click the confirmation link before signing in.',
      code,
      retryable: false
    }
  }
  
  if (error?.status === 429 || message.includes('rate limit') || message.includes('too many')) {
    const retryAfter = error?.retryAfter || 60
    return {
      type: 'rate_limit',
      message: `Too many attempts. Please try again in ${retryAfter} seconds.`,
      code,
      retryable: true,
      retryAfter
    }
  }
  
  if (error?.status === 500 || error?.status === 502 || error?.status === 503) {
    return {
      type: 'server',
      message: 'Our servers are experiencing issues. Please try again in a moment.',
      code,
      retryable: true
    }
  }
  
  // Session/token errors
  if (message.includes('session') || message.includes('token') || message.includes('expired')) {
    return {
      type: 'session',
      message: 'Your session has expired. Please sign in again.',
      code,
      retryable: false
    }
  }
  
  // Profile/database errors
  if (message.includes('profile') || message.includes('permission')) {
    return {
      type: 'profile',
      message: 'Unable to load user profile. Some features may be limited.',
      code,
      retryable: true
    }
  }
  
  // Default unknown error
  return {
    type: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
    code,
    retryable: true
  }
}

// Create singleton Supabase client instance outside component to prevent multiple instances
let supabaseClient: ReturnType<typeof createClient> | null = null

const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client not available during SSR')
  }
  
  // Return existing instance if already created
  if (supabaseClient) {
    return supabaseClient
  }
  
  console.log('Creating Supabase client singleton...', {
    hasWindow: typeof window !== 'undefined',
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing'
  })
  
  try {
    supabaseClient = createClient()
    console.log('✅ Supabase client singleton created successfully')
    return supabaseClient
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    throw error
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthErrorState | null>(null)
  const [lastOperation, setLastOperation] = useState<(() => Promise<void>) | null>(null)

  // Clear error helper
  const clearError = () => setError(null)

  // Retry last operation with exponential backoff
  const retryLastOperation = async () => {
    if (lastOperation) {
      try {
        clearError()
        setLoading(true)
        await lastOperation()
      } catch (error) {
        const authError = classifyAuthError(error)
        setError(authError)
        logAuthError('retry_operation', error as Error, { action: 'retry_last_operation' })
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    // Skip initialization during SSR
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          const authError = classifyAuthError(error)
          setError(authError)
          logAuthError('initialize_session', error, { action: 'get_initial_session' })
        } else {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            // Fetch profile but don't let it block auth completion
            fetchProfile(session.user.id).catch(error => {
              console.warn('Initial profile fetch failed (non-critical):', error)
            })
          }
        }
        // Always complete loading, regardless of profile success
        setLoading(false)
      } catch (error) {
        const authError = classifyAuthError(error)
        setError(authError)
        logAuthError('initialize_session', error as Error, { action: 'get_initial_session' })
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const supabase = getSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            // Fetch profile but don't let it block auth completion
            fetchProfile(session.user.id).catch(error => {
              // Profile errors are non-critical - just log them
              console.warn('Profile fetch failed (non-critical):', error)
            })
          } else {
            setProfile(null)
          }
          
          // Always complete auth loading, regardless of profile success
          setLoading(false)
          
          // Clear errors on successful auth state change
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            clearError()
          }
          
        } catch (error) {
          const authError = classifyAuthError(error)
          setError(authError)
          logAuthError('auth_state_change', error as Error, { 
            action: 'auth_state_change',
            metadata: { event }
          })
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // For missing profiles (PGRST116), don't treat as auth error
        if (error.code === 'PGRST116') {
          console.info('No profile found for user - this is normal for new users')
          setProfile(null)
        } else {
          // Other profile errors are still logged but don't break auth
          logAuthError('fetch_profile', error, { 
            action: 'fetch_profile',
            userId: userId.substring(0, 8) + '...' 
          })
          setProfile(null)
        }
      } else {
        setProfile(data)
      }
    } catch (error) {
      logAuthError('fetch_profile', error as Error, { 
        action: 'fetch_profile',
        userId: userId.substring(0, 8) + '...' 
      })
      setProfile(null)
    }
    // Note: Don't set loading to false here - auth state handler manages that
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const operation = async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      })
      
      if (error) {
        throw error
      }
    }

    try {
      setLoading(true)
      clearError()
      setLastOperation(() => operation)
      
      await operation()
      return { error: null }
    } catch (error) {
      const authError = classifyAuthError(error)
      setError(authError)
      logAuthError('sign_up', error as Error, { 
        action: 'sign_up',
        metadata: { email: email.split('@')[0] + '@...' }
      })
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      clearError()
      
      const supabase = getSupabaseClient()
      
      console.log('Attempting sign-in with:', {
        email: email.split('@')[0] + '@...',
        hasPassword: !!password,
        passwordLength: password.length
      })
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<{ data: null, error: Error }>((resolve) => {
        setTimeout(() => resolve({ 
          data: null, 
          error: new Error('Sign-in timeout after 10 seconds') 
        }), 10000)
      })
      
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('About to race promises - signInPromise vs timeout...')
      const { data, error } = await Promise.race([signInPromise, timeoutPromise])
      console.log('Promise race completed successfully')
      
      console.log('Supabase sign-in response:', {
        hasData: !!data,
        user: data?.user?.id ? 'User returned' : 'No user',
        session: data?.session ? 'Session created' : 'No session',
        error: error ? {
          message: error.message,
          code: (error as any)?.code,
          status: (error as any)?.status,
          details: (error as any)?.details,
          hint: (error as any)?.hint
        } : 'No error'
      })
      
      if (error) {
        const authError = classifyAuthError(error)
        setError(authError)
        
        console.error('Sign-in failed with Supabase error:', {
          originalError: error,
          classifiedError: authError,
          email: email.split('@')[0] + '@...'
        })
        
        logAuthError('sign_in', error, { 
          action: 'sign_in',
          metadata: { 
            email: email.split('@')[0] + '@...',
            errorCode: (error as any)?.code,
            errorStatus: (error as any)?.status
          }
        })
        
        return { error: authError }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Unexpected error during sign-in:', error)
      const authError = classifyAuthError(error)
      setError(authError)
      logAuthError('sign_in_unexpected', error as Error, { action: 'sign_in' })
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    const operation = async () => {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
    }

    try {
      setLoading(true)
      clearError()
      setLastOperation(() => operation)
      
      await operation()
      return { error: null }
    } catch (error) {
      const authError = classifyAuthError(error)
      setError(authError)
      logAuthError('sign_out', error as Error, { action: 'sign_out' })
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      const authError: AuthErrorState = {
        type: 'session',
        message: 'You must be signed in to update your profile.',
        retryable: false
      }
      setError(authError)
      return { error: authError }
    }
    
    const operation = async () => {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        throw error
      }
      
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    }

    try {
      clearError()
      setLastOperation(() => operation)
      
      await operation()
      return { error: null }
    } catch (error) {
      const authError = classifyAuthError(error)
      setError(authError)
      logAuthError('update_profile', error as Error, { 
        action: 'update_profile',
        userId: user.id.substring(0, 8) + '...'
      })
      return { error: authError }
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    isLoading: loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    clearError,
    retryLastOperation,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
