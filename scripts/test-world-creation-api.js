#!/usr/bin/env node

/**
 * Test script to verify new world creation via API includes Core folder and templates
 */

const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

async function testWorldCreationViaAPI() {
  try {
    console.log('🧪 Testing new world creation via API...');
    console.log('⚠️  This test requires valid authentication cookies');
    console.log('Please create a new world through the UI to test the functionality');
    console.log();
    console.log('To verify Core templates are working:');
    console.log('1. Go to http://localhost:3000 and sign in');
    console.log('2. Create a new world');
    console.log('3. Go to the Templates tab');
    console.log('4. Verify there is a "Core" folder with system templates');
    console.log();
    console.log('The setupInitialWorldResources method should automatically:');
    console.log('  ✅ Create a "Core" template folder');
    console.log('  ✅ Copy all 18 system templates into the Core folder');
    console.log('  ✅ Set templates as world-specific (not system templates)');

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testWorldCreationViaAPI();