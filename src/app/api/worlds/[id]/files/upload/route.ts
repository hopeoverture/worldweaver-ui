import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { buildWorldFilePath, sanitizeFilename } from '@/lib/storage/paths'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params
    const worldId = params.id

    const { user, error: authError } = await getServerAuth()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Missing file (form field: file)' }, { status: 400 })
    }

    const kind = (req.nextUrl?.searchParams?.get('kind') || 'uploads')
    const filename = sanitizeFilename(file.name || 'file')
    const filePath = buildWorldFilePath(worldId, filename, { kind })
    const fileSize = file.size || undefined
    const mimeType = (file as any).type || 'application/octet-stream'

    // Insert metadata first so storage RLS insert policy passes
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: meta, error: metaErr } = await supabase
      .from('world_files')
      .insert({
        world_id: worldId,
        file_name: filename,
        file_path: filePath,
        file_size: fileSize ?? null,
        mime_type: mimeType,
        uploaded_by: user.id,
      })
      .select('*')
      .single()

    if (metaErr) {
      return NextResponse.json({ error: metaErr.message }, { status: 400 })
    }

    // Upload to storage bucket (private)
    const bytes = Buffer.from(await file.arrayBuffer())
    const { error: upErr } = await supabase.storage.from('world-assets').upload(filePath, bytes, {
      contentType: mimeType,
      upsert: false,
    })

    if (upErr) {
      // Rollback metadata if upload fails (best-effort; ignore any error)
      await supabase.from('world_files').delete().eq('id', meta.id)
      return NextResponse.json({ error: upErr.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      file: {
        id: meta.id,
        worldId,
        name: filename,
        path: filePath,
        size: fileSize,
        mimeType,
        createdAt: meta.created_at,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error', detail: String((err as Error)?.message || err) }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
