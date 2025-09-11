const { createClient } = require('@supabase/supabase-js')

// Use your service role key to bypass RLS
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

async function confirmAllUsers() {
  try {
    console.log('Getting list of users...')
    
    // First, get all users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return
    }
    
    console.log(`Found ${users.length} users`)
    
    // Find unconfirmed users
    const unconfirmedUsers = users.filter(user => !user.email_confirmed_at)
    console.log(`Found ${unconfirmedUsers.length} unconfirmed users`)
    
    if (unconfirmedUsers.length === 0) {
      console.log('All users are already confirmed!')
      return
    }
    
    // Confirm each unconfirmed user
    for (const user of unconfirmedUsers) {
      console.log(`Confirming user: ${user.email}`)
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      )
      
      if (updateError) {
        console.error(`Error confirming user ${user.email}:`, updateError)
      } else {
        console.log(`✅ Confirmed user: ${user.email}`)
      }
    }
    
    console.log('✅ All users confirmed! They can now sign in.')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

confirmAllUsers()