import { NextRequest, NextResponse } from 'next/server';
import { getConfig, isDatabaseEnabled } from '@/lib/config/env';
import { requireWorldAccess, requireWorldOwnership } from '@/lib/auth/utils';

// Mock data for fallback
import * as seed from '@/lib/mockData';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: worldId } = await params;
    
    // Require authentication and world access
    const user = await requireWorldAccess(worldId);

    if (isDatabaseEnabled()) {
      const { worldService } = await import('@/lib/services/worldService');
      const world = await worldService.getWorldById(worldId, user.id);
      
      if (!world) {
        return NextResponse.json({ error: 'World not found' }, { status: 404 });
      }
      
      return NextResponse.json({ world });
    } else {
      // Use mock data (for development only)
      const world = seed.worlds.find(w => w.id === worldId);
      
      if (!world) {
        return NextResponse.json({ error: 'World not found' }, { status: 404 });
      }
      
      return NextResponse.json({ world });
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Access denied to this world') {
      return NextResponse.json(
        { error: 'Access denied to this world' },
        { status: 403 }
      );
    }
    
    console.error('Error fetching world:', error);
    return NextResponse.json(
      { error: 'Failed to fetch world' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: worldId } = await params;
    const body = await request.json();
    
    // Require authentication and world ownership for updates
    const user = await requireWorldOwnership(worldId);

    // Input validation
    if (body.name !== undefined) {
      if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'World name must be a non-empty string' },
          { status: 400 }
        );
      }
      
      if (body.name.trim().length > 100) {
        return NextResponse.json(
          { error: 'World name must be 100 characters or less' },
          { status: 400 }
        );
      }
    }

    if (body.summary !== undefined || body.description !== undefined) {
      const description = body.summary || body.description;
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
    }

    if (isDatabaseEnabled()) {
      const { worldService } = await import('@/lib/services/worldService');
      const updatedWorld = await worldService.updateWorld(worldId, body);
      return NextResponse.json({ world: updatedWorld });
    } else {
      // Mock update - just return the updated data (for development only)
      const world = seed.worlds.find(w => w.id === worldId);
      
      if (!world) {
        return NextResponse.json({ error: 'World not found' }, { status: 404 });
      }

      const updatedWorld = {
        ...world,
        ...body,
        id: worldId, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      };
      
      return NextResponse.json({ world: updatedWorld });
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Only the world owner can perform this action') {
      return NextResponse.json(
        { error: 'Only the world owner can perform this action' },
        { status: 403 }
      );
    }
    
    console.error('Error updating world:', error);
    return NextResponse.json(
      { error: 'Failed to update world' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: worldId } = await params;
    
    // Require authentication and world ownership for deletion
    const user = await requireWorldOwnership(worldId);

    if (isDatabaseEnabled()) {
      const { worldService } = await import('@/lib/services/worldService');
      await worldService.deleteWorld(worldId);
      return NextResponse.json({ success: true });
    } else {
      // Mock deletion - just return success (for development only)
      const world = seed.worlds.find(w => w.id === worldId);
      
      if (!world) {
        return NextResponse.json({ error: 'World not found' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Only the world owner can perform this action') {
      return NextResponse.json(
        { error: 'Only the world owner can perform this action' },
        { status: 403 }
      );
    }
    
    console.error('Error deleting world:', error);
    return NextResponse.json(
      { error: 'Failed to delete world' },
      { status: 500 }
    );
  }
}
