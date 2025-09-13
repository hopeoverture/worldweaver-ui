import { NextRequest, NextResponse } from 'next/server';
import { getServerClientAndUser } from '@/lib/auth/server';
import { z } from 'zod';
import { 
  apiSuccess, 
  apiAuthRequired, 
  apiValidationError, 
  apiInternalError,
  parseRequestBody,
  withApiErrorHandling,
  generateRequestId
} from '@/lib/api-utils';
import { WorldsListResponse, WorldResponse } from '@/lib/api-types';
import { ActivityLogger } from '@/lib/activity-logger';

export const GET = withApiErrorHandling(async (request: NextRequest): Promise<NextResponse<WorldsListResponse>> => {
  const requestId = generateRequestId();
  
  console.log('🔍 GET /api/worlds - Starting request:', { requestId });
  console.log('🔍 GET /api/worlds - LOGGING TEST - This should show up in server terminal');
  
  // Get authenticated user (unified helper)
  const { user, error: authError } = await getServerClientAndUser();
  
  console.log('GET /api/worlds - Auth Debug:', {
    requestId,
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    authError: authError?.message
  });
  
  if (authError || !user) {
    console.log('GET /api/worlds - Auth failed:', { authError, hasUser: !!user, requestId });
    return apiAuthRequired();
  }

  const searchParams = request.nextUrl.searchParams;
  const includeArchived = searchParams.get('includeArchived') === 'true';

  console.log('GET /api/worlds - Calling getUserWorlds with userId:', user.id);
  const { supabaseWorldService } = await import('@/lib/services/supabaseWorldService');
  const worlds = await supabaseWorldService.getUserWorlds(user.id);
  
  console.log('GET /api/worlds - Response:', {
    requestId,
    userId: user.id,
    worldCount: worlds.length,
    worldIds: worlds.map(w => w.id),
    timestamp: new Date().toISOString()
  });
  
  return apiSuccess({ worlds }, { 'X-Request-ID': requestId });
});

const createWorldSchema = z.object({
  name: z.string().min(1, 'name is required').max(200),
  description: z.string().max(5000).optional(),
  isPublic: z.boolean().optional(),
  logline: z.string().max(5000).optional(),
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
});

export const POST = withApiErrorHandling(async (request: NextRequest): Promise<NextResponse<WorldResponse>> => {
  const requestId = generateRequestId();
  
  console.log('🚀 POST /api/worlds - LOGGING TEST - World creation attempt with user_id fix');
  
  // Get authenticated user + the exact server client instance
  const { supabase, user, error: authError } = await getServerClientAndUser();
  
  // Enhanced debugging for authentication issues
  console.log('🚀 POST /api/worlds - Auth Debug:', {
    requestId,
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    authError: authError?.message,
    timestamp: new Date().toISOString()
  });
  
  if (authError || !user) {
    console.error('POST /api/worlds - Auth failed:', { authError, hasUser: !!user, requestId });
    return apiAuthRequired();
  }

  // Parse and validate request body
  const bodyResult = await parseRequestBody(request, createWorldSchema);
  if ('error' in bodyResult) {
    return bodyResult.error;
  }
  
  const parsed = bodyResult;

  // Prepare world data for SupabaseWorldService
  const worldData = {
    name: parsed.name,
    description: parsed.description ?? undefined,
    isPublic: parsed.isPublic ?? false,
    logline: parsed.logline,
    genreBlend: parsed.genreBlend,
    overallTone: parsed.overallTone,
    keyThemes: parsed.keyThemes,
    audienceRating: parsed.audienceRating,
    scopeScale: parsed.scopeScale,
    technologyLevel: parsed.technologyLevel,
    magicLevel: parsed.magicLevel,
    cosmologyModel: parsed.cosmologyModel,
    climateBiomes: parsed.climateBiomes,
    calendarTimekeeping: parsed.calendarTimekeeping,
    societalOverview: parsed.societalOverview,
    conflictDrivers: parsed.conflictDrivers,
    rulesConstraints: parsed.rulesConstraints,
    aestheticDirection: parsed.aestheticDirection,
  };

  console.log('POST /api/worlds - Creating world via service:', {
    requestId,
    userId: user.id,
    userEmail: user.email,
    worldData,
    timestamp: new Date().toISOString()
  });

  // Use SupabaseWorldService which includes setupInitialWorldResources
  const { supabaseWorldService } = await import('@/lib/services/supabaseWorldService');
  const world = await supabaseWorldService.createWorld(worldData, user.id);

  console.log('POST /api/worlds - World created successfully via service:', {
    requestId,
    worldId: world.id,
    worldName: world.name,
    requestUserId: user.id,
    userEmail: user.email,
    timestamp: new Date().toISOString()
  });

  // Log world creation activity
  try {
    ActivityLogger.worldCreated(user.id, world.name, world.id);
  } catch (error) {
    // Silent failure for activity logging
    console.warn('Failed to log world creation activity:', error);
  }

  return apiSuccess(world, { 'X-Request-ID': requestId });
});
