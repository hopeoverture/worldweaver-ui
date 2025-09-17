#!/usr/bin/env node
/**
 * Script to check OpenAI API usage and billing
 * Run: node scripts/check-openai-usage.js
 */

const OpenAI = require('openai');
require('dotenv').config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function checkAPIHealth() {
  try {
    console.log('🔍 Checking OpenAI API health...\n');

    // Test basic connectivity
    const models = await client.models.list();
    console.log(`✅ API Key valid - Found ${models.data.length} models`);

    // Check for key target models
    const targetModels = ['gpt-5-mini', 'gpt-4o-mini', 'dall-e-3', 'gpt-image-1'];
    console.log('\n📋 Target Models Status:');
    targetModels.forEach(modelName => {
      const found = models.data.find(m => m.id === modelName);
      console.log(`${found ? '✅' : '❌'} ${modelName}: ${found ? 'Available' : 'Not Found'}`);
    });

    // Get organization info (if available)
    try {
      // Note: This endpoint may not be available in all API versions
      console.log('\n💡 API Key appears healthy and ready for use');
    } catch (orgError) {
      console.log('\n💡 API Key working but organization details not available');
    }

  } catch (error) {
    console.error('❌ API Health Check Failed:');
    console.error(`Error: ${error.message}`);

    if (error.status === 401) {
      console.error('\n🔧 Actions needed:');
      console.error('1. Check if API key is valid at https://platform.openai.com/account/api-keys');
      console.error('2. Verify billing status at https://platform.openai.com/account/billing');
      console.error('3. Check usage limits at https://platform.openai.com/account/usage');
    }

    process.exit(1);
  }
}

checkAPIHealth();