import { createClient } from '@supabase/supabase-js';
import 'server-only';

/**
 * Server-side utility for managing map storage operations
 * Provides secure signed URL generation for map images
 */

// Create a server-side Supabase client with service role key
function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for server client');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Generate a signed URL for accessing a map image
 * @param path - Storage path (e.g., "maps/worlds/{worldId}/{mapId}/base.png")
 * @param ttlSec - Time to live in seconds (default: 3600 = 1 hour)
 * @returns Promise<{ signedUrl: string; error: Error | null }>
 */
export async function getSignedMapUrl(
  path: string,
  ttlSec: number = 3600
): Promise<{ signedUrl: string | null; error: Error | null }> {
  try {
    const supabase = createServerClient();

    // Validate path format
    if (!isValidMapPath(path)) {
      return {
        signedUrl: null,
        error: new Error(`Invalid map path format: ${path}. Expected: maps/worlds/{worldId}/{mapId}/filename`)
      };
    }

    // Generate signed URL
    const { data, error } = await supabase.storage
      .from('maps')
      .createSignedUrl(path, ttlSec);

    if (error) {
      return {
        signedUrl: null,
        error: new Error(`Failed to create signed URL: ${error.message}`)
      };
    }

    if (!data?.signedUrl) {
      return {
        signedUrl: null,
        error: new Error('No signed URL returned from Supabase')
      };
    }

    return {
      signedUrl: data.signedUrl,
      error: null
    };
  } catch (error) {
    return {
      signedUrl: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    };
  }
}

/**
 * Generate multiple signed URLs for map images
 * @param paths - Array of storage paths
 * @param ttlSec - Time to live in seconds (default: 3600 = 1 hour)
 * @returns Promise<{ results: Array<{ path: string; signedUrl: string | null; error: Error | null }> }>
 */
export async function getSignedMapUrls(
  paths: string[],
  ttlSec: number = 3600
): Promise<{
  results: Array<{
    path: string;
    signedUrl: string | null;
    error: Error | null
  }>
}> {
  const results = await Promise.all(
    paths.map(async (path) => {
      const { signedUrl, error } = await getSignedMapUrl(path, ttlSec);
      return { path, signedUrl, error };
    })
  );

  return { results };
}

/**
 * Upload a map image to storage
 * @param worldId - World UUID
 * @param mapId - Map UUID
 * @param filename - File name (e.g., "base.png")
 * @param file - File buffer or Blob
 * @param contentType - MIME type (e.g., "image/png")
 * @returns Promise<{ path: string | null; error: Error | null }>
 */
export async function uploadMapImage(
  worldId: string,
  mapId: string,
  filename: string,
  file: Buffer | Blob,
  contentType?: string
): Promise<{ path: string | null; error: Error | null }> {
  try {
    const supabase = createServerClient();

    // Validate inputs
    if (!isValidUuid(worldId)) {
      return { path: null, error: new Error('Invalid worldId format') };
    }
    if (!isValidUuid(mapId)) {
      return { path: null, error: new Error('Invalid mapId format') };
    }
    if (!filename || filename.trim().length === 0) {
      return { path: null, error: new Error('Filename is required') };
    }

    // Construct storage path
    const path = `maps/worlds/${worldId}/${mapId}/${filename}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from('maps')
      .upload(path, file, {
        contentType,
        upsert: true // Allow overwriting existing files
      });

    if (error) {
      return {
        path: null,
        error: new Error(`Failed to upload map image: ${error.message}`)
      };
    }

    return {
      path: data.path,
      error: null
    };
  } catch (error) {
    return {
      path: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    };
  }
}

/**
 * Delete a map image from storage
 * @param path - Storage path (e.g., "maps/worlds/{worldId}/{mapId}/base.png")
 * @returns Promise<{ success: boolean; error: Error | null }>
 */
export async function deleteMapImage(
  path: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createServerClient();

    // Validate path format
    if (!isValidMapPath(path)) {
      return {
        success: false,
        error: new Error(`Invalid map path format: ${path}`)
      };
    }

    // Delete file
    const { error } = await supabase.storage
      .from('maps')
      .remove([path]);

    if (error) {
      return {
        success: false,
        error: new Error(`Failed to delete map image: ${error.message}`)
      };
    }

    return {
      success: true,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    };
  }
}

/**
 * List all map images for a specific world
 * @param worldId - World UUID
 * @param mapId - Optional map UUID to filter by specific map
 * @returns Promise<{ files: Array<{ name: string; path: string }>; error: Error | null }>
 */
export async function listMapImages(
  worldId: string,
  mapId?: string
): Promise<{ files: Array<{ name: string; path: string }>; error: Error | null }> {
  try {
    const supabase = createServerClient();

    // Validate worldId
    if (!isValidUuid(worldId)) {
      return { files: [], error: new Error('Invalid worldId format') };
    }

    // Construct search path
    const searchPath = mapId
      ? `maps/worlds/${worldId}/${mapId}/`
      : `maps/worlds/${worldId}/`;

    // List files
    const { data, error } = await supabase.storage
      .from('maps')
      .list(searchPath, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      return {
        files: [],
        error: new Error(`Failed to list map images: ${error.message}`)
      };
    }

    // Format results
    const files = (data || [])
      .filter(file => file.name) // Filter out directories
      .map(file => ({
        name: file.name!,
        path: `${searchPath}${file.name}`
      }));

    return {
      files,
      error: null
    };
  } catch (error) {
    return {
      files: [],
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate map storage path format
 * Expected: maps/worlds/{worldId}/{mapId}/filename
 */
function isValidMapPath(path: string): boolean {
  const parts = path.split('/');
  return (
    parts.length >= 4 &&
    parts[0] === 'maps' &&
    parts[1] === 'worlds' &&
    isValidUuid(parts[2]) &&
    parts[3].length > 0 && // mapId or filename
    (parts.length === 4 || (parts.length > 4 && parts[4].length > 0)) // filename if nested
  );
}

/**
 * Validate UUID format
 */
function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate a standard map storage path
 */
export function generateMapPath(worldId: string, mapId: string, filename: string): string {
  return `maps/worlds/${worldId}/${mapId}/${filename}`;
}

/**
 * Extract world ID from map storage path
 */
export function extractWorldIdFromPath(path: string): string | null {
  const parts = path.split('/');
  if (parts.length >= 3 && parts[0] === 'maps' && parts[1] === 'worlds') {
    return parts[2];
  }
  return null;
}

/**
 * Extract map ID from map storage path
 */
export function extractMapIdFromPath(path: string): string | null {
  const parts = path.split('/');
  if (parts.length >= 4 && parts[0] === 'maps' && parts[1] === 'worlds') {
    return parts[3];
  }
  return null;
}