import { NextRequest, NextResponse } from 'next/server';
import { getServerClientAndUser } from '@/lib/auth/server';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user (unified helper)
    const { user, error: authError } = await getServerClientAndUser();
    
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
    // Get authenticated user + the exact server client instance
    const { supabase, user, error: authError } = await getServerClientAndUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate request body (extended fields supported)
    const schema = z.object({
      name: z.string().min(1, 'name is required').max(200),
      description: z.string().max(5000).optional(),
      isPublic: z.boolean().optional(),
      logline: z.string().max(5000).optional(),
      genreBlend: z.array(z.string()).optional(),
      overallTone: z.string().optional(),
      keyThemes: z.array(z.string()).optional(),
      audienceRating: z.string().optional(),
      scopeScale: z.string().optional(),
      technologyLevel: z.array(z.string()).optional(),
      magicLevel: z.array(z.string()).optional(),
      cosmologyModel: z.string().optional(),
      climateBiomes: z.array(z.string()).optional(),
      calendarTimekeeping: z.string().optional(),
      societalOverview: z.string().optional(),
      conflictDrivers: z.array(z.string()).optional(),
      rulesConstraints: z.string().optional(),
      aestheticDirection: z.string().optional(),
    })

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

    // Use the same authenticated supabase client to ensure RLS context matches
    const { data: row, error } = await supabase
      .from('worlds')
      .insert({
        name: parsed.name,
        description: (parsed.description ?? parsed.logline ?? ''),
        owner_id: user.id,
        user_id: user.id, // Temporary: database has both user_id and owner_id columns
        is_public: parsed.isPublic ?? false,
        is_archived: false,
        settings: {},
        logline: parsed.logline ?? null,
        genre_blend: parsed.genreBlend ?? null,
        overall_tone: parsed.overallTone ?? null,
        key_themes: parsed.keyThemes ?? null,
        audience_rating: parsed.audienceRating ?? null,
        scope_scale: parsed.scopeScale ?? null,
        technology_level: parsed.technologyLevel ?? null,
        magic_level: parsed.magicLevel ?? null,
        cosmology_model: parsed.cosmologyModel ?? null,
        climate_biomes: parsed.climateBiomes ?? null,
        calendar_timekeeping: parsed.calendarTimekeeping ?? null,
        societal_overview: parsed.societalOverview ?? null,
        conflict_drivers: parsed.conflictDrivers ?? null,
        rules_constraints: parsed.rulesConstraints ?? null,
        aesthetic_direction: parsed.aestheticDirection ?? null,
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    const world = {
      id: row.id,
      name: row.name,
      summary: row.description || '',
      entityCount: 0,
      updatedAt: row.updated_at,
      isArchived: row.is_archived || false,
      coverImage: undefined,
      isPublic: row.is_public || false,
      settings: (row.settings as Record<string, unknown>) || {},
    }

    return NextResponse.json({ world })
  } catch (error) {
    console.error('Error creating world:', error);
    const detail = String((error as Error)?.message || error)
    const body = process.env.NODE_ENV === 'production'
      ? { error: 'Failed to create world' }
      : { error: 'Failed to create world', detail }
    return NextResponse.json(body, { status: 500 })
  }
}
