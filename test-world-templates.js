const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testWorldTemplates() {
  try {
    // Test the API endpoint directly
    const worldId = '7f4ae79e-baaa-43c9-831f-6f6ae1a28996'; // Replace with your actual world ID
    
    const response = await fetch(`http://localhost:3000/api/worlds/${worldId}/templates`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error body:', errorText);
      return;
    }

    const data = await response.json();
    console.log(`Templates returned for world ${worldId}:`, data.templates?.length || 0);
    
    if (data.templates && data.templates.length > 0) {
      console.log('Template names:');
      data.templates.forEach(t => {
        console.log(`- ${t.name} (${t.isSystem ? 'System' : 'World-specific'})`);
      });
    } else {
      console.log('No templates returned!');
    }

  } catch (e) {
    console.error('Test error:', e.message);
  }
}

testWorldTemplates();
