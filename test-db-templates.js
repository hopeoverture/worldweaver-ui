const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWorldTemplatesDatabase() {
  try {
    const worldId = '7f4ae79e-baaa-43c9-831f-6f6ae1a28996'; // Replace with your actual world ID
    
    console.log(`Testing templates for world: ${worldId}`);
    
    // Test the same query the service uses
    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .or(`is_system.eq.true,world_id.eq.${worldId}`)
      .order('name');

    if (error) {
      console.error('Database error:', error);
      return;
    }

    console.log(`\nFound ${templates?.length || 0} templates total`);
    
    if (templates && templates.length > 0) {
      const systemTemplates = templates.filter(t => t.is_system);
      const worldTemplates = templates.filter(t => t.world_id === worldId);
      
      console.log(`- ${systemTemplates.length} system templates`);
      console.log(`- ${worldTemplates.length} world-specific templates`);
      
      console.log('\nSystem templates:');
      systemTemplates.forEach(t => {
        console.log(`  - ${t.name}`);
      });
      
      if (worldTemplates.length > 0) {
        console.log('\nWorld-specific templates:');
        worldTemplates.forEach(t => {
          console.log(`  - ${t.name}`);
        });
      }
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
}

testWorldTemplatesDatabase();
