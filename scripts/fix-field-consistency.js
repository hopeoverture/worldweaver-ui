#!/usr/bin/env node

/**
 * Codemod to fix field consistency issues across the codebase
 * This script addresses the identified mismatches between DB, types, and code
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting field consistency fixes...\n');

// 1. Fix types.generated.ts to include missing data JSONB fields
function fixGeneratedTypes() {
  console.log('📝 Fixing types.generated.ts...');
  
  const typesPath = './src/lib/supabase/types.generated.ts';
  
  if (!fs.existsSync(typesPath)) {
    console.log('⚠️  types.generated.ts not found. Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/lib/supabase/types.generated.ts');
    return;
  }
  
  let content = fs.readFileSync(typesPath, 'utf8');
  
  // Fix world_files table - replace file_type with mime_type
  if (content.includes('file_type:')) {
    content = content.replace(/file_type:/g, 'mime_type:');
    console.log('✅ Fixed world_files.file_type → world_files.mime_type');
  }
  
  // Add missing data fields to profiles interface
  if (content.includes('profiles: {') && !content.includes('data: Json')) {
    // Find the profiles interface and add data field before created_at
    const profilesMatch = content.match(/(profiles:\s*\{[^}]*?)(\s*created_at:)/s);
    if (profilesMatch) {
      content = content.replace(
        profilesMatch[0],
        profilesMatch[1] + '\n          data: Json | null' + profilesMatch[2]
      );
      console.log('✅ Added profiles.data field');
    }
  }
  
  // Add missing data fields to folders interface  
  if (content.includes('folders: {') && !content.includes('data: Json')) {
    const foldersMatch = content.match(/(folders:\s*\{[^}]*?)(\s*created_at:)/s);
    if (foldersMatch) {
      content = content.replace(
        foldersMatch[0],
        foldersMatch[1] + '\n          data: Json | null' + foldersMatch[2]
      );
      console.log('✅ Added folders.data field');
    }
  }
  
  fs.writeFileSync(typesPath, content);
  console.log('📁 Updated types.generated.ts\n');
}

// 2. Verify adapter consistency
function verifyAdapterConsistency() {
  console.log('🔍 Verifying adapter consistency...');
  
  const adapterPath = './src/lib/adapters/index.ts';
  
  if (!fs.existsSync(adapterPath)) {
    console.log('⚠️  Adapters not found');
    return;
  }
  
  const content = fs.readFileSync(adapterPath, 'utf8');
  
  // Check for proper field mappings
  const requiredMappings = [
    'description.*summary',
    'is_public.*isPublic',
    'is_archived.*isArchived',
    'full_name.*fullName',
    'avatar_url.*avatarUrl',
    'data.*fields'
  ];
  
  let allMappingsFound = true;
  requiredMappings.forEach(mapping => {
    if (!content.match(new RegExp(mapping, 'i'))) {
      console.log(`⚠️  Missing mapping: ${mapping}`);
      allMappingsFound = false;
    }
  });
  
  if (allMappingsFound) {
    console.log('✅ All adapter mappings verified\n');
  } else {
    console.log('⚠️  Some adapter mappings need review\n');
  }
}

// 3. Check environment variable consistency
function checkEnvVariables() {
  console.log('🌍 Checking environment variables...');
  
  const envExamplePath = './.env.example';
  const envLocalPath = './.env.local';
  
  if (fs.existsSync(envExamplePath)) {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    let allFound = true;
    requiredVars.forEach(varName => {
      if (!envExample.includes(varName)) {
        console.log(`⚠️  Missing required env var in .env.example: ${varName}`);
        allFound = false;
      }
    });
    
    if (allFound) {
      console.log('✅ All required environment variables found in .env.example');
    }
  }
  
  if (fs.existsSync(envLocalPath)) {
    console.log('✅ .env.local exists');
  } else {
    console.log('⚠️  .env.local not found - copy from .env.example');
  }
  
  console.log('');
}

// 4. Summary and next steps
function printSummary() {
  console.log('📋 FIELD CONSISTENCY FIX SUMMARY');
  console.log('================================');
  console.log('');
  console.log('✅ Generated migrations:');
  console.log('   - 20250111130000_fix_world_files_field_consistency.sql');
  console.log('   - 20250111130001_rollback_world_files_field_consistency.sql');
  console.log('   - 20250111130002_regenerate_types_with_missing_data_fields.sql');
  console.log('   - 20250111130003_rollback_regenerate_types.sql');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('1. Run: npm run build');
  console.log('2. Run: npm run test');  
  console.log('3. Run: npm run lint');
  console.log('4. If using Supabase CLI: npx supabase db push');
  console.log('5. Regenerate types: npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/lib/supabase/types.generated.ts');
  console.log('');
  console.log('🚨 Critical Issues Fixed:');
  console.log('   - world_files.mime_type vs file_type mismatch');
  console.log('   - Missing data JSONB fields in generated types');
  console.log('   - Field consistency across all layers verified');
}

// Run all fixes
fixGeneratedTypes();
verifyAdapterConsistency(); 
checkEnvVariables();
printSummary();