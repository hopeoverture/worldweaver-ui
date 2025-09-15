import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiService } from '@/lib/services/aiService';
import { aiUsageService, checkAIQuota } from '@/lib/services/aiUsageService';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logging';

const schema = z.object({
  worldId: z.string().uuid('Invalid world ID').optional(),
  prompt: z.string().max(1000, 'Prompt too long').optional(),
  fieldsToGenerate: z.array(z.string()).min(1, 'At least one field must be specified'),
  existingData: z.object({
    name: z.string().optional(),
    logline: z.string().optional(),
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
  }).optional(),
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

    // If worldId is provided, check permissions
    if (validatedData.worldId) {
      const { data: world, error: worldError } = await supabase
        .from('worlds')
        .select('id, owner_id')
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
    }

    // Check user's AI quota before generation
    const hasQuota = await checkAIQuota(user.id);
    if (!hasQuota) {
      // Track the rate-limited attempt
      await aiUsageService.trackUsage({
        userId: user.id,
        usage: {
          operation: 'world_fields',
          model: 'gpt-5-mini',
          provider: 'openai',
          promptTokens: 0,
          completionTokens: 0,
          costUsd: 0,
          currency: 'USD',
          success: false,
          metadata: { worldId: validatedData.worldId, fieldsToGenerate: validatedData.fieldsToGenerate }
        },
        error: 'AI quota exceeded'
      });

      return NextResponse.json(
        { error: 'AI quota exceeded. Please wait for quota reset or upgrade your plan.' },
        { status: 429 }
      );
    }

    // Generate world fields using AI service
    let generationResult;
    try {
      generationResult = await aiService.generateWorldFields({
        prompt: validatedData.prompt,
        fieldsToGenerate: validatedData.fieldsToGenerate,
        existingData: validatedData.existingData || {},
      });
    } catch (error) {
      // Track the failed attempt
      await aiUsageService.trackUsage({
        userId: user.id,
        usage: {
          operation: 'world_fields',
          model: 'gpt-5-mini',
          provider: 'openai',
          promptTokens: 0,
          completionTokens: 0,
          costUsd: 0,
          currency: 'USD',
          success: false,
          metadata: { worldId: validatedData.worldId, fieldsToGenerate: validatedData.fieldsToGenerate }
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

    logError('Error in generate-world-fields API', error as Error, {
      action: 'generate_world_fields'
    });

    return NextResponse.json(
      { error: 'Failed to generate world fields' },
      { status: 500 }
    );
  }
}