import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/server';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { user, error: authError } = await getServerAuth();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const { worldService } = await import('@/lib/services/worldService');
    const worlds = await worldService.getUserWorlds(user.id);
    return NextResponse.json({ worlds });
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
    // Get authenticated user
    const { user, error: authError } = await getServerAuth();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate request body
    const schema = z.object({
      name: z.string().min(1, 'name is required').max(200),
      description: z.string().max(5000).optional(),
      coverImage: z.string().url().optional(),
      isPublic: z.boolean().optional(),
    });

    let parsed;
    try {
      const body = await request.json();
      parsed = schema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const issues = err.issues.map((i) => ({ path: Array.isArray(i.path) ? i.path.join('.') : '', message: i.message }));
        return NextResponse.json({ error: 'Invalid request body', issues }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { worldService } = await import('@/lib/services/worldService');
    const newWorld = await worldService.createWorld({
      name: parsed.name,
      description: parsed.description,
      isPublic: parsed.isPublic ?? false,
    }, user.id);
    return NextResponse.json({ world: newWorld });
  } catch (error) {
    console.error('Error creating world:', error);
    return NextResponse.json(
      { error: 'Failed to create world' },
      { status: 500 }
    );
  }
}
