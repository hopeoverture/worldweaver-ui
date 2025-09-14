import { NextRequest } from 'next/server'
import { createCoreTemplates } from '@/lib/coreTemplates'
import { adminClient } from '@/lib/supabase/admin'
import { getRateLimitService } from '@/lib/rate-limiting'

export async function POST(req: NextRequest) {
  // Check rate limiting
  const rateLimitService = getRateLimitService()
  const rateLimitResult = await rateLimitService.checkRateLimit(req)

  if (rateLimitResult && !rateLimitResult.allowed) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  // Validate admin token
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token !== process.env.SEED_ADMIN_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!adminClient) {
      throw new Error('Admin client not available')
    }

    const results: Array<{ action: string; name: string }> = []

    // System templates will be organized in a virtual "Core" group at the UI level
    // No need for a database folder since folders must belong to worlds
    results.push({ action: 'info', name: 'System templates will be organized in Core section' })

    // Get core template definitions (pass empty string for system templates)
    const coreTemplates = createCoreTemplates('')

    // Process each core template
    for (const template of coreTemplates) {
      // Check if template already exists
      const { data: existing, error: checkError } = await adminClient
        .from('templates')
        .select('*')
        .eq('name', template.name)
        .eq('is_system', true)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Error checking template ${template.name}: ${checkError.message}`)
      }

      if (existing) {
        // Update existing template, ensuring it's properly marked as system
        const { error: updateError } = await adminClient
          .from('templates')
          .update({
            folder_id: null, // System templates don't have folder_id
            description: template.description,
            icon: template.icon,
            category: template.category,
            fields: template.fields,
            is_system: true
          })
          .eq('id', existing.id)

        if (updateError) {
          throw new Error(`Error updating template ${template.name}: ${updateError.message}`)
        }

        results.push({ action: 'updated', name: template.name })
      } else {
        // Create new system template
        const { error: createError } = await adminClient
          .from('templates')
          .insert({
            world_id: null, // System templates have world_id = null
            folder_id: null, // System templates don't have folder_id
            name: template.name,
            description: template.description,
            icon: template.icon,
            category: template.category,
            fields: template.fields,
            is_system: true
          })

        if (createError) {
          throw new Error(`Error creating template ${template.name}: ${createError.message}`)
        }

        results.push({ action: 'created', name: template.name })
      }
    }

    return Response.json({
      success: true,
      summary: {
        approach: 'System templates organized in virtual Core section',
        templatesProcessed: results.filter(r => r.action !== 'info').length,
        actions: results.reduce((acc, r) => {
          acc[r.action] = (acc[r.action] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      },
      results
    })

  } catch (error) {
    console.error('Seed core templates error:', error)
    return Response.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}