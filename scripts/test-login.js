const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing login with current credentials...')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  const email = 'jlaphotos88@gmail.com'
  const password = 'WorldWeaver2024!@#'
  
  try {
    console.log(`Testing login for: ${email}`)
    console.log(`Password: ${password}`)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('❌ Login failed:', {
        code: error.code,
        message: error.message,
        status: error.status
      })
    } else {
      console.log('✅ Login successful!')
      console.log('User ID:', data.user?.id)
      console.log('Email:', data.user?.email)
      
      // Sign out after test
      await supabase.auth.signOut()
      console.log('Signed out after test')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testLogin()