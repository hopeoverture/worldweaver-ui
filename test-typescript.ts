// TypeScript Integration Test
import { createClient } from '@/lib/supabase/client'
import type { Template, World, Entity } from '@/lib/supabase/types'

async function testTypes() {
  const supabase = createClient()
  
  console.log('🧪 Testing TypeScript integration...')
  
  try {
    // Test templates query with proper typing
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('*')
      .eq('is_system', true)
    
    if (templatesError) {
      console.error('❌ Templates error:', templatesError)
      return
    }
    
    console.log('✅ Templates query successful!')
    console.log(`📋 Found ${templates?.length || 0} system templates`)
    
    // Type check - this will only compile if types are correct
    templates?.forEach((template: Template) => {
      console.log(`  - ${template.name} (ID: ${template.id})`)
      console.log(`    Category: ${template.category}`)
      console.log(`    System: ${template.is_system}`)
      console.log(`    Fields: ${Array.isArray(template.fields) ? template.fields.length : 0} fields`)
    })
    
    // Test that we can access the auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('👤 Auth status:', user ? `Logged in as ${user.email}` : 'Not logged in')
    
    console.log('🎉 TypeScript integration test passed!')
    
  } catch (error) {
    console.error('💥 TypeScript integration test failed:', error)
  }
}

export default testTypes
