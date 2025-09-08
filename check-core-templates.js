const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCoreTemplates() {
  try {
    // Check if system templates exist
    const { data: systemTemplates, error } = await supabase
      .from('templates')
      .select('id, name, is_system')
      .eq('is_system', true)
      .is('world_id', null);

    if (error) {
      console.error('Error checking system templates:', error);
      return;
    }

    console.log(`Found ${systemTemplates?.length || 0} system templates:`);
    systemTemplates?.forEach(t => {
      console.log(`- ${t.name} (ID: ${t.id})`);
    });

    if (!systemTemplates || systemTemplates.length === 0) {
      console.log('\nNo core templates found! They need to be seeded.');
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkCoreTemplates();
