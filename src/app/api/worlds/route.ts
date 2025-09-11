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
  const { worldService } = await import('@/lib/services/worldService');
  const worlds = await worldService.getUserWorlds(user.id);
  
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
  
  console.log('🚀 POST /api/worlds - LOGGING TEST - World creation attempt');
  
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

  // Debug the insert payload
  const insertPayload = {
    name: parsed.name,
    description: parsed.description ?? null,
    owner_id: user.id,
    user_id: user.id, // Required field for Insert operations
    is_public: parsed.isPublic ?? false,
    is_archived: false,
    settings: {},
    logline: parsed.logline ?? null,
    genre_blend: parsed.genreBlend ?? null,
    overall_tone: parsed.overallTone ?? null,
    key_themes: parsed.keyThemes ?? null,
    audience_rating: parsed.audienceRating ?? null,
    scope_scale: parsed.scopeScale ?? null,
    technology_level: parsed.technologyLevel ?? null,
    magic_level: parsed.magicLevel ?? null,
    cosmology_model: parsed.cosmologyModel ?? null,
    climate_biomes: parsed.climateBiomes ?? null,
    calendar_timekeeping: parsed.calendarTimekeeping ?? null,
    societal_overview: parsed.societalOverview ?? null,
    conflict_drivers: parsed.conflictDrivers ?? null,
    rules_constraints: parsed.rulesConstraints ?? null,
    aesthetic_direction: parsed.aestheticDirection ?? null,
  };

  console.log('POST /api/worlds - Insert Debug:', {
    requestId,
    userId: user.id,
    ownerIdValue: insertPayload.owner_id,
    userIdValue: insertPayload.user_id,
    userEmail: user.email,
    insertPayload,
    timestamp: new Date().toISOString()
  });

  // Use the same authenticated supabase client to ensure RLS context matches
  const { data: row, error } = await supabase
    .from('worlds')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error) {
    console.error('POST /api/worlds - Database Error:', {
      requestId,
      error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      insertPayload,
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    throw new Error(error.message)
  }

  console.log('POST /api/worlds - World created successfully:', {
    requestId,
    worldId: row.id,
    worldName: row.name,
    createdUserId: row.user_id,
    createdOwnerId: row.owner_id,
    requestUserId: user.id,
    userEmail: user.email,
    timestamp: new Date().toISOString()
  });

  const world = {
    id: row.id,
    name: row.name,
    summary: row.description || '',
    description: row.description || undefined,
    entityCount: 0,
    updatedAt: row.updated_at,
    isArchived: row.is_archived || false,
    coverImage: undefined,
    isPublic: row.is_public || false,
    settings: (row.settings as Record<string, unknown>) || {},
  }

  return apiSuccess(world, { 'X-Request-ID': requestId });
});
