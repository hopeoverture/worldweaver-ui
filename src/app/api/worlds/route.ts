import { NextRequest, NextResponse } from 'next/server';

// We'll import database services here (server-side only)
// import { worldService } from '@/lib/services/worldService';

// Development flag to switch between mock data and database
const USE_DATABASE = true; // Enable database operations

// Mock data for fallback
import * as seed from '@/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || '550e8400-e29b-41d4-a716-446655440000';
    const includeArchived = searchParams.get('includeArchived') === 'true';

    if (USE_DATABASE) {
      const { worldService } = await import('@/lib/services/worldService');
      const worlds = await worldService.getUserWorlds(userId);
      return NextResponse.json({ worlds });
    } else {
      // Use mock data
      let worlds = seed.worlds;
      
      if (!includeArchived) {
        worlds = worlds.filter(w => !w.isArchived);
      }
      
      return NextResponse.json({ worlds });
    }
  } catch (error) {
    console.error('Error fetching worlds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worlds' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, coverImage, isPublic } = body;
    const userId = body.userId || '550e8400-e29b-41d4-a716-446655440000';

    if (USE_DATABASE) {
      const { worldService } = await import('@/lib/services/worldService');
      const newWorld = await worldService.createWorld({
        name,
        description,
        isPublic: isPublic || false
      }, userId);
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
    console.error('Error creating world:', error);
    return NextResponse.json(
      { error: 'Failed to create world' },
      { status: 500 }
    );
  }
}
