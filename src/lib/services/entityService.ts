/**
 * Entity Service - Focused on entity CRUD operations
 */

import type { Database } from '../supabase/types.generated';
import { Entity } from '../types';
import { createClient as createServerSupabaseClient } from '../supabase/server';
import { adminClient } from '../supabase/admin';
import { adaptEntityFromDatabase, isValidEntity } from '../adapters';
import { logError } from '../logging';
import { worldService } from './worldService';

export class EntityService {
  /**
   * Get entities for a world
   */
  async getWorldEntities(worldId: string, userId: string): Promise<Entity[]> {
    try {
      // First verify user has access to this world
      const world = await worldService.getWorldById(worldId, userId);
      if (!world) {
        throw new Error('World not found or access denied');
      }

      const supabase = await createServerSupabaseClient();
      const { data: entities, error } = await supabase
        .from('entities')
        .select(`
          *,
          templates(name, category)
        `)
        .eq('world_id', worldId)
        .order('updated_at', { ascending: false });

      if (error) {
        logError('Supabase error fetching entities', error, { action: 'getWorldEntities', worldId, userId });
        throw new Error(`Database error: ${error.message}`);
      }

      return entities?.map(entity => {
        const adaptedEntity = adaptEntityFromDatabase(entity);
        if (!isValidEntity(adaptedEntity)) {
          logError('Invalid entity data from database', new Error('Entity validation failed'), { entityId: entity.id, worldId });
        }
        return adaptedEntity;
      }).filter(isValidEntity) || [];
    } catch (error) {
      logError('Error fetching world entities', error as Error, { action: 'getWorldEntities', worldId, userId });
      throw new Error('Failed to fetch entities');
    }
  }

  /**
   * Create a new entity in a world
   */
  async createEntity(worldId: string, data: {
    templateId?: string;
    folderId?: string;
    name: string;
    fields: Record<string, unknown>;
    tags?: string[];
    [key: string]: any; // Allow custom fields
  }, userId: string): Promise<Entity> {
    // Access check by fetching world - this is an N+1 query issue we'll address later
    const world = await worldService.getWorldById(worldId, userId);
    if (!world) throw new Error('World not found or access denied');

    const supabase = await createServerSupabaseClient();
    
    // Extract imageUrl for proper column, merge rest with regular fields for data JSONB column
    const { templateId, folderId, name, fields, tags, imageUrl, ...customFields } = data;
    const allCustomFields = { ...(fields || {}), ...customFields };

    const { data: row, error } = await supabase
      .from('entities')
      .insert({
        world_id: worldId,
        template_id: templateId || null,
        folder_id: folderId || null,
        name: name,
        data: allCustomFields as Database['public']['Tables']['entities']['Row']['data'],
        tags: tags || [],
        image_url: imageUrl || null,
      })
      .select('*')
      .single();

    if (error) {
      logError('Supabase error creating entity', error, { action: 'createEntity', worldId, userId, metadata: { entityData: data } });
      throw new Error(`Database error: ${error.message}`);
    }

    const adaptedEntity = adaptEntityFromDatabase(row);
    if (!isValidEntity(adaptedEntity)) {
      logError('Invalid entity data after creation', new Error('Entity validation failed'), { entityId: row.id, worldId, userId });
      throw new Error('Invalid entity data after creation');
    }
    
    return adaptedEntity;
  }

  /**
   * Get a single entity by ID (with access check)
   */
  async getEntityById(entityId: string, userId: string): Promise<Entity | null> {
    const supabase = await createServerSupabaseClient();
    const { data: row, error } = await supabase
      .from('entities')
      .select('*')
      .eq('id', entityId)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      logError('Supabase error fetching entity', error, { action: 'getEntityById', entityId, userId });
      throw new Error(`Database error: ${error.message}`);
    }

    // Optimized access check - only check access, don't fetch full world
    const hasAccess = await worldService.hasWorldAccess(row.world_id, userId);
    if (!hasAccess) return null;

    const adaptedEntity = adaptEntityFromDatabase(row);
    if (!isValidEntity(adaptedEntity)) {
      logError('Invalid entity data from database', new Error('Entity validation failed'), { entityId, userId });
      throw new Error('Invalid entity data');
    }
    
    return adaptedEntity;
  }

  /**
   * Get multiple entities by IDs efficiently (with access check)
   * Uses bulk world access check to prevent N+1 queries
   */
  async getEntitiesByIds(entityIds: string[], userId: string): Promise<Entity[]> {
    if (entityIds.length === 0) return [];

    const supabase = await createServerSupabaseClient();
    const { data: rows, error } = await supabase
      .from('entities')
      .select('*')
      .in('id', entityIds);

    if (error) {
      logError('Supabase error fetching entities by IDs', error, { action: 'getEntitiesByIds', entityIds, userId });
      throw new Error(`Database error: ${error.message}`);
    }

    if (!rows || rows.length === 0) return [];

    // Get unique world IDs and check access in bulk
    const worldIds = [...new Set(rows.map(row => row.world_id))];
    const worldAccessMap = await worldService.getWorldAccessBulk(worldIds, userId);

    // Filter entities by world access and validate
    return rows
      .filter(row => worldAccessMap.get(row.world_id))
      .map(row => {
        const adaptedEntity = adaptEntityFromDatabase(row);
        if (!isValidEntity(adaptedEntity)) {
          logError('Invalid entity data from database', new Error('Entity validation failed'), { entityId: row.id, userId });
        }
        return adaptedEntity;
      })
      .filter(isValidEntity);
  }

  /**
   * Update an entity by ID
   */
  async updateEntity(entityId: string, data: Partial<{
    name: string;
    templateId: string | null;
    folderId: string | null;
    fields: Record<string, unknown>;
    tags: string[] | null;
    imageUrl: string | null;
  }>, userId: string): Promise<Entity> {
    // Fetch current entity to determine world and access
    const current = await this.getEntityById(entityId, userId);
    if (!current) throw new Error('Entity not found or access denied');

    // Use admin client for updates to bypass potential RLS issues
    if (!adminClient) {
      throw new Error('Admin client not available');
    }

    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.templateId !== undefined) payload.template_id = data.templateId;
    if (data.folderId !== undefined) payload.folder_id = data.folderId;
    if (data.fields !== undefined) payload.data = (data.fields as unknown as Database['public']['Tables']['entities']['Row']['data']) ?? {};
    if (data.tags !== undefined) payload.tags = data.tags;
    if (data.imageUrl !== undefined) payload.image_url = data.imageUrl;

    const { data: row, error } = await adminClient
      .from('entities')
      .update(payload)
      .eq('id', entityId)
      .select('*')
      .single();

    if (error) {
      logError('Supabase error updating entity', error, { action: 'updateEntity', entityId, userId });
      throw new Error(`Database error: ${error.message}`);
    }

    const adaptedEntity = adaptEntityFromDatabase(row);
    if (!isValidEntity(adaptedEntity)) {
      logError('Invalid entity data after update', new Error('Entity validation failed'), { entityId, userId });
      throw new Error('Invalid entity data after update');
    }
    
    return adaptedEntity;
  }

  /**
   * Delete an entity by ID
   */
  async deleteEntity(entityId: string, userId: string): Promise<void> {
    // Access check first
    const current = await this.getEntityById(entityId, userId);
    if (!current) throw new Error('Entity not found or access denied');

    // Use admin client for deletions to bypass potential RLS issues
    if (!adminClient) {
      throw new Error('Admin client not available');
    }

    const { error } = await adminClient
      .from('entities')
      .delete()
      .eq('id', entityId);

    if (error) {
      logError('Supabase error deleting entity', error, { action: 'deleteEntity', entityId, userId });
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

// Export singleton instance
export const entityService = new EntityService();