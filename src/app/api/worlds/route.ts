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
  
  // Get authenticated user (unified helper)
  const { user, error: authError } = await getServerClientAndUser();
  
  if (authError || !user) {
    return apiAuthRequired();
  }

  const searchParams = request.nextUrl.searchParams;
  const includeArchived = searchParams.get('includeArchived') === 'true';

  const { worldService } = await import('@/lib/services/worldService');
  const worlds = await worldService.getUserWorlds(user.id);
  
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
  
  // Get authenticated user + the exact server client instance
  const { supabase, user, error: authError } = await getServerClientAndUser();
  
  if (authError || !user) {
    return apiAuthRequired();
  }

  // Parse and validate request body
  const bodyResult = await parseRequestBody(request, createWorldSchema);
  if ('error' in bodyResult) {
    return bodyResult.error;
  }
  
  const parsed = bodyResult;

  // Use the same authenticated supabase client to ensure RLS context matches
  const { data: row, error } = await supabase
    .from('worlds')
    .insert({
      name: parsed.name,
      description: parsed.description ?? null,
      owner_id: user.id,
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
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

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
