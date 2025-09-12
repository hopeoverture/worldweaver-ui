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

async function listUsers() {
  try {
    console.log('Getting list of users...')
    
    // Get all users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return
    }
    
    console.log(`\n📋 Found ${users.length} users in database:\n`)
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Confirmed: ${user.email_confirmed_at ? '✅ Yes' : '❌ No'}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`)
      console.log(`   User Metadata: ${JSON.stringify(user.user_metadata, null, 2)}`)
      console.log('   ---')
    })
    
    if (users.length === 0) {
      console.log('🚨 No users found! You may need to register first.')
    } else {
      console.log('\n💡 To sign in, use the EXACT email shown above and the password you used during registration.')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

listUsers()