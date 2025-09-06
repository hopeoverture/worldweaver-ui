#!/usr/bin/env node

/**
 * Test script for WorldWeaver API endpoints with database integration
 */

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const BASE_URL = 'http://localhost:3000';

async function testApiEndpoint(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    console.log(`✅ ${options.method || 'GET'} ${endpoint}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    console.log('');
    
    return { response, data };
  } catch (error) {
    console.log(`❌ ${options.method || 'GET'} ${endpoint}`);
    console.log(`   Error:`, error.message);
    console.log('');
    return { error };
  }
}

async function runTests() {
  console.log('🧪 Testing WorldWeaver API Endpoints with Database Integration\n');
  
  // Test 1: Get all worlds for user
  console.log('📋 Test 1: Get all worlds for user');
  await testApiEndpoint(`/api/worlds?userId=${TEST_USER_ID}`);
  
  // Test 2: Create a new world
  console.log('🌍 Test 2: Create a new world');
  const createResult = await testApiEndpoint('/api/worlds', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test World API',
      description: 'A test world created via API',
      isPublic: false,
      userId: TEST_USER_ID
    })
  });
  
  if (createResult.data && createResult.data.world) {
    const worldId = createResult.data.world.id;
    
    // Test 3: Get the created world by ID
    console.log('🔍 Test 3: Get world by ID');
    await testApiEndpoint(`/api/worlds/${worldId}`);
    
    // Test 4: Update the world
    console.log('✏️ Test 4: Update world');
    await testApiEndpoint(`/api/worlds/${worldId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Test World',
        description: 'Updated description',
        userId: TEST_USER_ID
      })
    });
    
    // Test 5: Get updated world
    console.log('🔍 Test 5: Get updated world');
    await testApiEndpoint(`/api/worlds/${worldId}`);
    
    // Test 6: Delete the world
    console.log('🗑️ Test 6: Delete world');
    await testApiEndpoint(`/api/worlds/${worldId}`, {
      method: 'DELETE'
    });
    
    // Test 7: Verify deletion
    console.log('✅ Test 7: Verify world deletion');
    await testApiEndpoint(`/api/worlds/${worldId}`);
  }
  
  console.log('🎉 API endpoint testing completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testApiEndpoint, runTests };
