import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { validateFileUpload, checkUploadRateLimit } from '@/lib/security/fileUpload'
import { uploadMapImage, generateMapPath } from '@/lib/storage/maps'
import { safeConsoleError } from '@/lib/logging'

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
    const mapId = form.get('mapId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Missing file (form field: file)' }, { status: 400 })
    }

    if (!mapId) {
      return NextResponse.json({ error: 'Missing mapId (form field: mapId)' }, { status: 400 })
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        error: 'Invalid file type',
        details: 'Only image files are allowed for maps'
      }, { status: 400 })
    }

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to storage
    const filename = `base.${file.type.split('/')[1]}`
    const { path, error: uploadError } = await uploadMapImage(
      worldId,
      mapId,
      filename,
      buffer,
      file.type
    )

    if (uploadError || !path) {
      return NextResponse.json({
        error: 'File upload failed',
        details: uploadError?.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      path,
      filename,
      size: file.size,
      mimeType: file.type
    })

  } catch (error) {
    safeConsoleError('Error uploading map image', error as Error, {
      action: 'POST_maps_upload',
      worldId,
      userId: user?.id
    })
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'