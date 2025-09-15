import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiService } from '@/lib/services/aiService';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logging';
import { TemplateField } from '@/lib/types';

const schema = z.object({
  worldId: z.string().uuid('Invalid world ID'),
  templateId: z.string().uuid('Invalid template ID').optional(),
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

    // Get template data if templateId provided
    let template = null;
    if (validatedData.templateId) {
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .select('id, name, fields')
        .eq('id', validatedData.templateId)
        .single();

      if (templateError || !templateData) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      template = templateData;
    }

    if (!template) {
      return NextResponse.json({ error: 'Template is required for field generation' }, { status: 400 });
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

    // Generate entity fields using AI service
    const result = await aiService.generateEntityFields({
      prompt: validatedData.prompt,
      entityName: validatedData.entityName,
      templateName: template.name,
      templateFields: (template.fields || []) as TemplateField[],
      existingFields: validatedData.existingFields || {},
      worldContext,
      generateAllFields: validatedData.generateAllFields,
      specificField: validatedData.specificField,
    });

    return NextResponse.json(result);

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