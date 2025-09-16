/**
 * Test script for Vercel AI integration
 * Tests all AI generation endpoints to ensure they work with the new Vercel AI SDK
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test credentials (should be in your environment)
const TEST_EMAIL = process.env.TEST_EMAIL || 'jlaphotos88@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'WorldWeaver2024!@#';

let authToken = null;
let testWorldId = null;

async function makeRequest(url, options = {}) {
  const fullUrl = `${BASE_URL}${url}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const responseData = isJson ? await response.json() : await response.text();

    return {
      status: response.status,
      data: responseData,
      ok: response.ok
    };
  } catch (error) {
    console.error(`Request failed for ${url}:`, error.message);
    return {
      status: 0,
      data: { error: error.message },
      ok: false
    };
  }
}

async function login() {
  console.log('🔐 Logging in...');

  const response = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  });

  if (response.ok && response.data.session) {
    authToken = response.data.session.access_token;
    console.log('✅ Login successful');
    return true;
  } else {
    console.log('❌ Login failed:', response.data);
    return false;
  }
}

async function getTestWorld() {
  console.log('🌍 Getting test world...');

  const response = await makeRequest('/api/worlds');

  if (response.ok && response.data.length > 0) {
    testWorldId = response.data[0].id;
    console.log(`✅ Using world: ${response.data[0].name} (${testWorldId})`);
    return true;
  } else {
    console.log('❌ No worlds found or error:', response.data);
    return false;
  }
}

async function testTemplateGeneration() {
  console.log('\n🎨 Testing template generation...');

  const response = await makeRequest('/api/ai/generate-template', {
    method: 'POST',
    body: JSON.stringify({
      prompt: 'A magical weapon for fantasy RPG',
      worldId: testWorldId
    })
  });

  if (response.ok) {
    console.log('✅ Template generation successful!');
    console.log('   Name:', response.data.name);
    console.log('   Fields:', response.data.fields.length);
    return true;
  } else {
    console.log('❌ Template generation failed:', response.data);
    return false;
  }
}

async function testEntityFieldsGeneration() {
  console.log('\n👤 Testing entity fields generation...');

  // First get a template to use
  const templatesResponse = await makeRequest(`/api/worlds/${testWorldId}/templates`);

  if (!templatesResponse.ok || templatesResponse.data.length === 0) {
    console.log('❌ No templates found for entity field generation');
    return false;
  }

  const template = templatesResponse.data[0];

  const response = await makeRequest('/api/ai/generate-entity-fields', {
    method: 'POST',
    body: JSON.stringify({
      worldId: testWorldId,
      templateId: template.id,
      entityName: 'Test Entity',
      prompt: 'A brave warrior',
      generateAllFields: true
    })
  });

  if (response.ok) {
    console.log('✅ Entity fields generation successful!');
    console.log('   Generated fields:', Object.keys(response.data.fields).length);
    return true;
  } else {
    console.log('❌ Entity fields generation failed:', response.data);
    return false;
  }
}

async function testWorldFieldsGeneration() {
  console.log('\n🌎 Testing world fields generation...');

  const response = await makeRequest('/api/ai/generate-world-fields', {
    method: 'POST',
    body: JSON.stringify({
      worldId: testWorldId,
      prompt: 'A mystical realm with ancient magic',
      fieldsToGenerate: ['logline', 'genreBlend', 'overallTone'],
      existingData: {
        name: 'Test World'
      }
    })
  });

  if (response.ok) {
    console.log('✅ World fields generation successful!');
    console.log('   Generated fields:', Object.keys(response.data.fields).length);
    return true;
  } else {
    console.log('❌ World fields generation failed:', response.data);
    return false;
  }
}

async function testImageGeneration() {
  console.log('\n🖼️ Testing image generation...');

  const response = await makeRequest('/api/ai/generate-image', {
    method: 'POST',
    body: JSON.stringify({
      worldId: testWorldId,
      type: 'world-cover',
      prompt: 'Epic fantasy landscape with mountains and magic',
      worldName: 'Test World'
    })
  });

  if (response.ok) {
    console.log('✅ Image generation successful!');
    console.log('   Image URL:', response.data.imageUrl);
    return true;
  } else {
    console.log('❌ Image generation failed:', response.data);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Vercel AI Integration Tests');
  console.log('=====================================\n');

  try {
    // First check if server is responding
    const healthCheck = await makeRequest('/api/health/db');
    if (!healthCheck.ok) {
      console.log('❌ Server health check failed. Is the dev server running?');
      return;
    }
    console.log('✅ Server is responding');

    // Authentication
    if (!await login()) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }

    // Get test world
    if (!await getTestWorld()) {
      console.log('❌ Cannot proceed without a test world');
      return;
    }

    // Run all tests
    const results = {
      template: await testTemplateGeneration(),
      entityFields: await testEntityFieldsGeneration(),
      worldFields: await testWorldFieldsGeneration(),
      image: await testImageGeneration()
    };

    // Summary
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`Template Generation: ${results.template ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Entity Fields: ${results.entityFields ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`World Fields: ${results.worldFields ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Image Generation: ${results.image ? '✅ PASS' : '❌ FAIL'}`);

    const totalPassed = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    console.log(`\n🎯 Overall: ${totalPassed}/${totalTests} tests passed`);

    if (totalPassed === totalTests) {
      console.log('🎉 All tests passed! Vercel AI integration is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the logs above for details.');
    }

  } catch (error) {
    console.error('💥 Test runner crashed:', error);
  }
}

// Load environment variables if available
if (require('fs').existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
}

// Run tests
runTests().catch(console.error);