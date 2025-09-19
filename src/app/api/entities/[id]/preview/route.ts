import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server'
import { safeConsoleError } from '@/lib/logging'
import { entityService } from '@/lib/services/entityService'
import { getSignedEntityCoverUrl } from '@/lib/storage/entities'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let params: { id: string } | undefined
  let user: any
  try {
    params = await ctx.params
    const { user: authUser, error: authError } = await getServerAuth()
    user = authUser
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Fetch entity with permission check
    const entity = await entityService.getEntityById(params.id, user.id)

    if (!entity) {
      return NextResponse.json({
        error: 'Entity not found or access denied',
        message: 'You may not have permission to view this entity'
      }, { status: 404 })
    }

    // Generate signed URL for cover image if it exists
    let coverImageUrl = null
    if (entity.imageUrl) {
      try {
        const { signedUrl } = await getSignedEntityCoverUrl(entity.imageUrl)
        coverImageUrl = signedUrl
      } catch (error) {
        // Don't fail the whole request if cover image can't be loaded
        safeConsoleError('Failed to generate signed URL for entity cover', error as Error, {
          action: 'GET_entity_preview_cover',
          entityId: params.id,
          userId: user.id,
          metadata: {
            imagePath: entity.imageUrl
          }
        })
      }
    }

    // Return minimal entity data for preview
    const previewData = {
      id: entity.id,
      name: entity.name,
      templateName: entity.templateName,
      summary: entity.summary || 'No summary available',
      coverImageUrl,
      worldId: entity.worldId,
      tags: entity.tags || []
    }

    return NextResponse.json({ entity: previewData })
  } catch (error) {
    safeConsoleError('Error fetching entity preview', error as Error, {
      action: 'GET_entity_preview',
      entityId: params?.id,
      userId: user?.id
    })

    // Don't expose specific error details for security
    return NextResponse.json({
      error: 'Failed to fetch entity preview',
      message: 'An error occurred while loading the entity data'
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'