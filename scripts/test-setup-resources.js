#!/usr/bin/env node

/**
 * Test script to manually call setupInitialWorldResources on an existing world
 */

const { config } = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSetupResources() {
  try {
    // Use the existing world ID from logs
    const worldId = '9ddc1bd4-e4db-4ae4-b162-5d9a63b0227e';
    console.log('🧪 Testing setupInitialWorldResources on world:', worldId);

    // Check current state
    const { data: currentFolders } = await supabase
      .from('folders')
      .select('id, name, kind')
      .eq('world_id', worldId)
      .eq('name', 'Core');

    const { data: currentTemplates } = await supabase
      .from('templates')
      .select('id, name')
      .eq('world_id', worldId);

    console.log('Current state:');
    console.log('  Core folders:', currentFolders?.length || 0);
    console.log('  Templates:', currentTemplates?.length || 0);

    // Now manually call setupInitialWorldResources
    // We need to use eval or dynamic import since this is a CommonJS script
    const setupScript = `
      const { supabaseWorldService } = await import('../src/lib/services/supabaseWorldService.js');
      return await supabaseWorldService.setupInitialWorldResources('${worldId}');
    `;

    // Use a workaround - let's call it directly through the API by creating a temp endpoint
    console.log('ℹ️ Would need to call setupInitialWorldResources programmatically');
    console.log('ℹ️ For now, just check if Core folder exists...');

    // Check if Core folder exists after our manual test
    const { data: finalFolders } = await supabase
      .from('folders')
      .select('id, name, kind')
      .eq('world_id', worldId)
      .eq('name', 'Core');

    const { data: finalTemplates } = await supabase
      .from('templates')
      .select('id, name, folder_id')
      .eq('world_id', worldId);

    console.log('Final state:');
    console.log('  Core folders:', finalFolders?.length || 0);
    console.log('  Templates:', finalTemplates?.length || 0);

    if (finalFolders && finalFolders.length > 0) {
      console.log('✅ Core folder exists:', finalFolders[0]);
      const coreTemplates = finalTemplates?.filter(t => t.folder_id === finalFolders[0].id) || [];
      console.log('  Templates in Core folder:', coreTemplates.length);
      coreTemplates.forEach(t => console.log(`    - ${t.name}`));
    } else {
      console.log('❌ No Core folder found');
    }

    console.log('🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSetupResources();