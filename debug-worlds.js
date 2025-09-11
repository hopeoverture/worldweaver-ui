// Quick database test script
// Run with: node debug-worlds.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Present' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 Testing direct database connection...');
  
  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('worlds')
      .select('id, name, user_id, owner_id, created_at')
      .limit(5);
    
    console.log('📊 Database test result:', {
      hasError: !!testError,
      error: testError?.message,
      worldCount: testData?.length || 0,
      worlds: testData || []
    });
    
    if (testError) {
      console.log('❌ Database error:', testError);
    } else {
      console.log('✅ Database connection working');
      if (testData && testData.length > 0) {
        console.log('📋 Found worlds:', testData.map(w => ({
          id: w.id,
          name: w.name,
          user_id: w.user_id,
          owner_id: w.owner_id
        })));
      } else {
        console.log('📭 No worlds found in database');
      }
    }
    
  } catch (error) {
    console.log('💥 Database test failed:', error);
  }
}

testDatabase();