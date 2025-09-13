/**
 * Session timeout handling and user notification system
 */
'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { logAuthError, logInfo } from '@/lib/logging'

interface SessionTimeoutProps {
  children: React.ReactNode
}

const SESSION_WARNING_TIME = 2 * 60 * 1000 // 2 minutes before expiry
const SESSION_CHECK_INTERVAL = 60 * 1000 // Check every minute
const IDLE_WARNING_TIME = 25 * 60 * 1000 // 25 minutes of inactivity
const IDLE_LOGOUT_TIME = 30 * 60 * 1000 // 30 minutes of inactivity

export function SessionTimeoutProvider({ children }: SessionTimeoutProps) {
  const { user, session, signOut } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [showIdleWarning, setShowIdleWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const lastActivityRef = useRef(Date.now())
  const warningIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const idleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Update last activity time
  const updateActivity = () => {
    lastActivityRef.current = Date.now()
    setShowIdleWarning(false)
    
    // Clear existing idle timeout
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current)
    }
    
    // Set new idle warning timeout
    idleTimeoutRef.current = setTimeout(() => {
      setShowIdleWarning(true)
      
      // Set logout timeout
      setTimeout(async () => {
        try {
          await signOut()
          logAuthError('session_idle_logout', new Error('Session ended due to inactivity'), {
            action: 'idle_logout'
          })
        } catch (error) {
          logAuthError('session_idle_logout_failed', error as Error, {
            action: 'idle_logout_failed'
          })
        }
      }, 5 * 60 * 1000) // 5 minutes to respond to idle warning
    }, IDLE_WARNING_TIME)
  }

  // Activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      updateActivity()
    }

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Initial activity setup
    updateActivity()

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current)
      }
    }
  }, [])

  // Session expiry monitoring
  useEffect(() => {
    if (!session || !session.expires_at) return

    const checkSessionExpiry = () => {
      const now = Date.now()
      const expiresAt = new Date(session.expires_at! * 1000).getTime()
      const timeUntilExpiry = expiresAt - now

      // Show warning if close to expiry
      if (timeUntilExpiry <= SESSION_WARNING_TIME && timeUntilExpiry > 0) {
        setShowWarning(true)
        setTimeLeft(Math.ceil(timeUntilExpiry / 1000 / 60)) // minutes
        
        // Start countdown
        if (warningIntervalRef.current) {
          clearInterval(warningIntervalRef.current)
        }
        
        warningIntervalRef.current = setInterval(() => {
          const currentTimeLeft = Math.ceil((expiresAt - Date.now()) / 1000 / 60)
          setTimeLeft(currentTimeLeft)
          
          if (currentTimeLeft <= 0) {
            setShowWarning(false)
            clearInterval(warningIntervalRef.current!)
          }
        }, 60 * 1000) // Update every minute
      } else if (timeUntilExpiry <= 0) {
        // Session expired
        setShowWarning(false)
        logAuthError('session_expired', new Error('Session expired'), {
          action: 'session_expired'
        })
      }
    }

    // Check immediately
    checkSessionExpiry()

    // Set up periodic checking
    const interval = setInterval(checkSessionExpiry, SESSION_CHECK_INTERVAL)

    return () => {
      clearInterval(interval)
      if (warningIntervalRef.current) {
        clearInterval(warningIntervalRef.current)
      }
    }
  }, [session])

  const extendSession = async () => {
    // Force token refresh
    try {
      const { data: { session: newSession }, error } = await (await import('@/lib/supabase/browser')).createClient().auth.getSession()
      
      if (error) {
        logAuthError('session_extend_failed', error, { action: 'extend_session' })
      } else {
        setShowWarning(false)
        setTimeLeft(null)
        logInfo('Session extended successfully', { action: 'extend_session', component: 'auth' })
      }
    } catch (error) {
      logAuthError('session_extend_error', error as Error, { action: 'extend_session' })
    }
  }

  const dismissIdleWarning = () => {
    setShowIdleWarning(false)
    updateActivity()
  }

  return (
    <>
      {children}
      
      {/* Session Expiry Warning */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-amber-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Session Expiring Soon
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your session will expire in {timeLeft} minute{timeLeft !== 1 ? 's' : ''}. 
              Would you like to extend your session?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={extendSession}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Extend Session
              </button>
              <button
                onClick={() => signOut()}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Idle Warning */}
      {showIdleWarning && (
        <div className="fixed top-4 right-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 shadow-lg z-40 max-w-sm">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                Idle Session Warning
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                You'll be signed out in 5 minutes due to inactivity.
              </p>
              <button
                onClick={dismissIdleWarning}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm"
              >
                Stay Signed In
              </button>
            </div>
            
            <button
              onClick={() => setShowIdleWarning(false)}
              className="text-amber-500 hover:text-amber-700 ml-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default SessionTimeoutProvider
