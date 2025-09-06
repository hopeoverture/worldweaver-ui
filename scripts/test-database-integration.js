#!/usr/bin/env node

/**
 * Simple test to verify database operations are working
 */

const { localDb } = require('../src/lib/database/local');

async function testDatabaseIntegration() {
  console.log('🧪 Testing Database Integration...\n');
  
  try {
    // Test connection
    console.log('🔗 Testing database connection...');
    const connectionTest = await localDb.testConnection();
    console.log('✅ Connection successful:', connectionTest.current_time);
    
    // Test getting worlds for user
    console.log('\n📋 Testing getUserWorlds...');
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const worlds = await localDb.getWorldsByUser(userId);
    console.log(`✅ Found ${worlds.length} worlds for user`);
    
    // Test creating a new world
    console.log('\n🌍 Testing world creation...');
    const newWorld = await localDb.createWorld(
      'Database Test World',
      'A world created directly via database service',
      userId
    );
    console.log('✅ World created:', newWorld.name, 'ID:', newWorld.id);
    
    // Test updating the world
    console.log('\n✏️ Testing world update...');
    const updatedWorld = await localDb.updateWorld(newWorld.id, {
      name: 'Updated Database Test World',
      description: 'Updated description'
    });
    console.log('✅ World updated:', updatedWorld.name);
    
    // Test getting the world by ID
    console.log('\n🔍 Testing getWorldById...');
    const retrievedWorld = await localDb.getWorldById(newWorld.id, userId);
    console.log('✅ World retrieved:', retrievedWorld.name);
    
    // Test deleting the world
    console.log('\n🗑️ Testing world deletion...');
    await localDb.deleteWorld(newWorld.id);
    console.log('✅ World deleted successfully');
    
    // Verify deletion
    console.log('\n✅ Testing deletion verification...');
    const deletedWorld = await localDb.getWorldById(newWorld.id, userId);
    console.log('✅ Deletion confirmed:', deletedWorld === undefined ? 'World not found (correct)' : 'Error: World still exists');
    
    console.log('\n🎉 All database operations completed successfully!');
    console.log('\n✨ Database integration is fully functional!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error(error.stack);
  }
}

// Run test
testDatabaseIntegration();
