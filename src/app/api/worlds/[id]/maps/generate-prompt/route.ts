import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/server';
import { aiService } from '@/lib/services/aiService';
import { mapService } from '@/lib/services/mapService';
import { safeConsoleError } from '@/lib/logging';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const worldId = params.id;
  let user: any = null;

  try {
    const auth = await getServerAuth();
    user = auth.user;

    if (auth.error || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    const {
      mapPurpose,
      mapScale,
      genreTags,
      terrainEmphasis,
      climateZones,
      settlementDensity,
      politicalComplexity,
      travelFocus,
      signatureFeatures,
      visualStyle,
      includeWorldContext = true,
      selectedEntityIds = []
    } = body;

    if (!mapPurpose || !mapScale || !genreTags?.length ||
        !terrainEmphasis?.length || !climateZones?.length ||
        !settlementDensity || !politicalComplexity ||
        !travelFocus?.length || !visualStyle) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'All required fields must be provided for prompt generation'
      }, { status: 400 });
    }

    // Conditionally fetch world data for context
    const world = includeWorldContext ? await mapService.getWorldForContext(worldId) : null;

    // Fetch selected entities if any are provided
    let entityContext: string | undefined;
    if (selectedEntityIds.length > 0) {
      try {
        const entities = await mapService.getEntitiesForContext(selectedEntityIds);
        entityContext = entities.map(e => e.name).join(', ');
      } catch (error) {
        console.warn('Failed to fetch selected entities for context:', error);
      }
    }

    // Generate the prompt using aiService
    const prompt = aiService.generateWorldMapPrompt({
      mapPurpose,
      mapScale,
      genreTags,
      terrainEmphasis,
      climateZones,
      settlementDensity,
      politicalComplexity,
      travelFocus,
      signatureFeatures,
      visualStyle,
      worldContext: world ? {
        name: world.name,
        description: world.description,
        genreBlend: world.genreBlend,
        overallTone: world.overallTone,
        keyThemes: world.keyThemes
      } : undefined,
      entityContext,
    });

    return NextResponse.json({
      success: true,
      prompt
    });

  } catch (error) {
    safeConsoleError('Error generating map prompt', error as Error, {
      action: 'POST_maps_generate_prompt',
      worldId,
      userId: user?.id
    });

    return NextResponse.json({
      error: 'Prompt generation failed',
      message: 'An error occurred while generating the prompt. Please try again.'
    }, { status: 500 });
  }
}