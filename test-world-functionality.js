// Test script for all World functionality
async function testWorldFunctionality() {
  const worldId = '7f4ae79e-baaa-43c9-831f-6f6ae1a28996';
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing World Functionality for:', worldId);
  
  const tests = [
    // 1. Templates (we know this works)
    {
      name: 'Templates',
      url: `/api/worlds/${worldId}/templates`,
      expectedProperty: 'templates'
    },
    // 2. Entities
    {
      name: 'Entities', 
      url: `/api/worlds/${worldId}/entities`,
      expectedProperty: 'entities'
    },
    // 3. Relationships
    {
      name: 'Relationships',
      url: `/api/worlds/${worldId}/relationships`, 
      expectedProperty: 'relationships'
    },
    // 4. Folders
    {
      name: 'Folders',
      url: `/api/worlds/${worldId}/folders`,
      expectedProperty: 'folders'
    },
    // 5. Invites
    {
      name: 'Invites',
      url: `/api/worlds/${worldId}/invites`,
      expectedProperty: 'invites'
    },
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing ${test.name}...`);
      
      const response = await fetch(`${baseUrl}${test.url}`, {
        credentials: 'include'
      });
      
      console.log(`📡 ${test.name} Status:`, response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${test.name} Failed:`, errorText);
        continue;
      }
      
      const data = await response.json();
      const items = data[test.expectedProperty];
      
      if (Array.isArray(items)) {
        console.log(`✅ ${test.name}: ${items.length} items`);
        if (items.length > 0) {
          console.log(`📋 ${test.name} sample:`, items[0]);
        }
      } else {
        console.log(`❓ ${test.name}: Unexpected response format`, data);
      }
      
    } catch (error) {
      console.error(`💥 ${test.name} Error:`, error.message);
    }
  }
}

// Run in browser console when on the world page
testWorldFunctionality();
