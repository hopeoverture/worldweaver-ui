import { NextRequest, NextResponse } from 'next/server';
import { getConfig, isDatabaseEnabled } from '@/lib/config/env';
import { getCurrentUserId, requireAuth } from '@/lib/auth/utils';

// Mock data for fallback
import * as seed from '@/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    if (isDatabaseEnabled()) {
      const { worldService } = await import('@/lib/services/worldService');
      const worlds = await worldService.getUserWorlds(user.id);
      return NextResponse.json({ worlds });
    } else {
      // Use mock data (for development only)
      let worlds = seed.worlds;
      
      if (!includeArchived) {
        worlds = worlds.filter(w => !w.isArchived);
      }
      
      return NextResponse.json({ worlds });
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.error('Error fetching worlds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worlds' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();
    const body = await request.json();
    const { name, description, coverImage, isPublic } = body;

    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'World name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'World name must be 100 characters or less' },
        { status: 400 }
      );
    }

    if (description && typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      );
    }

    if (description && description.length > 2000) {
      return NextResponse.json(
        { error: 'Description must be 2000 characters or less' },
        { status: 400 }
      );
    }

    if (isDatabaseEnabled()) {
      const { worldService } = await import('@/lib/services/worldService');
      const newWorld = await worldService.createWorld({
        name: name.trim(),
        description: description?.trim() || '',
        isPublic: isPublic || false
      }, user.id);
      return NextResponse.json({ world: newWorld });
    } else {
      // Use mock data approach
      const newWorld = {
        id: `world-${Date.now()}`,
        name,
        summary: description || '',
        description: description || '',
        coverImage: coverImage || null,
        isPublic: isPublic || false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entityCount: 0,
        memberCount: 1,
        settings: {
          theme: 'default',
          isPublic: isPublic || false,
          allowCollaboration: false
        }
      };

      return NextResponse.json({ world: newWorld });
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.error('Error creating world:', error);
    return NextResponse.json(
      { error: 'Failed to create world' },
      { status: 500 }
    );
  }
}
