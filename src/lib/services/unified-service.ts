/**
 * Simplified Unified Service Layer Implementation
 * 
 * Uses manual error handling instead of decorators for better TypeScript compatibility
 */

import type { World, Entity, Template, Folder, RelationshipRow, Profile } from '@/lib/types';
import type { 
  IWorldService, 
  IEntityService, 
  ITemplateService, 
  IFolderService, 
  IRelationshipService,
  IServiceLayer 
} from './interfaces';
import { 
  ServiceError, 
  NotFoundError, 
  AccessDeniedError, 
  DatabaseError,
  ValidationError,
  withErrorHandling 
} from './errors';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { 
  adaptWorldFromDatabase, 
  adaptWorldToDatabase,
  adaptEntityFromDatabase,
  adaptEntityToDatabase 
} from '@/lib/adapters';
import { WorldService } from './worldService';
import { logInfo, logError } from '@/lib/logging';
import { validateEnv } from '@/lib/env-validation';
import type { Json } from '@/lib/types';

/**
 * Simplified World Service Implementation
 */
class SimplifiedWorldService implements IWorldService {
  async getUserWorlds(userId: string): Promise<World[]> {
    try {
      logInfo('Fetching user worlds', { userId, action: 'getUserWorlds' });
      
      const supabase = await createServerSupabaseClient();
      const { data: worlds, error } = await supabase
        .from('worlds')
        .select('*')
        .eq('owner_id', userId)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new DatabaseError('getUserWorlds', error);
      }

      const adaptedWorlds = (worlds || []).map((world: any) => adaptWorldFromDatabase(world));
      logInfo(`Fetched ${adaptedWorlds.length} worlds`, { userId });
      
      return adaptedWorlds;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error fetching user worlds', error as Error, { userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to fetch worlds', error as Error);
    }
  }

  async getWorldById(worldId: string, userId: string): Promise<World | null> {
    try {
      logInfo('Fetching world by ID', { worldId, userId, action: 'getWorldById' });
      
      const supabase = await createServerSupabaseClient();
      const { data: world, error } = await supabase
        .from('worlds')
        .select('*')
        .eq('id', worldId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new DatabaseError('getWorldById', error);
      }

      if (!world) {
        return null;
      }

      const adaptedWorld = adaptWorldFromDatabase(world);
      logInfo('World fetched successfully', { worldId, userId });
      
      return adaptedWorld;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error fetching world by ID', error as Error, { worldId, userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to fetch world', error as Error);
    }
  }

  async createWorld(worldData: Omit<World, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>, userId: string): Promise<World> {
    try {
      logInfo('Creating new world', { userId, action: 'createWorld' });
      
      if (!adminClient) {
        throw new ServiceError('INTERNAL_ERROR', 'Admin client not available');
      }

      // Validate required fields
      if (!worldData.name?.trim()) {
        throw new ValidationError('name', 'World name is required');
      }

      const adaptedData = adaptWorldToDatabase(worldData);
      
      // Ensure required fields are set
      const insertData = {
        name: worldData.name.trim(),
        owner_id: userId,
        description: worldData.description || null,
        is_archived: false,
        ...adaptedData,
      } as any; // Type assertion for database insert

      const { data: world, error } = await adminClient
        .from('worlds')
        .insert(insertData)
        .select('*')
        .single();

      if (error) {
        throw new DatabaseError('createWorld', error);
      }

      if (!world) {
        throw new ServiceError('INTERNAL_ERROR', 'Failed to create world - no data returned');
      }

      const adaptedWorld = adaptWorldFromDatabase(world);
      logInfo('World created successfully', { worldId: adaptedWorld.id, userId });
      
      return adaptedWorld;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error creating world', error as Error, { userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to create world', error as Error);
    }
  }

  async updateWorld(worldId: string, updates: Partial<World>, userId: string): Promise<World> {
    try {
      logInfo('Updating world', { worldId, userId, action: 'updateWorld' });
      
      if (!adminClient) {
        throw new ServiceError('INTERNAL_ERROR', 'Admin client not available');
      }

      const adaptedUpdates = adaptWorldToDatabase(updates);
      const { data: world, error } = await adminClient
        .from('worlds')
        .update(adaptedUpdates)
        .eq('id', worldId)
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('World', worldId);
        }
        throw new DatabaseError('updateWorld', error);
      }

      if (!world) {
        throw new NotFoundError('World', worldId);
      }

      const adaptedWorld = adaptWorldFromDatabase(world);
      logInfo('World updated successfully', { worldId, userId });
      
      return adaptedWorld;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error updating world', error as Error, { worldId, userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to update world', error as Error);
    }
  }

  async deleteWorld(worldId: string, userId: string): Promise<void> {
    try {
      logInfo('Deleting world', { worldId, userId, action: 'deleteWorld' });
      
      if (!adminClient) {
        throw new ServiceError('INTERNAL_ERROR', 'Admin client not available');
      }

      const { error } = await adminClient
        .from('worlds')
        .delete()
        .eq('id', worldId);

      if (error) {
        throw new DatabaseError('deleteWorld', error);
      }

      logInfo('World deleted successfully', { worldId, userId });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error deleting world', error as Error, { worldId, userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to delete world', error as Error);
    }
  }

  async archiveWorld(worldId: string, userId: string): Promise<World> {
    try {
      logInfo('Archiving world', { worldId, userId, action: 'archiveWorld' });
      
      return await this.updateWorld(worldId, { isArchived: true }, userId);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error archiving world', error as Error, { worldId, userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to archive world', error as Error);
    }
  }
}

/**
 * Simplified Entity Service Implementation
 */
class SimplifiedEntityService implements IEntityService {
  constructor(private worldService: IWorldService) {}

  async getWorldEntities(worldId: string, userId: string): Promise<Entity[]> {
    try {
      logInfo('Fetching world entities', { worldId, userId, action: 'getWorldEntities' });
      
      // Verify world access
      const world = await this.worldService.getWorldById(worldId, userId);
      if (!world) {
        throw new NotFoundError('World', worldId);
      }

      const supabase = await createServerSupabaseClient();
      const { data: entities, error } = await supabase
        .from('entities')
        .select('*, templates(name, category)')
        .eq('world_id', worldId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new DatabaseError('getWorldEntities', error);
      }

      const adaptedEntities = (entities || []).map((entity: any) => adaptEntityFromDatabase(entity));
      logInfo(`Fetched ${adaptedEntities.length} entities`, { worldId, userId });
      
      return adaptedEntities;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error fetching world entities', error as Error, { worldId, userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to fetch entities', error as Error);
    }
  }

  async getEntityById(entityId: string, userId: string): Promise<Entity | null> {
    try {
      logInfo('Fetching entity by ID', { entityId, userId, action: 'getEntityById' });
      
      const supabase = await createServerSupabaseClient();
      const { data: entity, error } = await supabase
        .from('entities')
        .select('*, templates(name, category)')
        .eq('id', entityId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new DatabaseError('getEntityById', error);
      }

      if (!entity) {
        return null;
      }

      const adaptedEntity = adaptEntityFromDatabase(entity);
      logInfo('Entity fetched successfully', { entityId, userId });
      
      return adaptedEntity;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error fetching entity by ID', error as Error, { entityId, userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to fetch entity', error as Error);
    }
  }

  async createEntity(entityData: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Entity> {
    try {
      logInfo('Creating new entity', { userId, worldId: entityData.worldId, action: 'createEntity' });
      
      if (!entityData.worldId) {
        throw new ValidationError('worldId', 'World ID is required');
      }

      // Verify world access
      const world = await this.worldService.getWorldById(entityData.worldId, userId);
      if (!world) {
        throw new NotFoundError('World', entityData.worldId);
      }

      if (!adminClient) {
        throw new ServiceError('INTERNAL_ERROR', 'Admin client not available');
      }

      // Validate required fields
      if (!entityData.name?.trim()) {
        throw new ValidationError('name', 'Entity name is required');
      }

      const adaptedData = adaptEntityToDatabase(entityData);
      
      // Ensure required fields are set
      const insertData = {
        name: entityData.name.trim(),
        world_id: entityData.worldId,
        template_id: entityData.templateId || null,
        folder_id: entityData.folderId || null,
        data: adaptedData?.data || {},
        tags: entityData.tags || [],
        ...adaptedData,
      } as any; // Type assertion for database insert

      const { data: entity, error } = await adminClient
        .from('entities')
        .insert(insertData)
        .select('*, templates(name, category)')
        .single();

      if (error) {
        throw new DatabaseError('createEntity', error);
      }

      if (!entity) {
        throw new ServiceError('INTERNAL_ERROR', 'Failed to create entity - no data returned');
      }

      const adaptedEntity = adaptEntityFromDatabase(entity);
      logInfo('Entity created successfully', { entityId: adaptedEntity.id, userId });
      
      return adaptedEntity;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error creating entity', error as Error, { userId, worldId: entityData.worldId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to create entity', error as Error);
    }
  }

  async updateEntity(entityId: string, updates: Partial<Entity>, userId: string): Promise<Entity> {
    try {
      logInfo('Updating entity', { entityId, userId, action: 'updateEntity' });
      
      if (!adminClient) {
        throw new ServiceError('INTERNAL_ERROR', 'Admin client not available');
      }

      const adaptedUpdates = adaptEntityToDatabase(updates);
      const { data: entity, error } = await adminClient
        .from('entities')
        .update(adaptedUpdates)
        .eq('id', entityId)
        .select('*, templates(name, category)')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Entity', entityId);
        }
        throw new DatabaseError('updateEntity', error);
      }

      if (!entity) {
        throw new NotFoundError('Entity', entityId);
      }

      const adaptedEntity = adaptEntityFromDatabase(entity);
      logInfo('Entity updated successfully', { entityId, userId });
      
      return adaptedEntity;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error updating entity', error as Error, { entityId, userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to update entity', error as Error);
    }
  }

  async deleteEntity(entityId: string, userId: string): Promise<void> {
    try {
      logInfo('Deleting entity', { entityId, userId, action: 'deleteEntity' });
      
      if (!adminClient) {
        throw new ServiceError('INTERNAL_ERROR', 'Admin client not available');
      }

      const { error } = await adminClient
        .from('entities')
        .delete()
        .eq('id', entityId);

      if (error) {
        throw new DatabaseError('deleteEntity', error);
      }

      logInfo('Entity deleted successfully', { entityId, userId });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error deleting entity', error as Error, { entityId, userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to delete entity', error as Error);
    }
  }
}

/**
 * Simplified Relationship Service Implementation
 */
class SimplifiedRelationshipService implements IRelationshipService {
  async getWorldRelationships(worldId: string, userId: string): Promise<RelationshipRow[]> {
    try {
      logInfo('Fetching world relationships', { worldId, userId, action: 'getWorldRelationships' });

      const supabase = await createServerSupabaseClient();
      const { data: relationships, error } = await supabase
        .from('relationships')
        .select('id, world_id, from_entity_id, to_entity_id, relationship_type, description, metadata, created_at, updated_at')
        .eq('world_id', worldId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new DatabaseError('getWorldRelationships', error);
      }

      const adaptedRelationships = (relationships || []).map((rel: any) => ({
        id: rel.id,
        worldId: rel.world_id,
        from: rel.from_entity_id,
        to: rel.to_entity_id,
        relationshipType: rel.relationship_type,
        description: rel.description || undefined,
        metadata: rel.metadata ? rel.metadata as any : undefined,
        strength: (rel as any).strength || 5, // Default strength if column doesn't exist
        isBidirectional: (rel as any).is_bidirectional || false, // Default bidirectional if column doesn't exist
        createdAt: rel.created_at,
        updatedAt: rel.updated_at,
      }));

      logInfo(`Fetched ${adaptedRelationships.length} relationships`, { worldId, userId });
      return adaptedRelationships;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error fetching world relationships', error as Error, { worldId, userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to fetch relationships', error as Error);
    }
  }

  async getRelationshipById(relationshipId: string, userId: string): Promise<RelationshipRow | null> {
    try {
      logInfo('Fetching relationship by ID', { relationshipId, userId, action: 'getRelationshipById' });

      const supabase = await createServerSupabaseClient();
      const { data: relationship, error } = await supabase
        .from('relationships')
        .select('id, world_id, from_entity_id, to_entity_id, relationship_type, description, metadata, created_at, updated_at')
        .eq('id', relationshipId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new DatabaseError('getRelationshipById', error);
      }

      if (!relationship) {
        return null;
      }

      const adaptedRelationship = {
        id: relationship.id,
        worldId: relationship.world_id,
        from: relationship.from_entity_id,
        to: relationship.to_entity_id,
        relationshipType: relationship.relationship_type,
        description: relationship.description || undefined,
        metadata: relationship.metadata ? relationship.metadata as any : undefined,
        strength: (relationship as any).strength || 5, // Default strength if column doesn't exist
        isBidirectional: (relationship as any).is_bidirectional || false, // Default bidirectional if column doesn't exist
        createdAt: relationship.created_at,
        updatedAt: relationship.updated_at,
      };

      logInfo('Relationship fetched successfully', { relationshipId, userId });
      return adaptedRelationship;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error fetching relationship by ID', error as Error, { relationshipId, userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to fetch relationship', error as Error);
    }
  }

  async createRelationship(relationshipData: Partial<RelationshipRow>, userId: string): Promise<RelationshipRow> {
    try {
      logInfo('Creating relationship', { userId, action: 'createRelationship' });

      // Validate required fields
      if (!relationshipData.worldId) {
        throw new ValidationError('worldId', 'World ID is required');
      }
      if (!relationshipData.from) {
        throw new ValidationError('from', 'From entity ID is required');
      }
      if (!relationshipData.to) {
        throw new ValidationError('to', 'To entity ID is required');
      }
      if (!relationshipData.relationshipType) {
        throw new ValidationError('relationshipType', 'Relationship type is required');
      }
      if (relationshipData.from === relationshipData.to) {
        throw new ValidationError('entities', 'Cannot create relationship between the same entity');
      }

      if (!adminClient) {
        throw new ServiceError('INTERNAL_ERROR', 'Admin client not available');
      }

      const insertData = {
        world_id: relationshipData.worldId,
        from_entity_id: relationshipData.from,
        to_entity_id: relationshipData.to,
        relationship_type: relationshipData.relationshipType,
        description: relationshipData.description || null,
        metadata: relationshipData.metadata || {},
      };

      const { data: relationship, error } = await adminClient
        .from('relationships')
        .insert(insertData)
        .select('*')
        .single();

      if (error) {
        throw new DatabaseError('createRelationship', error);
      }

      if (!relationship) {
        throw new ServiceError('INTERNAL_ERROR', 'Relationship creation failed - no data returned');
      }

      const adaptedRelationship = {
        id: relationship.id,
        worldId: relationship.world_id,
        from: relationship.from_entity_id,
        to: relationship.to_entity_id,
        relationshipType: relationship.relationship_type,
        description: relationship.description || undefined,
        metadata: relationship.metadata ? relationship.metadata as any : undefined,
        strength: (relationship as any).strength || 5, // Default strength if column doesn't exist
        isBidirectional: (relationship as any).is_bidirectional || false, // Default bidirectional if column doesn't exist
        createdAt: relationship.created_at,
        updatedAt: relationship.updated_at,
      };

      logInfo('Relationship created successfully', { relationshipId: relationship.id, userId });
      return adaptedRelationship;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error creating relationship', error as Error, { userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to create relationship', error as Error);
    }
  }

  async updateRelationship(relationshipId: string, updates: Partial<RelationshipRow>, userId: string): Promise<RelationshipRow> {
    try {
      logInfo('Updating relationship', { relationshipId, userId, action: 'updateRelationship' });

      if (!adminClient) {
        throw new ServiceError('INTERNAL_ERROR', 'Admin client not available');
      }

      const updateData: Record<string, any> = {};
      if (updates.relationshipType) updateData.relationship_type = updates.relationshipType;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

      const { data: relationship, error } = await adminClient
        .from('relationships')
        .update(updateData)
        .eq('id', relationshipId)
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Relationship', relationshipId);
        }
        throw new DatabaseError('updateRelationship', error);
      }

      if (!relationship) {
        throw new NotFoundError('Relationship', relationshipId);
      }

      const adaptedRelationship = {
        id: relationship.id,
        worldId: relationship.world_id,
        from: relationship.from_entity_id,
        to: relationship.to_entity_id,
        relationshipType: relationship.relationship_type,
        description: relationship.description || undefined,
        metadata: relationship.metadata ? relationship.metadata as any : undefined,
        strength: (relationship as any).strength || 5, // Default strength if column doesn't exist
        isBidirectional: (relationship as any).is_bidirectional || false, // Default bidirectional if column doesn't exist
        createdAt: relationship.created_at,
        updatedAt: relationship.updated_at,
      };

      logInfo('Relationship updated successfully', { relationshipId, userId });
      return adaptedRelationship;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error updating relationship', error as Error, { relationshipId, userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to update relationship', error as Error);
    }
  }

  async deleteRelationship(relationshipId: string, userId: string): Promise<void> {
    try {
      logInfo('Deleting relationship', { relationshipId, userId, action: 'deleteRelationship' });

      if (!adminClient) {
        throw new ServiceError('INTERNAL_ERROR', 'Admin client not available');
      }

      const { error } = await adminClient
        .from('relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) {
        throw new DatabaseError('deleteRelationship', error);
      }

      logInfo('Relationship deleted successfully', { relationshipId, userId });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      logError('Error deleting relationship', error as Error, { relationshipId, userId });
      throw new ServiceError('INTERNAL_ERROR', 'Failed to delete relationship', error as Error);
    }
  }
}

/**
 * Simplified Unified Service Layer
 */
export class SimplifiedUnifiedServiceLayer implements IServiceLayer {
  public readonly worlds: IWorldService;
  public readonly entities: IEntityService;
  public readonly templates: ITemplateService;
  public readonly folders: IFolderService;
  public readonly relationships: IRelationshipService;

  constructor() {
    // Initialize services
    this.worlds = new SimplifiedWorldService();
    this.entities = new SimplifiedEntityService(this.worlds);
    this.relationships = new SimplifiedRelationshipService();

    // For now, delegate to existing services for templates and folders
    const worldService = new WorldService();
    this.templates = worldService as any;
    this.folders = worldService as any;
  }
}

// Export instance
export const simplifiedUnifiedService = new SimplifiedUnifiedServiceLayer();