import { supabaseWorldService } from './supabaseWorldService';
import { World, Entity, Template, Folder, TemplateField } from '../types';

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
      return await supabaseWorldService.getUserWorlds(userId);
    } catch (error) {
      console.error('Error fetching user worlds:', error);
      throw new Error('Failed to fetch worlds');
    }
  }

  /**
   * Get a specific world by ID
   */
  async getWorldById(worldId: string, userId: string): Promise<World | null> {
    try {
      return await supabaseWorldService.getWorldById(worldId, userId);
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
  }, userId: string): Promise<World> {
    try {
      return await supabaseWorldService.createWorld(data, userId);
    } catch (error) {
      console.error('Error creating world:', error);
      throw new Error('Failed to create world');
    }
  }

  /**
   * Update a world
   */
  async updateWorld(worldId: string, data: Partial<World>, userId: string): Promise<World> {
    try {
      return await supabaseWorldService.updateWorld(worldId, data, userId);
    } catch (error) {
      console.error('Error updating world:', error);
      throw new Error('Failed to update world');
    }
  }

  /**
   * Delete a world
   */
  async deleteWorld(worldId: string, userId: string): Promise<void> {
    try {
      await supabaseWorldService.deleteWorld(worldId, userId);
    } catch (error) {
      console.error('Error deleting world:', error);
      throw new Error('Failed to delete world');
    }
  }

  /**
   * Archive/unarchive a world
   */
  async archiveWorld(worldId: string, userId: string, archived: boolean = true): Promise<void> {
    try {
      await supabaseWorldService.archiveWorld(worldId, userId, archived);
    } catch (error) {
      console.error('Error archiving world:', error);
      throw new Error('Failed to archive world');
    }
  }

  /**
   * Get entities for a world
   */
  async getWorldEntities(worldId: string, userId: string): Promise<Entity[]> {
    try {
      return await supabaseWorldService.getWorldEntities(worldId, userId);
    } catch (error) {
      console.error('Error fetching world entities:', error);
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
  }, userId: string): Promise<Entity> {
    try {
      return await supabaseWorldService.createEntity(worldId, data, userId);
    } catch (error) {
      console.error('Error creating entity:', error);
      throw new Error('Failed to create entity');
    }
  }

  /** Get a single entity by ID */
  async getEntityById(entityId: string, userId: string): Promise<Entity | null> {
    try {
      return await supabaseWorldService.getEntityById(entityId, userId)
    } catch (error) {
      console.error('Error fetching entity:', error)
      throw new Error('Failed to fetch entity')
    }
  }

  /** Update an entity */
  async updateEntity(entityId: string, data: Partial<Entity>, userId: string): Promise<Entity> {
    try {
      // Map domain partial to storage schema fields
      const mapped: any = {}
      if (data.name !== undefined) mapped.name = data.name
      if (data.templateId !== undefined) mapped.templateId = data.templateId ?? null
      if (data.folderId !== undefined) mapped.folderId = data.folderId ?? null
      if (data.fields !== undefined) mapped.fields = data.fields
      if (data.tags !== undefined) mapped.tags = data.tags ?? null
      return await supabaseWorldService.updateEntity(entityId, mapped, userId)
    } catch (error) {
      console.error('Error updating entity:', error)
      throw new Error('Failed to update entity')
    }
  }

  /** Delete an entity */
  async deleteEntity(entityId: string, userId: string): Promise<void> {
    try {
      await supabaseWorldService.deleteEntity(entityId, userId)
    } catch (error) {
      console.error('Error deleting entity:', error)
      throw new Error('Failed to delete entity')
    }
  }

  /**
   * Get templates for a world (including system templates)
   */
  async getWorldTemplates(worldId: string): Promise<Template[]> {
    try {
      return await supabaseWorldService.getWorldTemplates(worldId);
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
      return await supabaseWorldService.getSystemTemplates();
    } catch (error) {
      console.error('Error fetching system templates:', error);
      throw new Error('Failed to fetch system templates');
    }
  }

  /**
   * Get folders for a world
   */
  async getWorldFolders(worldId: string, userId: string): Promise<Folder[]> {
    try {
      return await supabaseWorldService.getWorldFolders(worldId, userId);
    } catch (error) {
      console.error('Error fetching world folders:', error);
      throw new Error('Failed to fetch folders');
    }
  }

  /** Create a folder */
  async createFolder(worldId: string, data: { name: string; description?: string; color?: string }, userId: string): Promise<Folder> {
    try {
      return await supabaseWorldService.createFolder(worldId, data, userId)
    } catch (error) {
      console.error('Error creating folder:', error)
      throw new Error('Failed to create folder')
    }
  }

  /** Update a folder */
  async updateFolder(folderId: string, data: { name?: string; description?: string; color?: string | null }, userId: string): Promise<Folder> {
    try {
      return await supabaseWorldService.updateFolder(folderId, data, userId)
    } catch (error) {
      console.error('Error updating folder:', error)
      throw new Error('Failed to update folder')
    }
  }

  /** Delete a folder */
  async deleteFolder(folderId: string, userId: string): Promise<void> {
    try {
      await supabaseWorldService.deleteFolder(folderId, userId)
    } catch (error) {
      console.error('Error deleting folder:', error)
      throw new Error('Failed to delete folder')
    }
  }

  /** Create a new template */
  async createTemplate(worldId: string, data: {
    name: string;
    description?: string;
    icon?: string;
    category?: string;
    fields: TemplateField[];
  }): Promise<Template> {
    try {
      return await supabaseWorldService.createTemplate(worldId, data);
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error('Failed to create template');
    }
  }

  /** Update a template */
  async updateTemplate(templateId: string, data: Partial<Template>, userId: string): Promise<Template> {
    try {
      return await supabaseWorldService.updateTemplate(templateId, data, userId);
    } catch (error) {
      console.error('Error updating template:', error);
      throw new Error('Failed to update template');
    }
  }

  /** Delete a template */
  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    try {
      await supabaseWorldService.deleteTemplate(templateId, userId);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw new Error('Failed to delete template');
    }
  }
}

// Export singleton instance
export const worldService = new WorldService();
