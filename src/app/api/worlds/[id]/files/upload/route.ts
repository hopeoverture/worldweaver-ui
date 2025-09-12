import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { buildWorldFilePath } from '@/lib/storage/paths'
import { validateFileUpload, checkUploadRateLimit } from '@/lib/security/fileUpload'
import { logAuditEvent, logError } from '@/lib/logging'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params
  const worldId = params.id
  let user: any = null
  
  try {
    const auth = await getServerAuth()
    user = auth.user
    
    if (auth.error || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check rate limits
    const rateLimit = await checkUploadRateLimit(user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded', 
        message: rateLimit.message 
      }, { status: 429 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Missing file (form field: file)' }, { status: 400 })
    }

    // Validate file security
    const validation = await validateFileUpload(file, {
      userId: user.id,
      worldId,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'File validation failed',
        details: validation.errors,
        warnings: validation.warnings
      }, { status: 400 })
    }

    const kind = (req.nextUrl?.searchParams?.get('kind') || 'uploads')
    const filename = validation.sanitizedName
    const filePath = buildWorldFilePath(worldId, filename, { kind })
    const fileSize = file.size || undefined
    const mimeType = file.type || 'application/octet-stream'

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
      
      logError('File upload to storage failed', upErr, {
        userId: user.id,
        worldId,
        action: 'file_upload_storage_error',
        metadata: { filename, filePath, fileSize }
      })
      
      return NextResponse.json({ error: upErr.message }, { status: 400 })
    }

    // Audit log for successful file upload
    logAuditEvent('file_uploaded', {
      userId: user.id,
      worldId,
      action: 'file_upload_success',
      metadata: {
        fileId: meta.id,
        filename: validation.sanitizedName,
        originalFilename: file.name,
        filePath,
        fileSize,
        mimeType,
        detectedType: validation.detectedType,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
      }
    })

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
      warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
    })
  } catch (err) {
    logError('File upload unexpected error', err as Error, {
      userId: user?.id,
      worldId,
      action: 'file_upload_error'
    })
    
    return NextResponse.json({ error: 'Unexpected error', detail: String((err as Error)?.message || err) }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
