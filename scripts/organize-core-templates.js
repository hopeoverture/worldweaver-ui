#!/usr/bin/env node

/**
 * Script to organize core system templates into a "Core" folder
 * This script will:
 * 1. Create a "Core" template folder
 * 2. Move all system templates (isSystem: true) into that folder
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

async function organizeSystemTemplates() {
  try {
    console.log('🎯 Starting system template organization...');

    // Get the first world (we'll use this as the target world)
    const { data: worlds, error: worldsError } = await supabase
      .from('worlds')
      .select('id')
      .limit(1);

    if (worldsError || !worlds || worlds.length === 0) {
      throw new Error('No worlds found');
    }

    const worldId = worlds[0].id;
    console.log(`📍 Using world: ${worldId}`);

    // Check if "Core" folder already exists
    const { data: existingFolders, error: foldersError } = await supabase
      .from('folders')
      .select('id, name')
      .eq('world_id', worldId)
      .eq('kind', 'templates')
      .eq('name', 'Core');

    let coreFolderId;

    if (existingFolders && existingFolders.length > 0) {
      coreFolderId = existingFolders[0].id;
      console.log(`📁 Found existing Core folder: ${coreFolderId}`);
    } else {
      // Create the "Core" folder
      const { data: newFolder, error: createFolderError } = await supabase
        .from('folders')
        .insert({
          world_id: worldId,
          name: 'Core',
          description: 'Core system templates',
          kind: 'templates',
          color: '#6366f1' // Indigo color for core templates
        })
        .select('id')
        .single();

      if (createFolderError) {
        throw new Error(`Failed to create Core folder: ${createFolderError.message}`);
      }

      coreFolderId = newFolder.id;
      console.log(`✅ Created Core folder: ${coreFolderId}`);
    }

    // Get all system templates that aren't already in the Core folder
    const { data: systemTemplates, error: templatesError } = await supabase
      .from('templates')
      .select('id, name, folder_id')
      .eq('is_system', true)
      .neq('folder_id', coreFolderId); // Exclude ones already in Core folder

    if (templatesError) {
      throw new Error(`Failed to fetch system templates: ${templatesError.message}`);
    }

    if (!systemTemplates || systemTemplates.length === 0) {
      console.log('✅ No system templates to move (all already organized)');
      return;
    }

    console.log(`📦 Found ${systemTemplates.length} system templates to organize:`);
    systemTemplates.forEach(t => console.log(`  - ${t.name} (${t.id})`));

    // Update each system template to be in the Core folder
    const { error: updateError } = await supabase
      .from('templates')
      .update({ folder_id: coreFolderId })
      .eq('is_system', true)
      .neq('folder_id', coreFolderId); // Only update ones not already in Core

    if (updateError) {
      throw new Error(`Failed to move templates to Core folder: ${updateError.message}`);
    }

    console.log(`✅ Successfully moved ${systemTemplates.length} system templates to Core folder`);
    console.log('🎉 System template organization complete!');

  } catch (error) {
    console.error('❌ Error organizing system templates:', error.message);
    process.exit(1);
  }
}

// Run the script
organizeSystemTemplates();