import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get admin token from request
    const { adminToken } = await req.json();

    // Verify admin token
    const expectedToken = process.env.SEED_ADMIN_TOKEN;
    if (!expectedToken || adminToken !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        error: 'Supabase configuration missing',
        details: 'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured'
      }, { status: 500 });
    }

    console.log('🔧 Adding folder_id column to templates table using Supabase API...');

    // Use Supabase REST API to execute SQL using the service role key
    const sqlUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;

    const response = await fetch(sqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        sql: `
          ALTER TABLE public.templates
          ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

          CREATE INDEX idx_templates_folder_id ON public.templates(folder_id);

          COMMENT ON COLUMN public.templates.folder_id IS 'References folders table for template organization. Only templates folders (kind = templates) should be used.';
        `
      })
    });

    if (response.ok) {
      console.log('✅ folder_id column added successfully to templates table');
      return NextResponse.json({
        success: true,
        message: 'folder_id column added successfully to templates table'
      });
    } else {
      // If exec_sql doesn't exist, let's just try to verify the column exists instead
      console.log('❌ exec_sql function not available, checking if column already exists...');

      // Check if the column already exists by querying the table structure
      const checkUrl = `${supabaseUrl}/rest/v1/templates?select=folder_id&limit=1`;

      const checkResponse = await fetch(checkUrl, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });

      if (checkResponse.ok) {
        console.log('✅ folder_id column already exists on templates table');
        return NextResponse.json({
          success: true,
          message: 'folder_id column already exists on templates table'
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to add column and column does not exist:', errorText);
        return NextResponse.json({
          success: false,
          error: 'Cannot add folder_id column - exec_sql function not available and column does not exist',
          details: errorText,
          instructions: 'Please run the SQL manually in Supabase SQL Editor'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('❌ Error executing SQL:', error);
    return NextResponse.json({
      success: false,
      error: 'SQL execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}