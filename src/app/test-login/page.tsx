'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/Button'

export default function TestLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  
  const { signIn } = useAuth()
  const router = useRouter()

  const handleTestLogin = async () => {
    setIsLoading(true)
    setResult('')
    
    console.log('🧪 Starting test login...')
    
    // Use the exact credentials that work in our script
    const email = 'jlaphotos88@gmail.com'
    const password = 'WorldWeaver2024!@#'
    
    console.log('Test credentials:', {
      email,
      password,
      passwordLength: password.length
    })
    
    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        setResult(`❌ Login failed: ${error.message}`)
        console.error('Test login failed:', error)
      } else {
        setResult('✅ Login successful! Redirecting...')
        console.log('✅ Test login successful!')
        setTimeout(() => {
          router.push('/')
        }, 1000)
      }
    } catch (error) {
      setResult(`❌ Unexpected error: ${error.message}`)
      console.error('Unexpected test login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDirectTestLogin = async () => {
    setIsLoading(true)
    setResult('')
    
    console.log('🔬 Starting DIRECT test login (bypassing AuthContext)...')
    
    const email = 'jlaphotos88@gmail.com'
    const password = 'WorldWeaver2024!@#'
    
    try {
      // Create client exactly like the script does
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('Environment check:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        url: supabaseUrl,
        keyLength: supabaseAnonKey?.length
      })
      
      const directClient = createClient(supabaseUrl, supabaseAnonKey)
      
      console.log('Direct client created, attempting signInWithPassword...')
      
      const { data, error } = await directClient.auth.signInWithPassword({
        email,
        password
      })
      
      console.log('Direct sign-in response:', {
        hasData: !!data,
        user: data?.user?.id ? 'User returned' : 'No user',
        session: data?.session ? 'Session created' : 'No session',
        error: error ? {
          message: error.message,
          code: error.code,
          status: error.status,
          details: error.details,
          hint: error.hint
        } : 'No error'
      })
      
      if (error) {
        setResult(`❌ Direct login failed: ${error.message}`)
        console.error('Direct test login failed:', error)
      } else {
        setResult('✅ Direct login successful! This proves the issue is in AuthContext.')
        console.log('✅ Direct test login successful!')
        // Sign out to clean up
        await directClient.auth.signOut()
      }
    } catch (error) {
      setResult(`❌ Direct test error: ${error.message}`)
      console.error('Direct test login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            🧪 Test Login
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Direct login with known working credentials
          </p>
        </div>
        
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800">
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Email:</strong> jlaphotos88@gmail.com</p>
              <p><strong>Password:</strong> WorldWeaver2024!@#</p>
              <p><strong>Length:</strong> 18 characters</p>
            </div>
            
            <Button
              onClick={handleTestLogin}
              disabled={isLoading}
              className="w-full mb-3"
            >
              {isLoading ? 'Testing login...' : 'Test Login (via AuthContext)'}
            </Button>
            
            <Button
              onClick={handleDirectTestLogin}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? 'Testing direct login...' : 'Test Direct Login (bypass AuthContext)'}
            </Button>
            
            {result && (
              <div className={`p-4 rounded-md text-sm ${
                result.includes('✅') 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                {result}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}