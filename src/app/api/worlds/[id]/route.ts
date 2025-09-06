import { NextRequest, NextResponse } from 'next/server';

// Development flag to switch between mock data and database
const USE_DATABASE = false; // Start with false for step-by-step integration

// Mock data for fallback
import * as seed from '@/lib/mockData';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const worldId = params.id;

    if (USE_DATABASE) {
      // TODO: Uncomment when ready to test database
      // const { worldService } = await import('@/lib/services/worldService');
      // const world = await worldService.getWorld(worldId);
      // return NextResponse.json({ world });
      return NextResponse.json({ error: 'Database not yet enabled' }, { status: 501 });
    } else {
      // Use mock data
      const world = seed.worlds.find(w => w.id === worldId);
      
      if (!world) {
        return NextResponse.json({ error: 'World not found' }, { status: 404 });
      }
      
      return NextResponse.json({ world });
    }
  } catch (error) {
    console.error('Error fetching world:', error);
    return NextResponse.json(
      { error: 'Failed to fetch world' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const worldId = params.id;
    const body = await request.json();
    const userId = body.userId || '550e8400-e29b-41d4-a716-446655440000';

    if (USE_DATABASE) {
      // TODO: Uncomment when ready to test database
      // const { worldService } = await import('@/lib/services/worldService');
      // const updatedWorld = await worldService.updateWorld(worldId, body, userId);
      // return NextResponse.json({ world: updatedWorld });
      return NextResponse.json({ error: 'Database not yet enabled' }, { status: 501 });
    } else {
      // Mock update - just return the updated data
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
    console.error('Error updating world:', error);
    return NextResponse.json(
      { error: 'Failed to update world' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const worldId = params.id;

    if (USE_DATABASE) {
      // TODO: Uncomment when ready to test database
      // const { worldService } = await import('@/lib/services/worldService');
      // await worldService.deleteWorld(worldId);
      // return NextResponse.json({ success: true });
      return NextResponse.json({ error: 'Database not yet enabled' }, { status: 501 });
    } else {
      // Mock deletion - just return success
      const world = seed.worlds.find(w => w.id === worldId);
      
      if (!world) {
        return NextResponse.json({ error: 'World not found' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error deleting world:', error);
    return NextResponse.json(
      { error: 'Failed to delete world' },
      { status: 500 }
    );
  }
}
