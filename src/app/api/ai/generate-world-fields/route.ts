import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
// Temporary fallback to original service to isolate the issue
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
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🔄 [${requestId}] Starting AI world fields generation request`);

  try {
    console.log(`🔐 [${requestId}] Initializing Supabase client`);
    const supabase = await createClient();

    // Check authentication
    console.log(`🔍 [${requestId}] Checking user authentication`);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error(`❌ [${requestId}] Authentication failed:`, { authError, hasUser: !!user });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`✅ [${requestId}] User authenticated:`, { userId: user.id, email: user.email });

    // Parse and validate request body
    console.log(`📋 [${requestId}] Parsing request body`);
    const body = await req.json();
    console.log(`📊 [${requestId}] Request body structure:`, {
      hasPrompt: !!body.prompt,
      promptLength: body.prompt?.length || 0,
      fieldsToGenerate: body.fieldsToGenerate,
      fieldsToGenerateCount: Array.isArray(body.fieldsToGenerate) ? body.fieldsToGenerate.length : 0,
      hasExistingData: !!body.existingData,
      existingDataKeys: body.existingData ? Object.keys(body.existingData) : [],
      worldId: body.worldId || 'none'
    });

    const validatedData = schema.parse(body);
    console.log(`✅ [${requestId}] Request validation successful`);

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
    console.log(`🔍 [${requestId}] Checking AI quota for user`);
    const hasQuota = await checkAIQuota(user.id);
    if (!hasQuota) {
      console.warn(`⚠️ [${requestId}] AI quota exceeded for user ${user.id}`);

      // Track the rate-limited attempt
      await aiUsageService.trackUsage({
        userId: user.id,
        usage: {
          operation: 'world_fields',
          model: 'gpt-5-2025-08-07',
          provider: 'openai',
          promptTokens: 0,
          completionTokens: 0,
          costUsd: 0,
          currency: 'USD',
          success: false,
          metadata: { worldId: validatedData.worldId, fieldsToGenerate: validatedData.fieldsToGenerate, requestId }
        },
        error: 'AI quota exceeded'
      });

      return NextResponse.json(
        { error: 'AI quota exceeded. Please wait for quota reset or upgrade your plan.' },
        { status: 429 }
      );
    }
    console.log(`✅ [${requestId}] AI quota check passed`);

    // Generate world fields using AI service
    let generationResult;
    try {
      console.log(`🤖 [${requestId}] Starting AI generation with data:`, {
        prompt: validatedData.prompt,
        promptLength: validatedData.prompt?.length || 0,
        fieldsToGenerate: validatedData.fieldsToGenerate,
        fieldsToGenerateCount: validatedData.fieldsToGenerate?.length || 0,
        hasExistingData: !!validatedData.existingData,
        existingDataFieldCount: validatedData.existingData ? Object.keys(validatedData.existingData).length : 0
      });

      const aiStartTime = Date.now();
      generationResult = await aiService.generateWorldFields({
        prompt: validatedData.prompt,
        fieldsToGenerate: validatedData.fieldsToGenerate,
        existingData: validatedData.existingData || {},
      });
      const aiDuration = Date.now() - aiStartTime;

      console.log(`✅ [${requestId}] AI generation successful in ${aiDuration}ms:`, {
        hasResult: !!generationResult.result,
        hasUsage: !!generationResult.usage,
        resultFields: generationResult.result ? Object.keys(generationResult.result.fields || {}) : [],
        fieldsGenerated: generationResult.result?.fields ? Object.keys(generationResult.result.fields).length : 0
      });

      if (generationResult.result?.fields) {
        console.log(`📝 [${requestId}] Generated field values:`, generationResult.result.fields);
      }
    } catch (error) {
      console.error(`❌ [${requestId}] AI generation failed:`, error);

      // Enhanced error logging for AI service failures
      if (error instanceof Error) {
        console.error(`❌ [${requestId}] Error details:`, {
          name: error.name,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });
      }

      // Track the failed attempt
      try {
        console.log(`📊 [${requestId}] Tracking failed AI usage`);
        await aiUsageService.trackUsage({
          userId: user.id,
          usage: {
            operation: 'world_fields',
            model: 'gpt-5-2025-08-07',
            provider: 'openai',
            promptTokens: 0,
            completionTokens: 0,
            costUsd: 0,
            currency: 'USD',
            success: false,
            metadata: {
              worldId: validatedData.worldId,
              fieldsToGenerate: validatedData.fieldsToGenerate,
              requestId,
              errorName: error instanceof Error ? error.name : 'Unknown',
              errorMessage: error instanceof Error ? error.message : String(error)
            }
          },
          error: (error as Error).message
        });
      } catch (trackingError) {
        console.error(`❌ [${requestId}] Failed to track usage:`, trackingError);
      }

      throw error; // Re-throw to handle in outer catch block
    }

    // Track successful usage
    try {
      console.log(`📊 [${requestId}] Tracking successful usage...`);
      await aiUsageService.trackUsage({
        userId: user.id,
        usage: {
          ...generationResult.usage,
          metadata: {
            ...generationResult.usage.metadata,
            requestId
          }
        }
      });
      console.log(`✅ [${requestId}] Usage tracking successful`);
    } catch (trackingError) {
      console.error(`❌ [${requestId}] Failed to track successful usage:`, trackingError);
      // Don't throw here - we still want to return the result
    }

    console.log(`🎉 [${requestId}] Returning result to client`);
    return NextResponse.json(generationResult.result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`❌ [${requestId}] Validation error:`, {
        errors: error.errors,
        errorPaths: error.errors.map(e => ({ path: e.path, code: e.code, message: e.message }))
      });
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error(`❌ [${requestId}] Unexpected error in generate-world-fields API:`, error);
    if (error instanceof Error) {
      console.error(`❌ [${requestId}] Error stack:`, error.stack);
    }

    logError('Error in generate-world-fields API', error as Error, {
      action: 'generate_world_fields'
    });

    // Return more detailed error information for debugging
    const errorResponse = {
      error: 'Failed to generate world fields',
      requestId,
      details: {
        message: (error as Error).message,
        name: (error as Error).name,
        timestamp: new Date().toISOString(),
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}