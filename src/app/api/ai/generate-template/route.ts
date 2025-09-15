import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiService } from '@/lib/services/aiService';
import { aiUsageService, checkAIQuota } from '@/lib/services/aiUsageService';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logging';

const schema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(500, 'Prompt too long'),
  worldId: z.string().uuid('Invalid world ID'),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = schema.parse(body);

    // Check if user has access to the world and AI generation permission
    const { data: world, error: worldError } = await supabase
      .from('worlds')
      .select(`
        id, name, description, owner_id,
        logline, genre_blend, overall_tone, key_themes,
        audience_rating, scope_scale, technology_level,
        magic_level, cosmology_model, climate_biomes,
        calendar_timekeeping, societal_overview,
        conflict_drivers, rules_constraints, aesthetic_direction
      `)
      .eq('id', validatedData.worldId)
      .single();

    if (worldError || !world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 });
    }

    // Check if user is owner or has AI generation permission
    const isOwner = world.owner_id === user.id;

    if (!isOwner) {
      // Check if user is a member with appropriate permissions
      const { data: member } = await supabase
        .from('world_members')
        .select('role')
        .eq('world_id', validatedData.worldId)
        .eq('user_id', user.id!)
        .single();

      // Only owners and admins can run AI generations for now
      if (!member || !member.role || !['admin'].includes(member.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    // Prepare world context using all the extended fields the user filled in
    const worldContext = {
      name: world.name,
      description: world.description || undefined,
      logline: world.logline || undefined,
      genreBlend: world.genre_blend || undefined,
      overallTone: world.overall_tone || undefined,
      keyThemes: world.key_themes || undefined,
      audienceRating: world.audience_rating || undefined,
      scopeScale: world.scope_scale || undefined,
      technologyLevel: world.technology_level || undefined,
      magicLevel: world.magic_level || undefined,
      cosmologyModel: world.cosmology_model || undefined,
      climateBiomes: world.climate_biomes || undefined,
      calendarTimekeeping: world.calendar_timekeeping || undefined,
      societalOverview: world.societal_overview || undefined,
      conflictDrivers: world.conflict_drivers || undefined,
      rulesConstraints: world.rules_constraints || undefined,
      aestheticDirection: world.aesthetic_direction || undefined,
    };

    // Check user's AI quota before generation
    const hasQuota = await checkAIQuota(user.id);
    if (!hasQuota) {
      // Track the rate-limited attempt
      await aiUsageService.trackUsage({
        userId: user.id,
        usage: {
          operation: 'template',
          model: 'gpt-5-mini',
          provider: 'openai',
          promptTokens: 0,
          completionTokens: 0,
          costUsd: 0,
          currency: 'USD',
          success: false,
          metadata: { worldId: validatedData.worldId }
        },
        error: 'AI quota exceeded'
      });

      return NextResponse.json(
        { error: 'AI quota exceeded. Please wait for quota reset or upgrade your plan.' },
        { status: 429 }
      );
    }

    // Generate template using AI service
    let generationResult;
    try {
      generationResult = await aiService.generateTemplate({
        prompt: validatedData.prompt,
        worldContext,
      });
    } catch (error) {
      // Track the failed attempt
      await aiUsageService.trackUsage({
        userId: user.id,
        usage: {
          operation: 'template',
          model: 'gpt-5-mini',
          provider: 'openai',
          promptTokens: 0,
          completionTokens: 0,
          costUsd: 0,
          currency: 'USD',
          success: false,
          metadata: { worldId: validatedData.worldId }
        },
        error: (error as Error).message
      });

      throw error; // Re-throw to handle in outer catch block
    }

    // Track successful usage
    await aiUsageService.trackUsage({
      userId: user.id,
      usage: generationResult.usage
    });

    return NextResponse.json(generationResult.result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    logError('Error in generate-template API', error as Error, {
      action: 'generate_template'
    });

    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}