import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiService } from '@/lib/services/aiService';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logging';

const schema = z.object({
  worldId: z.string().uuid('Invalid world ID'),
  type: z.enum(['entity', 'world-cover']),
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt too long'),
  // For entity images
  entityName: z.string().optional(),
  templateName: z.string().optional(),
  entityFields: z.record(z.unknown()).optional(),
  // For world cover images
  worldName: z.string().optional(),
  worldDescription: z.string().optional(),
  // Image generation options
  style: z.enum(['natural', 'vivid']).default('natural'),
  size: z.enum(['1024x1024', '1024x1792', '1792x1024']).default('1024x1024'),
  quality: z.enum(['standard', 'hd']).default('hd'),
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

    // Check if user has access to the world
    const { data: world, error: worldError } = await supabase
      .from('worlds')
      .select(`
        id, name, description,
        genre_blend, overall_tone, key_themes,
        scope_scale, aesthetic_direction, owner_id
      `)
      .eq('id', validatedData.worldId)
      .single();

    if (worldError || !world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 });
    }

    // Check permissions
    const isOwner = world.owner_id === user.id;
    if (!isOwner) {
      const { data: member } = await supabase
        .from('world_members')
        .select('role')
        .eq('world_id', validatedData.worldId)
        .eq('user_id', user.id!)
        .single();

      if (!member || !member.role || !['admin', 'editor'].includes(member.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    let result;

    if (validatedData.type === 'entity') {
      // Generate entity image
      const worldContext = {
        name: world.name,
        description: world.description || undefined,
        genreBlend: world.genre_blend || undefined,
        overallTone: world.overall_tone || undefined,
        keyThemes: world.key_themes || undefined,
      };

      result = await aiService.generateEntityImage({
        entityName: validatedData.entityName || 'Entity',
        templateName: validatedData.templateName,
        entityFields: validatedData.entityFields,
        worldContext,
        customPrompt: validatedData.prompt,
      });
    } else {
      // Generate world cover image
      const worldData = {
        genreBlend: world.genre_blend || undefined,
        overallTone: world.overall_tone || undefined,
        keyThemes: world.key_themes || undefined,
        scopeScale: world.scope_scale || undefined,
        aestheticDirection: world.aesthetic_direction || undefined,
      };

      result = await aiService.generateWorldCoverImage({
        worldName: validatedData.worldName || world.name,
        worldDescription: validatedData.worldDescription || world.description || undefined,
        worldData,
        customPrompt: validatedData.prompt,
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    logError('Error in generate-image API', error as Error, {
      action: 'generate_image'
    });

    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}