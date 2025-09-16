import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiService } from '@/lib/services/aiService';
import { aiUsageService, checkAIQuota } from '@/lib/services/aiUsageService';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logging';
import { TemplateField } from '@/lib/types';

const schema = z.object({
  worldId: z.string().uuid('Invalid world ID'),
  templateId: z.string().uuid('Invalid template ID'),
  entityName: z.string().optional(),
  prompt: z.string().max(500, 'Prompt too long').optional(),
  existingFields: z.record(z.unknown()).optional(),
  generateAllFields: z.boolean().default(false),
  specificField: z.string().optional(),
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

    // Get template data - templateId is required for entity field generation
    if (!validatedData.templateId) {
      return NextResponse.json({
        error: 'Template ID is required for entity field generation',
        details: 'Please provide a templateId to generate entity fields'
      }, { status: 400 });
    }

    // Get template data - use service role for system template access
    // Core templates require elevated permissions, so we need to use service role
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: templateResults, error: templateError } = await serviceSupabase
      .from('templates')
      .select('id, name, fields')
      .eq('id', validatedData.templateId);

    if (templateError) {
      console.error('Template lookup error:', templateError);
      return NextResponse.json({
        error: 'Database error while looking up template',
        details: `Database error occurred: ${templateError.message}`,
        templateId: validatedData.templateId
      }, { status: 500 });
    }

    if (!templateResults || templateResults.length === 0) {
      console.error('Template not found in database:', {
        templateId: validatedData.templateId,
        worldId: validatedData.worldId
      });
      return NextResponse.json({
        error: 'Template not found',
        details: `No template found with ID: ${validatedData.templateId}. The template may have been deleted or the entity has an invalid template reference.`,
        templateId: validatedData.templateId,
        suggestion: 'Please check that the template exists or update the entity to use a valid template.'
      }, { status: 404 });
    }

    if (templateResults.length > 1) {
      console.warn('Multiple templates found with same ID:', {
        templateId: validatedData.templateId,
        count: templateResults.length
      });
    }

    const template = templateResults[0];

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
          operation: 'entity_fields',
          model: 'gpt-5-mini',
          provider: 'openai',
          promptTokens: 0,
          completionTokens: 0,
          costUsd: 0,
          currency: 'USD',
          success: false,
          metadata: { worldId: validatedData.worldId, templateId: validatedData.templateId }
        },
        error: 'AI quota exceeded'
      });

      return NextResponse.json(
        { error: 'AI quota exceeded. Please wait for quota reset or upgrade your plan.' },
        { status: 429 }
      );
    }

    // Generate entity fields using AI service
    let generationResult;
    try {
      generationResult = await aiService.generateEntityFields({
        prompt: validatedData.prompt,
        entityName: validatedData.entityName,
        templateName: template.name,
        templateFields: (template.fields || []) as TemplateField[],
        existingFields: validatedData.existingFields || {},
        worldContext,
        generateAllFields: validatedData.generateAllFields,
        specificField: validatedData.specificField,
      });
    } catch (error) {
      console.error('Detailed error from aiService (entity fields):', error);
      // Track the failed attempt
      await aiUsageService.trackUsage({
        userId: user.id,
        usage: {
          operation: 'entity_fields',
          model: 'gpt-5-mini',
          provider: 'openai',
          promptTokens: 0,
          completionTokens: 0,
          costUsd: 0,
          currency: 'USD',
          success: false,
          metadata: { worldId: validatedData.worldId, templateId: validatedData.templateId }
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

    logError('Error in generate-entity-fields API', error as Error, {
      action: 'generate_entity_fields'
    });

    return NextResponse.json(
      { error: 'Failed to generate entity fields' },
      { status: 500 }
    );
  }
}