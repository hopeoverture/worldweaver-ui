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
  entityName: z.string().min(1, 'Entity name is required'),
  entityFields: z.record(z.unknown()).default({}),
  customPrompt: z.string().max(500, 'Prompt too long').optional(),
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

    // Get template data - try user templates first, then system templates
    const userSupabase = await createClient();

    // First try to get the template as a regular user (for world-specific templates)
    let { data: templateResults, error: templateError } = await userSupabase
      .from('templates')
      .select('id, name, fields')
      .eq('id', validatedData.templateId);

    // If not found and we get permission error, try with service role for system templates
    if (templateError || !templateResults || templateResults.length === 0) {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: systemTemplateResults, error: systemTemplateError } = await serviceSupabase
        .from('templates')
        .select('id, name, fields')
        .eq('id', validatedData.templateId);

      if (systemTemplateError || !systemTemplateResults || systemTemplateResults.length === 0) {
        return NextResponse.json({
          error: 'Template not found',
          details: `No template found with ID: ${validatedData.templateId}`,
          templateId: validatedData.templateId
        }, { status: 404 });
      }

      templateResults = systemTemplateResults;
    }

    const templateData = templateResults[0];

    // Check user's AI quota before generation
    const hasQuota = await checkAIQuota(user.id);
    if (!hasQuota) {
      // Track the rate-limited attempt
      await aiUsageService.trackUsage({
        userId: user.id,
        usage: {
          operation: 'entity-summary-preview',
          model: 'gpt-5-mini',
          provider: 'openai',
          promptTokens: 0,
          completionTokens: 0,
          costUsd: 0,
          currency: 'USD',
          success: false,
          metadata: {
            worldId: validatedData.worldId,
            templateId: validatedData.templateId,
            entityName: validatedData.entityName
          }
        },
        error: 'AI quota exceeded'
      });

      return NextResponse.json(
        { error: 'AI quota exceeded. Please wait for quota reset or upgrade your plan.' },
        { status: 429 }
      );
    }

    // Create a mock entity object for the AI service
    const mockEntity = {
      id: 'preview', // Temporary ID for preview
      worldId: validatedData.worldId,
      templateId: validatedData.templateId,
      name: validatedData.entityName,
      fields: validatedData.entityFields,
      summary: '', // Will be generated
      folderId: undefined,
      tags: [],
      imageUrl: undefined,
      links: [], // Required by Entity type
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create template object for the AI service
    const template = {
      id: templateData.id,
      worldId: validatedData.worldId,
      name: templateData.name,
      category: undefined,
      description: undefined,
      fields: (templateData.fields || []) as TemplateField[],
      isSystemTemplate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Prepare world context
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

    let generationResult;

    try {
      generationResult = await aiService.generateEntitySummary({
        entity: mockEntity,
        template,
        worldContext,
        customPrompt: validatedData.customPrompt,
      });
    } catch (error) {
      // Track the failed attempt
      await aiUsageService.trackUsage({
        userId: user.id,
        usage: {
          operation: 'entity-summary-preview',
          model: 'gpt-5-mini',
          provider: 'openai',
          promptTokens: 0,
          completionTokens: 0,
          costUsd: 0,
          currency: 'USD',
          success: false,
          metadata: {
            worldId: validatedData.worldId,
            templateId: validatedData.templateId,
            entityName: validatedData.entityName
          }
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

    logError('Error in generate-entity-summary-preview API', error as Error, {
      action: 'generate_entity_summary_preview'
    });

    return NextResponse.json(
      { error: 'Failed to generate entity summary preview' },
      { status: 500 }
    );
  }
}