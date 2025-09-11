const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetPassword() {
  const email = 'jlaphotos88@gmail.com'
  const newPassword = 'WorldWeaver2024!@#'  // Strong password for testing
  
  try {
    console.log(`Resetting password for: ${email}`)
    console.log(`New password will be: ${newPassword}`)
    
    // First, get the user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return
    }
    
    const user = users.find(u => u.email === email)
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      return
    }
    
    console.log(`Found user: ${user.id}`)
    
    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )
    
    if (updateError) {
      console.error('❌ Error updating password:', updateError)
      return
    }
    
    console.log('✅ Password reset successfully!')
    console.log(`\n🔑 New login credentials:`)
    console.log(`Email: ${email}`)
    console.log(`Password: ${newPassword}`)
    console.log(`\nYou can now sign in with these credentials.`)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

resetPassword()