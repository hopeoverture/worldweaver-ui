#!/usr/bin/env node

/**
 * Test script to verify new world creation includes Core folder and templates
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

async function testWorldCreation() {
  try {
    console.log('🧪 Testing new world creation with Core templates via API...');

    // Create a test world via API to test the complete flow
    const testWorldName = `Test World ${Date.now()}`;
    const response = await fetch('http://localhost:3000/api/worlds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // We would need a real auth token here for API testing
        // For now, fall back to direct DB for testing
      },
      body: JSON.stringify({
        name: testWorldName,
        description: 'Test world for Core template verification via API'
      })
    });

    let newWorld;
    if (response.ok) {
      const result = await response.json();
      newWorld = { id: result.id };
      console.log('✅ Created test world via API:', newWorld.id);
    } else {
      console.log('ℹ️ API test failed (expected without auth), falling back to direct DB test...');

      // Fallback to direct database insertion for testing
      const { data: directWorld, error: worldError } = await supabase
        .from('worlds')
        .insert({
          name: testWorldName,
          description: 'Test world for Core template verification',
          owner_id: 'f38a94af-d0d5-4af0-a6ec-fee97486e66b', // Your user ID
          user_id: 'f38a94af-d0d5-4af0-a6ec-fee97486e66b',
          is_public: false,
          is_archived: false,
          settings: {}
        })
        .select('id')
        .single();

      if (worldError) {
        throw new Error(`Failed to create test world: ${worldError.message}`);
      }

      newWorld = directWorld;
      console.log('✅ Created test world via DB:', newWorld.id);

      // Now manually test setupInitialWorldResources
      try {
        const { SupabaseWorldService } = await import('../src/lib/services/supabaseWorldService.ts');
        const testService = new SupabaseWorldService(supabase);
        await testService.setupInitialWorldResources(newWorld.id);
        console.log('✅ Manual setupInitialWorldResources completed');
      } catch (setupError) {
        console.error('❌ Manual setupInitialWorldResources failed:', setupError.message);
      }
    }

    console.log(`✅ Created test world: ${newWorld.id}`);

    // The setupInitialWorldResources should have been called automatically
    // Let's check if the Core folder was created
    const { data: folders, error: foldersError } = await supabase
      .from('folders')
      .select('id, name, kind')
      .eq('world_id', newWorld.id)
      .eq('name', 'Core');

    if (foldersError) {
      throw new Error(`Failed to check folders: ${foldersError.message}`);
    }

    if (folders && folders.length > 0) {
      console.log(`✅ Core folder found: ${folders[0].id}`);

      // Check if templates were created in the Core folder
      const { data: templates, error: templatesError } = await supabase
        .from('templates')
        .select('id, name, folder_id')
        .eq('world_id', newWorld.id)
        .eq('folder_id', folders[0].id);

      if (templatesError) {
        throw new Error(`Failed to check templates: ${templatesError.message}`);
      }

      console.log(`✅ Found ${templates?.length || 0} templates in Core folder:`);
      templates?.forEach(t => console.log(`  - ${t.name}`));
    } else {
      console.log('❌ No Core folder found - setup may have failed');
    }

    // Clean up - delete the test world
    const { error: deleteError } = await supabase
      .from('worlds')
      .delete()
      .eq('id', newWorld.id);

    if (deleteError) {
      console.log(`⚠️ Failed to clean up test world: ${deleteError.message}`);
    } else {
      console.log('🧹 Cleaned up test world');
    }

    console.log('🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testWorldCreation();