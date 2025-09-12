/**
 * Folder Service - Focused on folder CRUD operations
 */

import type { Database } from '../supabase/types.generated';
import { Folder } from '../types';
import { createClient as createServerSupabaseClient } from '../supabase/server';
import { adaptFolderFromDatabase, adaptFolderToDatabase } from '../adapters';
import { logError } from '../logging';
import { worldService } from './worldService';

export class FolderService {
  /**
   * Get folders for a world
   */
  async getWorldFolders(worldId: string, userId: string): Promise<Folder[]> {
    try {
      // Verify access
      const world = await worldService.getWorldById(worldId, userId);
      if (!world) throw new Error('World not found or access denied');

      const supabase = await createServerSupabaseClient();
      const { data: folders, error } = await supabase
        .from('folders')
        .select(`*, entities(count)`) // count entities per folder
        .eq('world_id', worldId)
        .order('updated_at', { ascending: false });

      if (error) {
        logError('Supabase error fetching folders', error, { action: 'getWorldFolders', worldId, userId });
        throw new Error(`Database error: ${error.message}`);
      }

      return (folders || []).map((f: any) => adaptFolderFromDatabase(f));
    } catch (error) {
      logError('Error fetching world folders', error as Error, { action: 'getWorldFolders', worldId, userId });
      throw new Error('Failed to fetch folders');
    }
  }

  /**
   * Create a folder in a world
   */
  async createFolder(worldId: string, data: { name: string; description?: string; color?: string; [key: string]: unknown }, userId: string): Promise<Folder> {
    // Access check
    const world = await worldService.getWorldById(worldId, userId);
    if (!world) throw new Error('World not found or access denied');

    const supabase = await createServerSupabaseClient();
    const { data: row, error } = await supabase
      .from('folders')
      .insert({
        world_id: worldId,
        name: data.name,
        description: data.description || '',
        color: data.color || null,
      })
      .select('*')
      .single();

    if (error) {
      logError('Supabase error creating folder', error, { action: 'createFolder', worldId, userId, metadata: { folderData: data } });
      throw new Error(`Database error: ${error.message}`);
    }

    return adaptFolderFromDatabase(row);
  }

  /**
   * Fetch a folder by ID (with access check)
   */
  async getFolderById(folderId: string, userId: string): Promise<Folder | null> {
    const supabase = await createServerSupabaseClient();
    const { data: row, error } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      logError('Supabase error fetching folder', error, { action: 'getFolderById', folderId, userId });
      throw new Error(`Database error: ${error.message}`);
    }

    const world = await worldService.getWorldById(row.world_id, userId);
    if (!world) return null;

    return adaptFolderFromDatabase(row);
  }

  /**
   * Update a folder by ID
   */
  async updateFolder(folderId: string, data: { name?: string; description?: string; color?: string | null }, userId: string): Promise<Folder> {
    // Access check
    const current = await this.getFolderById(folderId, userId);
    if (!current) throw new Error('Folder not found or access denied');

    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.color !== undefined) patch.color = data.color;

    const supabase = await createServerSupabaseClient();
    const { data: row, error } = await supabase
      .from('folders')
      .update(patch)
      .eq('id', folderId)
      .select('*')
      .single();

    if (error) {
      logError('Supabase error updating folder', error, { action: 'updateFolder', folderId, userId });
      throw new Error(`Database error: ${error.message}`);
    }

    return adaptFolderFromDatabase(row);
  }

  /**
   * Delete a folder by ID
   */
  async deleteFolder(folderId: string, userId: string): Promise<void> {
    // Access check
    const current = await this.getFolderById(folderId, userId);
    if (!current) throw new Error('Folder not found or access denied');

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (error) {
      logError('Supabase error deleting folder', error, { action: 'deleteFolder', folderId, userId });
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

// Export singleton instance
export const folderService = new FolderService();