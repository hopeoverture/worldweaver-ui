const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'MISSING')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    // Test basic connection
    console.log('Testing basic connection...')
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.error('❌ Connection test failed:', error)
    } else {
      console.log('✅ Connection successful')
    }
    
    // Test auth endpoint
    console.log('Testing auth endpoint...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth endpoint test failed:', authError)
    } else {
      console.log('✅ Auth endpoint accessible')
      console.log('Current session:', authData.session ? 'Active' : 'None')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testConnection()