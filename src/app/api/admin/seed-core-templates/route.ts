import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types.generated'
import { createCoreTemplates } from '@/lib/coreTemplates'
import { logApiError } from '@/lib/logging'

/**
 * Admin seeder for Core (system) Templates
 *
 * Usage (dev only):
 *  POST /api/admin/seed-core-templates?token=YOUR_TOKEN
 *  or send header: x-admin-token: YOUR_TOKEN
 *
 * Requires env:
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - SEED_ADMIN_TOKEN (shared secret to protect this route)
 */
export async function POST(request: NextRequest) {
  try {
    // Gate to dev-only unless explicitly enabled via env
    const isProd = process.env.NODE_ENV === 'production'
    const seedEnabled = (process.env.ADMIN_SEED_ENABLED || process.env.ENABLE_ADMIN_SEED) === 'true'
    if (isProd && !seedEnabled) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const token =
      request.headers.get('x-admin-token') ||
      request.nextUrl.searchParams.get('token') ||
      ''

    if (!process.env.SEED_ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'SEED_ADMIN_TOKEN not configured on server' },
        { status: 500 }
      )
    }

    if (token !== process.env.SEED_ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: 'Supabase env vars are missing' },
        { status: 500 }
      )
    }

    const supabase = createClient<Database>(url, serviceKey)

    // Build system templates from core definitions.
    // We drop worldId for system templates (world_id = null) and mark is_system = true.
    const core = createCoreTemplates('system')
    const payload = core.map(t => ({
      name: t.name,
      description: t.description || null,
      icon: t.icon || null,
      category: t.category || 'Core',
      fields: t.fields as unknown as Database['public']['Tables']['templates']['Row']['fields'],
      is_system: true as Database['public']['Tables']['templates']['Row']['is_system'],
      world_id: null as Database['public']['Tables']['templates']['Row']['world_id'],
    }))

    // Fetch existing system templates by name
    const names = payload.map(p => p.name)
    const { data: existing, error: fetchErr } = await supabase
      .from('templates')
      .select('id, name')
      .in('name', names)
      .is('world_id', null)
      .eq('is_system', true)

    if (fetchErr) {
      logApiError('/api/admin/seed-core-templates', fetchErr, { action: 'fetch_existing_templates' })
      return NextResponse.json(
        { error: `Fetch existing failed: ${fetchErr.message}` },
        { status: 500 }
      )
    }

    const existingByName = new Map<string, string>()
    existing?.forEach(row => existingByName.set(row.name, row.id))

    let inserted = 0
    let updated = 0
    const results: Array<{ name: string; action: 'inserted' | 'updated' }> = []

    for (const p of payload) {
      const id = existingByName.get(p.name)
      if (id) {
        const { error: updateErr } = await supabase
          .from('templates')
          .update({
            description: p.description,
            icon: p.icon,
            category: p.category,
            fields: p.fields,
            // ensure flags remain correct
            is_system: true,
            world_id: null,
          })
          .eq('id', id)

        if (updateErr) {
          logApiError('/api/admin/seed-core-templates', updateErr, { action: 'update_template', templateName: p.name })
          return NextResponse.json(
            { error: `Update failed for ${p.name}: ${updateErr.message}` },
            { status: 500 }
          )
        }
        updated += 1
        results.push({ name: p.name, action: 'updated' })
      } else {
        const { error: insertErr } = await supabase
          .from('templates')
          .insert({
            name: p.name,
            description: p.description,
            icon: p.icon,
            category: p.category,
            fields: p.fields,
            is_system: true,
            world_id: null,
          })

        if (insertErr) {
          logApiError('/api/admin/seed-core-templates', insertErr, { action: 'insert_template', templateName: p.name })
          return NextResponse.json(
            { error: `Insert failed for ${p.name}: ${insertErr.message}` },
            { status: 500 }
          )
        }
        inserted += 1
        results.push({ name: p.name, action: 'inserted' })
      }
    }

    return NextResponse.json({
      ok: true,
      summary: { inserted, updated, total: payload.length },
      results,
    })
  } catch (error) {
    logApiError('/api/admin/seed-core-templates', error as Error, { action: 'seed_core_templates' })
    return NextResponse.json(
      { error: 'Unexpected error', detail: String((error as Error)?.message || error) },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
