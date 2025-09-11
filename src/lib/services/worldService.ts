import { localDb } from '../database/local';
import { World, Entity, Template } from '../types';

/**
 * World Service - Adapter layer between React components and database
 * Provides a consistent API for world-related operations regardless of backend
 */
export class WorldService {
  /**
   * Get all worlds for the current user
   */
  async getUserWorlds(userId: string): Promise<World[]> {
    try {
      const dbWorlds = await localDb.getWorldsByUser(userId);
      
      return dbWorlds.map(dbWorld => ({
        id: dbWorld.id,
        name: dbWorld.name,
        summary: dbWorld.description || '',
        entityCount: parseInt(dbWorld.entity_count) || 0,
        updatedAt: dbWorld.updated_at,
        isArchived: dbWorld.is_archived || false,
        archivedAt: dbWorld.is_archived ? dbWorld.updated_at : undefined, // Use updated_at as archived time if archived
        coverImage: dbWorld.cover_image,
        isPublic: dbWorld.is_public || false,
        settings: dbWorld.settings || {}
      }));
    } catch (error) {
      console.error('Error fetching user worlds:', error);
      throw new Error('Failed to fetch worlds');
    }
  }

  /**
   * Get a specific world by ID
   */
  async getWorldById(worldId: string, _userId: string): Promise<World | null> {
    try {
  const dbWorld = await localDb.getWorldById(worldId, _userId);
      
      if (!dbWorld) return null;

      return {
        id: dbWorld.id,
        name: dbWorld.name,
        summary: dbWorld.description || '',
        entityCount: parseInt(dbWorld.entity_count) || 0,
        updatedAt: dbWorld.updated_at,
        isArchived: dbWorld.is_archived || false,
        archivedAt: dbWorld.is_archived ? dbWorld.updated_at : undefined, // Use updated_at as archived time if archived
        coverImage: dbWorld.cover_image,
        isPublic: dbWorld.is_public || false,
        settings: dbWorld.settings || {}
      };
    } catch (error) {
      console.error('Error fetching world:', error);
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
  }, _userId: string): Promise<World> {
    try {
      const dbWorld = await localDb.createWorld(
        data.name,
        data.description || '',
        _userId
      );

      return {
        id: dbWorld.id,
        name: dbWorld.name,
        summary: dbWorld.description || '',
        entityCount: 0,
        updatedAt: dbWorld.updated_at,
        isArchived: false,
        coverImage: dbWorld.cover_image,
        isPublic: dbWorld.is_public || false,
        settings: dbWorld.settings || {}
      };
    } catch (error) {
      console.error('Error creating world:', error);
      throw new Error('Failed to create world');
    }
  }

  /**
   * Update a world
   */
  async updateWorld(worldId: string, data: Partial<World>): Promise<World> {
    try {
      const updateData = {
        name: data.name,
        description: data.summary,
        is_public: data.isPublic,
        is_archived: data.isArchived,
        cover_image: data.coverImage,
        settings: data.settings
      };

      const dbWorld = await localDb.updateWorld(worldId, updateData);

      return {
        id: dbWorld.id,
        name: dbWorld.name,
        summary: dbWorld.description || '',
        entityCount: parseInt(dbWorld.entity_count) || 0,
        updatedAt: dbWorld.updated_at,
        isArchived: dbWorld.is_archived || false,
        archivedAt: dbWorld.is_archived ? dbWorld.updated_at : undefined, // Use updated_at as archived time if archived
        coverImage: dbWorld.cover_image,
        isPublic: dbWorld.is_public || false,
        settings: dbWorld.settings || {}
      };
    } catch (error) {
      console.error('Error updating world:', error);
      throw new Error('Failed to update world');
    }
  }

  /**
   * Delete a world
   */
  async deleteWorld(worldId: string): Promise<void> {
    try {
      await localDb.deleteWorld(worldId);
    } catch (error) {
      console.error('Error deleting world:', error);
      throw new Error('Failed to delete world');
    }
  }

  /**
   * Archive/unarchive a world
   */
  async archiveWorld(worldId: string, archived: boolean = true): Promise<void> {
    try {
      await localDb.updateWorld(worldId, { is_archived: archived });
    } catch (error) {
      console.error('Error archiving world:', error);
      throw new Error('Failed to archive world');
    }
  }

  /**
   * Get entities for a world
   */
  async getWorldEntities(worldId: string): Promise<Entity[]> {
    try {
      const dbEntities = await localDb.getEntitiesByWorld(worldId);
      
      return dbEntities.map(dbEntity => ({
        id: dbEntity.id,
        worldId: dbEntity.world_id,
        folderId: dbEntity.folder_id || undefined,
        templateId: dbEntity.template_id || undefined,
        name: dbEntity.name,
        summary: dbEntity.description || '',
        fields: dbEntity.data || {},
        links: [], // Will be populated by relationship service
        updatedAt: dbEntity.updated_at,
        tags: dbEntity.tags || [],
        templateName: dbEntity.template_name,
        templateCategory: dbEntity.template_category
      }));
    } catch (error) {
      console.error('Error fetching world entities:', error);
      throw new Error('Failed to fetch entities');
    }
  }

  /**
   * Get templates for a world (including system templates)
   */
  async getWorldTemplates(worldId: string): Promise<Template[]> {
    try {
      const dbTemplates = await localDb.getAllTemplates(worldId);
      
      return dbTemplates.map(dbTemplate => ({
        id: dbTemplate.id,
        worldId: dbTemplate.world_id || worldId,
        folderId: dbTemplate.folder_id,
        name: dbTemplate.name,
        description: dbTemplate.description || '',
        icon: dbTemplate.icon,
        category: dbTemplate.category || 'General',
        fields: dbTemplate.fields || [],
        isSystem: dbTemplate.is_system || false
      }));
    } catch (error) {
      console.error('Error fetching world templates:', error);
      throw new Error('Failed to fetch templates');
    }
  }

  /**
   * Get system templates (available to all worlds)
   */
  async getSystemTemplates(): Promise<Template[]> {
    try {
      const dbTemplates = await localDb.getSystemTemplates();
      
      return dbTemplates.map(dbTemplate => ({
        id: dbTemplate.id,
        worldId: '', // System templates don't belong to a specific world
        folderId: dbTemplate.folder_id,
        name: dbTemplate.name,
        description: dbTemplate.description || '',
        icon: dbTemplate.icon,
        category: dbTemplate.category || 'General',
        fields: dbTemplate.fields || [],
        isSystem: true
      }));
    } catch (error) {
      console.error('Error fetching system templates:', error);
      throw new Error('Failed to fetch system templates');
    }
  }
}

// Export singleton instance
export const worldService = new WorldService();
