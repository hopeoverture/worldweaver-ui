import { createClient } from '@supabase/supabase-js';
import 'server-only';

/**
 * Server-side utility for managing entity storage operations
 * Provides secure signed URL generation for entity cover images
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
 * Generate a signed URL for accessing an entity cover image
 * @param path - Storage path (e.g., "entities/covers/{entityId}/cover.jpg")
 * @param ttlSec - Time to live in seconds (default: 3600 = 1 hour)
 * @returns Promise<{ signedUrl: string; error: Error | null }>
 */
export async function getSignedEntityCoverUrl(
  path: string,
  ttlSec: number = 3600
): Promise<{ signedUrl: string | null; error: Error | null }> {
  try {
    const supabase = createServerClient();

    // Validate path format - entities should be in entities bucket
    if (!isValidEntityPath(path)) {
      return {
        signedUrl: null,
        error: new Error(`Invalid entity path format: ${path}. Expected: entities/covers/{entityId}/filename or similar`)
      };
    }

    // Generate signed URL from entities bucket
    const { data, error } = await supabase.storage
      .from('entities')
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
 * Generate multiple signed URLs for entity images
 * @param paths - Array of storage paths
 * @param ttlSec - Time to live in seconds (default: 3600 = 1 hour)
 * @returns Promise<{ results: Array<{ path: string; signedUrl: string | null; error: Error | null }> }>
 */
export async function getSignedEntityCoverUrls(
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
      const { signedUrl, error } = await getSignedEntityCoverUrl(path, ttlSec);
      return { path, signedUrl, error };
    })
  );

  return { results };
}

/**
 * Upload an entity cover image to storage
 * @param entityId - Entity UUID
 * @param filename - File name (e.g., "cover.jpg")
 * @param file - File buffer or Blob
 * @param contentType - MIME type (e.g., "image/jpeg")
 * @returns Promise<{ path: string | null; error: Error | null }>
 */
export async function uploadEntityCoverImage(
  entityId: string,
  filename: string,
  file: Buffer | Blob,
  contentType?: string
): Promise<{ path: string | null; error: Error | null }> {
  try {
    const supabase = createServerClient();

    // Validate inputs
    if (!isValidUuid(entityId)) {
      return { path: null, error: new Error('Invalid entityId format') };
    }
    if (!filename || filename.trim().length === 0) {
      return { path: null, error: new Error('Filename is required') };
    }

    // Construct storage path
    const path = `entities/covers/${entityId}/${filename}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from('entities')
      .upload(path, file, {
        contentType,
        upsert: true // Allow overwriting existing files
      });

    if (error) {
      return {
        path: null,
        error: new Error(`Failed to upload entity cover image: ${error.message}`)
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
 * Delete an entity cover image from storage
 * @param path - Storage path (e.g., "entities/covers/{entityId}/cover.jpg")
 * @returns Promise<{ success: boolean; error: Error | null }>
 */
export async function deleteEntityCoverImage(
  path: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createServerClient();

    // Validate path format
    if (!isValidEntityPath(path)) {
      return {
        success: false,
        error: new Error(`Invalid entity path format: ${path}`)
      };
    }

    // Delete file
    const { error } = await supabase.storage
      .from('entities')
      .remove([path]);

    if (error) {
      return {
        success: false,
        error: new Error(`Failed to delete entity cover image: ${error.message}`)
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
 * List all cover images for a specific entity
 * @param entityId - Entity UUID
 * @returns Promise<{ files: Array<{ name: string; path: string }>; error: Error | null }>
 */
export async function listEntityCoverImages(
  entityId: string
): Promise<{ files: Array<{ name: string; path: string }>; error: Error | null }> {
  try {
    const supabase = createServerClient();

    // Validate entityId
    if (!isValidUuid(entityId)) {
      return { files: [], error: new Error('Invalid entityId format') };
    }

    // Construct search path
    const searchPath = `entities/covers/${entityId}/`;

    // List files
    const { data, error } = await supabase.storage
      .from('entities')
      .list(searchPath, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      return {
        files: [],
        error: new Error(`Failed to list entity cover images: ${error.message}`)
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
 * Validate entity storage path format
 * Expected: entities/covers/{entityId}/filename or similar entity-related paths
 */
function isValidEntityPath(path: string): boolean {
  const parts = path.split('/');
  return (
    parts.length >= 2 &&
    parts[0] === 'entities' &&
    parts.length >= 3 // At least entities/type/filename
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
 * Generate a standard entity cover storage path
 */
export function generateEntityCoverPath(entityId: string, filename: string): string {
  return `entities/covers/${entityId}/${filename}`;
}

/**
 * Extract entity ID from entity storage path
 */
export function extractEntityIdFromPath(path: string): string | null {
  const parts = path.split('/');
  if (parts.length >= 3 && parts[0] === 'entities' && parts[1] === 'covers') {
    return parts[2];
  }
  return null;
}