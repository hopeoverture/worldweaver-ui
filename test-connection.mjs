// Test Supabase Connection
// Run this to verify the database is working

import { createBrowserClient } from '@supabase/ssr'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testConnection() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  console.log('🔍 Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('templates')
      .select('id, name, is_system')
      .eq('is_system', true)
      .limit(5)
    
    if (error) {
      console.error('❌ Database error:', error)
      return
    }
    
    console.log('✅ Connection successful!')
    console.log(`📋 Found ${data?.length || 0} system templates:`)
    data?.forEach(template => {
      console.log(`  - ${template.name} (${template.id})`)
    })
    
    // Test authentication (will be null since we're not logged in)
    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 Auth status:', user ? `Logged in as ${user.email}` : 'Not logged in')
    
  } catch (err) {
    console.error('💥 Unexpected error:', err)
  }
}

testConnection()
