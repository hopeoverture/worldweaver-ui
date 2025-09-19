import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/server';
import { uploadMapImage } from '@/lib/storage/maps';
import { mapService } from '@/lib/services/mapService';
import { safeConsoleError } from '@/lib/logging';
import { aiService } from '@/lib/services/aiService';

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
    const { name, description, prompt } = body;

    if (!name) {
      return NextResponse.json({ error: 'Map name is required' }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Generate the image using the custom prompt
    const aiResult = await aiService.generateWorldMapImageWithPrompt(prompt);

    // Create map record
    const mapData = {
      name,
      description: description || `AI-generated map`,
      width_px: 1024,
      height_px: 1024,
      pixels_per_unit: 100,
      default_zoom: 1,
      is_public: false
    };

    const map = await mapService.createMap(worldId, mapData, user.id);

    // Convert the image URL to a buffer and upload to storage
    let imagePath: string | null = null;
    try {
      console.log('🌐 DEBUG: AI-generated image URL received:', {
        imageUrl: aiResult.result.imageUrl?.slice(0, 100) + '...',
        urlLength: aiResult.result.imageUrl?.length || 0,
        worldId,
        mapName: name
      });

      const imageResponse = await fetch(aiResult.result.imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch generated image');
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const filename = `ai-generated.png`;

      const { path, error: uploadError } = await uploadMapImage(
        worldId,
        map.id,
        filename,
        imageBuffer,
        'image/png'
      );

      if (uploadError || !path) {
        throw new Error(uploadError?.message || 'Failed to upload generated image');
      }

      imagePath = path;

      console.log('📁 DEBUG: Image uploaded and saved to storage:', {
        mapId: map.id,
        mapName: name,
        storagePath: path,
        uploadedSize: imageBuffer.length
      });

      // Update map with image path
      await mapService.updateMap(map.id, {
        image_path: path
      });
    } catch (error) {
      console.error('Error uploading AI generated image:', error);
      // Clean up created map on upload failure
      await mapService.deleteMap(map.id);
      return NextResponse.json({
        error: 'Failed to process generated image',
        details: (error as Error).message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mapId: map.id,
      imagePath,
      prompt: aiResult.usage.metadata?.originalPrompt || prompt,
      message: 'AI-generated map created successfully'
    });

  } catch (error) {
    safeConsoleError('Error generating map with custom prompt', error as Error, {
      action: 'POST_maps_generate_with_prompt',
      worldId,
      userId: user?.id
    });

    return NextResponse.json({
      error: 'Map generation failed',
      message: 'An error occurred while creating the map. Please try again.'
    }, { status: 500 });
  }
}