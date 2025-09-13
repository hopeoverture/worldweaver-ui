import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import {
  apiSuccess,
  apiInternalError,
  withApiErrorHandling,
  generateRequestId
} from '@/lib/api-utils';

export const POST = withApiErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  const requestId = generateRequestId();

  // Require admin token for security
  const adminToken = request.headers.get('x-admin-token');
  if (!adminToken || adminToken !== process.env.SEED_ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!adminClient) {
      return NextResponse.json({ error: 'Admin client not initialized' }, { status: 500 });
    }

    console.log('🧹 Starting cleanup of invalid entities', { requestId });

    // Step 1: Get entities with folder_id
    const { data: entitiesWithFolders, error: queryError } = await adminClient
      .from('entities')
      .select('id, name, world_id, folder_id')
      .not('folder_id', 'is', null); // Only check entities that have a folder_id

    if (queryError) {
      console.error('Error querying entities:', JSON.stringify(queryError, null, 2));
      return NextResponse.json({
        error: 'Database query failed',
        details: queryError
      }, { status: 500 });
    }

    // Get all folders
    const { data: folders, error: foldersError } = await adminClient
      .from('folders')
      .select('id, name, kind');

    if (foldersError) {
      console.error('Error querying folders:', foldersError);
      return apiInternalError();
    }

    // Create folder map
    const folderMap = new Map();
    (folders || []).forEach(folder => {
      folderMap.set(folder.id, folder);
    });

    // Filter to find entities with invalid folder references
    const entitiesToCleanup = (entitiesWithFolders || []).filter(entity => {
      const folder = folderMap.get(entity.folder_id);
      // Entity has folder_id but folder doesn't exist or is wrong type
      return !folder || folder.kind !== 'entities';
    });

    console.log('🔍 Found invalid entities:', {
      requestId,
      total: entitiesWithFolders?.length || 0,
      invalid: entitiesToCleanup.length,
      entities: entitiesToCleanup.map(e => ({ id: e.id, name: e.name, folder_id: e.folder_id }))
    });

    if (entitiesToCleanup.length === 0) {
      return apiSuccess({
        message: 'No invalid entities found',
        cleaned: 0,
        details: []
      }, { 'X-Request-ID': requestId });
    }

    // Step 2: Clean up invalid entities
    // Option A: Delete them completely
    // Option B: Set their folder_id to null (make them ungrouped)

    const action = request.nextUrl.searchParams.get('action') || 'ungroup'; // 'delete' or 'ungroup'

    let result;
    if (action === 'delete') {
      // Delete invalid entities completely
      const { data, error } = await adminClient
        .from('entities')
        .delete()
        .in('id', entitiesToCleanup.map(e => e.id));

      if (error) {
        console.error('Error deleting invalid entities:', error);
        return apiInternalError();
      }

      result = {
        action: 'deleted',
        count: entitiesToCleanup.length,
        entities: entitiesToCleanup.map(e => ({ id: e.id, name: e.name }))
      };
    } else {
      // Make invalid entities ungrouped (set folder_id to null)
      const { data, error } = await adminClient
        .from('entities')
        .update({ folder_id: null })
        .in('id', entitiesToCleanup.map(e => e.id));

      if (error) {
        console.error('Error ungrouping invalid entities:', error);
        return apiInternalError();
      }

      result = {
        action: 'ungrouped',
        count: entitiesToCleanup.length,
        entities: entitiesToCleanup.map(e => ({ id: e.id, name: e.name }))
      };
    }

    console.log('✅ Cleanup completed:', { requestId, result });

    return apiSuccess({
      message: `Successfully ${result.action} ${result.count} invalid entities`,
      ...result
    }, { 'X-Request-ID': requestId });

  } catch (error) {
    console.error('Cleanup error:', error);
    return apiInternalError();
  }
});

// GET endpoint to analyze without making changes
export const GET = withApiErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  const requestId = generateRequestId();

  // Require admin token for security
  const adminToken = request.headers.get('x-admin-token');
  if (!adminToken || adminToken !== process.env.SEED_ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!adminClient) {
      return NextResponse.json({ error: 'Admin client not initialized' }, { status: 500 });
    }

    console.log('🔍 Analyzing entities for cleanup', { requestId });

    // Get all entities with their folder information
    const { data: entities, error: queryError } = await adminClient
      .from('entities')
      .select(`
        id,
        name,
        world_id,
        folder_id
      `);

    if (queryError) {
      console.error('Error querying entities:', JSON.stringify(queryError, null, 2));
      return NextResponse.json({
        error: 'Database query failed',
        details: queryError
      }, { status: 500 });
    }

    // Get all folders separately
    const { data: folders, error: foldersError } = await adminClient
      .from('folders')
      .select('id, name, kind');

    if (foldersError) {
      console.error('Error querying folders:', foldersError);
      return apiInternalError();
    }

    // Create a map of folder_id -> folder info
    const folderMap = new Map();
    (folders || []).forEach(folder => {
      folderMap.set(folder.id, folder);
    });

    // Analyze entities
    const analysis = {
      total: entities?.length || 0,
      ungrouped: 0,
      valid: 0,
      invalidFolder: 0,
      wrongFolderType: 0,
      details: {
        ungrouped: [] as any[],
        valid: [] as any[],
        invalidFolder: [] as any[],
        wrongFolderType: [] as any[]
      }
    };

    (entities || []).forEach(entity => {
      if (!entity.folder_id) {
        analysis.ungrouped++;
        analysis.details.ungrouped.push({ id: entity.id, name: entity.name });
      } else {
        const folder = folderMap.get(entity.folder_id);
        if (!folder) {
          analysis.invalidFolder++;
          analysis.details.invalidFolder.push({
            id: entity.id,
            name: entity.name,
            folder_id: entity.folder_id
          });
        } else if (folder.kind !== 'entities') {
          analysis.wrongFolderType++;
          analysis.details.wrongFolderType.push({
            id: entity.id,
            name: entity.name,
            folder_id: entity.folder_id,
            folder_type: folder.kind
          });
        } else {
          analysis.valid++;
          analysis.details.valid.push({
            id: entity.id,
            name: entity.name,
            folder: folder.name
          });
        }
      }
    });

    console.log('📊 Entity analysis completed:', { requestId, analysis });

    return apiSuccess({
      message: 'Entity analysis completed',
      ...analysis,
      needsCleanup: analysis.invalidFolder + analysis.wrongFolderType
    }, { 'X-Request-ID': requestId });

  } catch (error) {
    console.error('Analysis error:', error);
    return apiInternalError();
  }
});