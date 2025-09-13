#!/usr/bin/env node

/**
 * Script to organize core system templates into a "Core" folder for specific world
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

// Your specific world ID from the logs
const TARGET_WORLD_ID = '98a52fc9-2294-4435-a405-e50c0307b19b';

async function organizeSystemTemplates() {
  try {
    console.log('🎯 Starting system template organization...');
    console.log(`📍 Using world: ${TARGET_WORLD_ID}`);

    // Check if "Core" folder already exists
    const { data: existingFolders, error: foldersError } = await supabase
      .from('folders')
      .select('id, name')
      .eq('world_id', TARGET_WORLD_ID)
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
          world_id: TARGET_WORLD_ID,
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

    // Get ALL templates to see what we have
    const { data: allTemplates, error: allTemplatesError } = await supabase
      .from('templates')
      .select('id, name, is_system, world_id, folder_id')
      .or(`is_system.eq.true,world_id.eq.${TARGET_WORLD_ID}`);

    if (allTemplatesError) {
      throw new Error(`Failed to fetch templates: ${allTemplatesError.message}`);
    }

    console.log(`📋 Found ${allTemplates?.length || 0} total templates:`);
    allTemplates?.forEach(t => {
      const type = t.is_system ? 'SYSTEM' : 'WORLD';
      const folder = t.folder_id ? `folder:${t.folder_id}` : 'ungrouped';
      console.log(`  - ${t.name} (${type}) [${folder}]`);
    });

    // Find system templates that aren't in Core folder
    const systemTemplatesToMove = allTemplates?.filter(t =>
      t.is_system && t.folder_id !== coreFolderId
    ) || [];

    if (systemTemplatesToMove.length === 0) {
      console.log('✅ No system templates to move (all already organized)');
      return;
    }

    console.log(`📦 Moving ${systemTemplatesToMove.length} system templates to Core folder:`);
    systemTemplatesToMove.forEach(t => console.log(`  - ${t.name} (${t.id})`));

    // Update each system template to be in the Core folder
    const templateIds = systemTemplatesToMove.map(t => t.id);
    const { error: updateError } = await supabase
      .from('templates')
      .update({ folder_id: coreFolderId })
      .in('id', templateIds);

    if (updateError) {
      throw new Error(`Failed to move templates to Core folder: ${updateError.message}`);
    }

    console.log(`✅ Successfully moved ${systemTemplatesToMove.length} system templates to Core folder`);
    console.log('🎉 System template organization complete!');

  } catch (error) {
    console.error('❌ Error organizing system templates:', error.message);
    process.exit(1);
  }
}

// Run the script
organizeSystemTemplates();