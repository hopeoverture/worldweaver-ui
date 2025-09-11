/**
 * World Service - Focused on world CRUD operations
 */

import type { Database } from '../supabase/types.generated';
import { World } from '../types';
import { createClient as createServerSupabaseClient } from '../supabase/server';
import { adaptWorldFromDatabase, adaptWorldToDatabase, isValidWorld } from '../adapters';
import { logError } from '../logging';

export class WorldService {
  /**
   * Get all worlds for the current user
   */
  async getUserWorlds(userId: string): Promise<World[]> {
    try {
      console.log('WorldService.getUserWorlds - Starting query for userId:', userId);
      
      const supabase = await createServerSupabaseClient();
      const { data: worlds, error } = await supabase
        .from('worlds')
        .select(`
          *,
          entities(count),
          world_members(count)
        `)
        .eq('owner_id', userId) // Filter by user ownership (owner_id is the primary ownership field)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      console.log('WorldService.getUserWorlds - Query result:', {
        userId,
        hasError: !!error,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        rawWorldsCount: worlds?.length || 0,
        rawWorlds: worlds?.map(w => ({ 
          id: w.id, 
          name: w.name, 
          // user_id field removed from schema 
          owner_id: w.owner_id 
        })) || [],
        timestamp: new Date().toISOString()
      });

      if (error) {
        logError('Supabase error fetching worlds', error, { action: 'getUserWorlds', userId });
        throw new Error(`Database error: ${error.message}`);
      }

      const adaptedWorlds = worlds?.map(world => adaptWorldFromDatabase(world)) || [];
      
      console.log('WorldService.getUserWorlds - Final result:', {
        userId,
        adaptedWorldCount: adaptedWorlds.length,
        adaptedWorldIds: adaptedWorlds.map(w => w.id)
      });
      
      return adaptedWorlds;
    } catch (error) {
      console.error('WorldService.getUserWorlds - Error:', error);
      logError('Error fetching user worlds', error as Error, { action: 'getUserWorlds', userId });
      throw new Error('Failed to fetch worlds');
    }
  }

  /**
   * Get a specific world by ID
   */
  async getWorldById(worldId: string, userId: string): Promise<World | null> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: world, error } = await supabase
        .from('worlds')
        .select(`
          *,
          entities(count)
        `)
        .eq('id', worldId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logError('Supabase error fetching world', error, { action: 'getWorldById', worldId, userId });
        throw new Error(`Database error: ${error.message}`);
      }

      const adaptedWorld = adaptWorldFromDatabase(world);
      if (!isValidWorld(adaptedWorld)) {
        logError('Invalid world data from database', new Error('World validation failed'), { worldId, userId });
        throw new Error('Invalid world data');
      }
      
      return adaptedWorld;
    } catch (error) {
      logError('Error fetching world', error as Error, { action: 'getWorldById', worldId, userId });
      throw new Error('Failed to fetch world');
    }
  }

  /**
   * Create a new world
   */
  async createWorld(data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }, userId: string): Promise<World> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      
      if (authErr || !authData?.user) {
        logError('createWorld: missing server auth user', authErr || new Error('No auth user'), { action: 'createWorld', userId });
        throw new Error('Not authenticated (server)');
      }
      
      const ownerId = authData.user.id;
      const { data: world, error } = await supabase
        .from('worlds')
        .insert({
          name: data.name,
          description: data.description || '',
          owner_id: ownerId,
          // Note: user_id was removed from schema, only owner_id is used
          is_public: data.isPublic || false,
          is_archived: false,
          settings: {} as Database['public']['Tables']['worlds']['Row']['settings']
        })
        .select()
        .single();

      if (error) {
        logError('Supabase error creating world', error, { action: 'createWorld', userId, metadata: { worldData: data } });
        throw new Error(`Database error: ${error.message}`);
      }

      const adaptedWorld = adaptWorldFromDatabase(world);
      if (!isValidWorld(adaptedWorld)) {
        logError('Invalid world data after creation', new Error('World validation failed'), { worldId: world.id, userId });
        throw new Error('Invalid world data after creation');
      }
      
      return adaptedWorld;
    } catch (error) {
      logError('Error creating world', error as Error, { action: 'createWorld', userId, metadata: { worldData: data } });
      throw error instanceof Error ? error : new Error('Unknown error creating world');
    }
  }

  /**
   * Update a world
   */
  async updateWorld(worldId: string, data: Partial<World>, userId: string): Promise<World> {
    try {
      const supabase = await createServerSupabaseClient();
      const updateData = adaptWorldToDatabase(data);

      const { data: world, error } = await supabase
        .from('worlds')
        .update(updateData)
        .eq('id', worldId)
        .eq('owner_id', userId) // Only owner can update
        .select()
        .single();

      if (error) {
        logError('Supabase error updating world', error, { action: 'updateWorld', worldId, userId });
        throw new Error(`Database error: ${error.message}`);
      }

      const adaptedWorld = adaptWorldFromDatabase(world);
      if (!isValidWorld(adaptedWorld)) {
        logError('Invalid world data after update', new Error('World validation failed'), { worldId, userId });
        throw new Error('Invalid world data after update');
      }
      
      return adaptedWorld;
    } catch (error) {
      logError('Error updating world', error as Error, { action: 'updateWorld', worldId, userId });
      throw new Error('Failed to update world');
    }
  }

  /**
   * Delete a world
   */
  async deleteWorld(worldId: string, userId: string): Promise<void> {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase
        .from('worlds')
        .delete()
        .eq('id', worldId)
        .eq('owner_id', userId); // Only owner can delete

      if (error) {
        logError('Supabase error deleting world', error, { action: 'deleteWorld', worldId, userId });
        throw new Error(`Database error: ${error.message}`);
      }
    } catch (error) {
      logError('Error deleting world', error as Error, { action: 'deleteWorld', worldId, userId });
      throw new Error('Failed to delete world');
    }
  }

  /**
   * Archive/unarchive a world
   */
  async archiveWorld(worldId: string, userId: string, archived: boolean = true): Promise<void> {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase
        .from('worlds')
        .update({ is_archived: archived })
        .eq('id', worldId)
        .eq('owner_id', userId); // Only owner can archive

      if (error) {
        logError('Supabase error archiving world', error, { action: 'archiveWorld', worldId, userId, metadata: { archived } });
        throw new Error(`Database error: ${error.message}`);
      }
    } catch (error) {
      logError('Error archiving world', error as Error, { action: 'archiveWorld', worldId, userId, metadata: { archived } });
      throw new Error('Failed to archive world');
    }
  }

  /**
   * Check if user has access to a world without fetching full world data
   * Optimized for N+1 query prevention
   */
  async hasWorldAccess(worldId: string, userId: string): Promise<boolean> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: world, error } = await supabase
        .from('worlds')
        .select('id')
        .or(`owner_id.eq.${userId},and(is_public.eq.true,is_archived.eq.false)`)
        .eq('id', worldId)
        .single();

      if (error) {
        if ((error as any).code === 'PGRST116') return false; // Not found
        logError('Supabase error checking world access', error, { action: 'hasWorldAccess', worldId, userId });
        return false;
      }

      return !!world;
    } catch (error) {
      logError('Error checking world access', error as Error, { action: 'hasWorldAccess', worldId, userId });
      return false;
    }
  }

  /**
   * Get world access info for multiple worlds efficiently
   * Returns a Map of worldId -> hasAccess for bulk operations
   */
  async getWorldAccessBulk(worldIds: string[], userId: string): Promise<Map<string, boolean>> {
    if (worldIds.length === 0) return new Map();

    try {
      const supabase = await createServerSupabaseClient();
      const { data: worlds, error } = await supabase
        .from('worlds')
        .select('id')
        .or(`owner_id.eq.${userId},and(is_public.eq.true,is_archived.eq.false)`)
        .in('id', worldIds);

      if (error) {
        logError('Supabase error in bulk world access check', error, { action: 'getWorldAccessBulk', worldIds, userId });
        return new Map();
      }

      const accessMap = new Map<string, boolean>();
      // Initialize all as false
      worldIds.forEach(id => accessMap.set(id, false));
      // Set accessible worlds to true
      worlds?.forEach(world => accessMap.set(world.id, true));
      
      return accessMap;
    } catch (error) {
      logError('Error in bulk world access check', error as Error, { action: 'getWorldAccessBulk', worldIds, userId });
      return new Map();
    }
  }

  /**
   * Get relationships for a world (moved from old service, optimized)
   */
  async getWorldRelationships(worldId: string, userId: string): Promise<Array<{
    id: string;
    worldId: string;
    from: string;
    to: string;
    label: string;
    description?: string | null;
    metadata?: any | null;
    updatedAt?: string;
  }>> {
    try {
      // Use optimized access check
      const hasAccess = await this.hasWorldAccess(worldId, userId);
      if (!hasAccess) throw new Error('World not found or access denied');

      const supabase = await createServerSupabaseClient();
      const { data: rows, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('world_id', worldId)
        .order('updated_at', { ascending: false });

      if (error) {
        logError('Supabase error fetching relationships', error, { action: 'getWorldRelationships', worldId, userId });
        throw new Error(`Database error: ${error.message}`);
      }

      return rows?.map(row => ({
        id: row.id,
        worldId: row.world_id,
        from: row.from_entity_id,
        to: row.to_entity_id,
        label: row.relationship_type, // Map relationship_type to label
        description: row.description,
        metadata: row.metadata,
        updatedAt: row.updated_at,
      })) || [];
    } catch (error) {
      logError('Error fetching world relationships', error as Error, { action: 'getWorldRelationships', worldId, userId });
      throw new Error('Failed to fetch relationships');
    }
  }

  /**
   * Create a relationship between entities
   */
  async createRelationship(
    worldId: string,
    data: {
      fromEntityId: string;
      toEntityId: string;
      label: string;
      description: string | null;
      metadata: any | null;
    },
    userId: string
  ): Promise<any> {
    try {
      // Use optimized access check
      const hasAccess = await this.hasWorldAccess(worldId, userId);
      if (!hasAccess) throw new Error('World not found or access denied');

      const supabase = await createServerSupabaseClient();
      const { data: row, error } = await supabase
        .from('relationships')
        .insert({
          world_id: worldId,
          from_entity_id: data.fromEntityId,
          to_entity_id: data.toEntityId,
          relationship_type: data.label, // Map label to relationship_type
          description: data.description,
          metadata: data.metadata,
        })
        .select('*')
        .single();

      if (error) {
        logError('Supabase error creating relationship', error, { action: 'createRelationship', worldId, userId });
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        id: row.id,
        worldId: row.world_id,
        from: row.from_entity_id,
        to: row.to_entity_id,
        label: row.relationship_type, // Map relationship_type to label
        description: row.description,
        metadata: row.metadata,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logError('Error creating relationship', error as Error, { action: 'createRelationship', worldId, userId });
      throw new Error('Failed to create relationship');
    }
  }
}

// Export singleton instance
export const worldService = new WorldService();