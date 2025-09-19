import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/server';
import { validateFileUpload, checkUploadRateLimit } from '@/lib/security/fileUpload';
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

    // Check rate limits
    const rateLimit = await checkUploadRateLimit(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        message: rateLimit.message
      }, { status: 429 });
    }

    const form = await req.formData();

    // Extract form data
    const name = form.get('name') as string;
    const mode = form.get('mode') as string;
    const description = form.get('description') as string | null;
    const imageFile = form.get('imageFile') as File | null;
    const scale = form.get('scale') as string | null;
    const gridType = form.get('gridType') as string;
    const gridSize = form.get('gridSize') as string | null;
    const createDefaultLayers = form.get('createDefaultLayers') === 'true';
    const createTerrainLayer = form.get('createTerrainLayer') === 'true';
    const createPoliticalLayer = form.get('createPoliticalLayer') === 'true';
    const createMarkersLayer = form.get('createMarkersLayer') === 'true';
    const autoCreateEntityCards = form.get('autoCreateEntityCards') === 'true';
    const autoLinkMarkers = form.get('autoLinkMarkers') === 'true';
    const exportFormat = form.get('exportFormat') as string;
    const splitLabelsLayer = form.get('splitLabelsLayer') === 'true';

    // AI mode fields - comprehensive world map generation
    const mapPurpose = form.get('mapPurpose') as string | null;
    const mapScale = form.get('mapScale') as string | null;
    const genreTags = form.get('genreTags') as string | null;
    const terrainEmphasis = form.get('terrainEmphasis') as string | null;
    const climateZones = form.get('climateZones') as string | null;
    const settlementDensity = form.get('settlementDensity') as string | null;
    const politicalComplexity = form.get('politicalComplexity') as string | null;
    const travelFocus = form.get('travelFocus') as string | null;
    const signatureFeatures = form.get('signatureFeatures') as string | null;
    const visualStyle = form.get('visualStyle') as string | null;

    // Legacy fields for backward compatibility
    const mapType = form.get('mapType') as string | null;
    const artStyle = form.get('artStyle') as string | null;
    const viewAngle = form.get('viewAngle') as string | null;
    const aspectRatioAI = form.get('aspectRatioAI') as string | null;
    const contextEntityIds = form.get('contextEntityIds') as string | null;

    if (!name) {
      return NextResponse.json({ error: 'Map name is required' }, { status: 400 });
    }

    if (!mode || !['upload', 'ai'].includes(mode)) {
      return NextResponse.json({ error: 'Valid mode is required (upload or ai)' }, { status: 400 });
    }

    let imagePath: string | null = null;
    let mapWidth = 1920;
    let mapHeight = 1080;

    // Handle upload mode
    if (mode === 'upload') {
      if (!imageFile) {
        return NextResponse.json({ error: 'Image file is required for upload mode' }, { status: 400 });
      }

      if (!scale) {
        return NextResponse.json({ error: 'Scale is required for upload mode' }, { status: 400 });
      }

      // Validate file security
      const validation = await validateFileUpload(imageFile, {
        userId: user.id,
        worldId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      });

      if (!validation.isValid) {
        return NextResponse.json({
          error: 'File validation failed',
          details: validation.errors,
          warnings: validation.warnings
        }, { status: 400 });
      }

      // Validate file type
      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json({
          error: 'Invalid file type',
          details: 'Only image files are allowed for maps'
        }, { status: 400 });
      }

      // Create map record first to get ID
      const mapData = {
        name,
        description: description || undefined,
        width_px: mapWidth,
        height_px: mapHeight,
        pixels_per_unit: 100, // Default, will be updated based on scale
        default_zoom: 1,
        is_public: false
      };

      const map = await mapService.createMap(worldId, mapData, user.id);

      // Upload image file
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = `base.${imageFile.type.split('/')[1]}`;

      const { path, error: uploadError } = await uploadMapImage(
        worldId,
        map.id,
        filename,
        buffer,
        imageFile.type
      );

      if (uploadError || !path) {
        // Clean up created map on upload failure
        await mapService.deleteMap(map.id);
        return NextResponse.json({
          error: 'File upload failed',
          details: uploadError?.message
        }, { status: 500 });
      }

      imagePath = path;

      // Update map with image path and actual dimensions
      // For now, use default dimensions - could be enhanced to read actual image dimensions
      await mapService.updateMap(map.id, {
        image_path: path,
        width_px: mapWidth,
        height_px: mapHeight
      });

      // Create default layers if requested
      if (createDefaultLayers) {
        const layers = [];

        if (createTerrainLayer) {
          layers.push({
            name: 'Terrain',
            kind: 'regions' as const,
            z_index: 1,
            visible: true,
            style: { opacity: 0.7, color: '#228B22' }
          });
        }

        if (createPoliticalLayer) {
          layers.push({
            name: 'Political Boundaries',
            kind: 'regions' as const,
            z_index: 2,
            visible: true,
            style: { opacity: 0.8, color: '#FF6347', strokeWidth: 2 }
          });
        }

        if (createMarkersLayer) {
          layers.push({
            name: 'Markers',
            kind: 'markers' as const,
            z_index: 3,
            visible: true,
            style: { defaultColor: '#3B82F6', size: 6 }
          });
        }

        // Create layers
        for (const layerData of layers) {
          await mapService.createMapLayer(map.id, layerData);
        }
      }

      return NextResponse.json({
        success: true,
        mapId: map.id,
        imagePath,
        message: 'Map created successfully'
      });
    }

    // Handle AI mode
    if (mode === 'ai') {
      // Check for comprehensive world map generation fields first
      const isComprehensiveMode = mapPurpose && mapScale && visualStyle;

      if (!isComprehensiveMode) {
        // Fall back to legacy validation for backward compatibility
        if (!mapType || !artStyle || !viewAngle || !aspectRatioAI) {
          return NextResponse.json({
            error: 'AI mode requires either comprehensive world map fields (map purpose, scale, visual style) or legacy fields (map type, art style, view angle, aspect ratio)'
          }, { status: 400 });
        }
      }

      // Map aspect ratio to dimensions (gpt-image-1 only supports 1024x1024)
      let width = 1024;
      let height = 1024;

      // Note: gpt-image-1 currently only supports 1024x1024, but we'll store the intended ratio
      // for future when we might support different models or when gpt-image-1 supports more sizes
      const aspectRatioMap = {
        'square': { width: 1024, height: 1024 },
        'vertical': { width: 1024, height: 1024 }, // Will be 768x1024 when supported
        'landscape': { width: 1024, height: 1024 } // Will be 1024x576 when supported
      };

      const dimensions = aspectRatioMap[aspectRatioAI as keyof typeof aspectRatioMap];
      if (dimensions) {
        width = dimensions.width;
        height = dimensions.height;
      }

      // Fetch world data for context
      const world = await mapService.getWorldForContext(worldId);

      // Parse context entity IDs if provided
      let entityContextString = '';
      if (contextEntityIds) {
        try {
          const entityIds = JSON.parse(contextEntityIds);
          if (Array.isArray(entityIds) && entityIds.length > 0) {
            // Fetch entity names for context
            const entities = await mapService.getEntitiesForContext(entityIds);
            entityContextString = entities.map(e => e.name).join(', ');
          }
        } catch (error) {
          console.warn('Failed to parse context entity IDs:', error);
        }
      }

      // Parse array fields from JSON strings
      let parsedGenreTags: string[] | undefined;
      let parsedTerrainEmphasis: string[] | undefined;
      let parsedClimateZones: string[] | undefined;
      let parsedTravelFocus: string[] | undefined;
      let parsedSignatureFeatures: string[] | undefined;

      try {
        if (genreTags) parsedGenreTags = JSON.parse(genreTags);
        if (terrainEmphasis) parsedTerrainEmphasis = JSON.parse(terrainEmphasis);
        if (climateZones) parsedClimateZones = JSON.parse(climateZones);
        if (travelFocus) parsedTravelFocus = JSON.parse(travelFocus);
        if (signatureFeatures) parsedSignatureFeatures = JSON.parse(signatureFeatures);
      } catch (error) {
        console.warn('Failed to parse array fields:', error);
      }

      // Generate the map image using AI
      let aiResult;

      if (isComprehensiveMode) {
        // Use new comprehensive world map generation
        aiResult = await aiService.generateWorldMapImage({
          mapPurpose: mapPurpose as any,
          mapScale: mapScale as any,
          genreTags: parsedGenreTags as any,
          terrainEmphasis: parsedTerrainEmphasis as any,
          climateZones: parsedClimateZones as any,
          settlementDensity: settlementDensity as any,
          politicalComplexity: politicalComplexity as any,
          travelFocus: parsedTravelFocus as any,
          signatureFeatures: parsedSignatureFeatures as any,
          visualStyle: visualStyle as any,
          worldContext: world ? {
            name: world.name,
            description: world.description,
            genreBlend: world.genreBlend,
            overallTone: world.overallTone,
            keyThemes: world.keyThemes
          } : undefined,
          entityContext: entityContextString || undefined,
          customPrompt: description || undefined
        });
      } else {
        // Fall back to legacy generation method
        aiResult = await aiService.generateMapImage({
          mapType: mapType as 'world' | 'region' | 'settlement' | 'site' | 'dungeon',
          artStyle: artStyle as 'photorealistic' | 'hand-drawn',
          viewAngle: viewAngle as 'top-down' | 'isometric',
          aspectRatioAI: aspectRatioAI as 'square' | 'vertical' | 'landscape',
          worldContext: world ? {
            name: world.name,
            description: world.description,
            genreBlend: world.genreBlend,
            overallTone: world.overallTone,
            keyThemes: world.keyThemes
          } : undefined,
          entityContext: entityContextString || undefined,
          customPrompt: description || undefined
        });
      }

      // Create map record
      const mapData = {
        name,
        description: description || `AI-generated ${mapType} map`,
        width_px: width,
        height_px: height,
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

      // Create default layers for AI mode too
      if (createDefaultLayers) {
        const layers = [
          {
            name: 'Base Terrain',
            kind: 'regions' as const,
            z_index: 1,
            visible: true,
            style: { opacity: 0.8, color: '#90EE90' }
          },
          {
            name: 'Generated Features',
            kind: 'markers' as const,
            z_index: 2,
            visible: true,
            style: { defaultColor: '#FF4500', size: 8 }
          }
        ];

        for (const layerData of layers) {
          await mapService.createMapLayer(map.id, layerData);
        }
      }

      return NextResponse.json({
        success: true,
        mapId: map.id,
        mode: 'ai',
        imagePath,
        prompt: aiResult.usage.metadata?.originalPrompt || 'AI-generated map',
        message: 'AI-generated map created successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });

  } catch (error) {
    safeConsoleError('Error generating map', error as Error, {
      action: 'POST_maps_generate',
      worldId,
      userId: user?.id
    });

    return NextResponse.json({
      error: 'Map generation failed',
      message: 'An error occurred while creating the map. Please try again.'
    }, { status: 500 });
  }
}