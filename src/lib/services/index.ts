/**
 * Service Layer Index - Unified access to all services
 * 
 * This provides a single import point for all services and maintains backward compatibility
 * during the migration from the monolithic service.
 */

// Import the individual services first
import { worldService } from './worldService';
import { entityService } from './entityService';
import { folderService } from './folderService';
import { supabaseWorldService } from './supabaseWorldService';

// New focused services
export { worldService, WorldService } from './worldService';
export { entityService, EntityService } from './entityService';
export { folderService, FolderService } from './folderService';

// Legacy service (deprecated - will be removed after full migration)
export { supabaseWorldService } from './supabaseWorldService';

/**
 * Unified service interface - provides access to all domain services
 * This maintains API compatibility while services are being split
 */
class UnifiedService {
  // World operations
  async getUserWorlds(userId: string) { return worldService.getUserWorlds(userId); }
  async getWorldById(worldId: string, userId: string) { return worldService.getWorldById(worldId, userId); }
  async createWorld(data: any, userId: string) { return worldService.createWorld(data, userId); }
  async updateWorld(worldId: string, data: any, userId: string) { return worldService.updateWorld(worldId, data, userId); }
  async deleteWorld(worldId: string, userId: string) { return worldService.deleteWorld(worldId, userId); }
  async archiveWorld(worldId: string, userId: string, archived?: boolean) { return worldService.archiveWorld(worldId, userId, archived); }

  // Entity operations
  async getWorldEntities(worldId: string, userId: string) { return entityService.getWorldEntities(worldId, userId); }
  async createEntity(worldId: string, data: any, userId: string) { return entityService.createEntity(worldId, data, userId); }
  async getEntityById(entityId: string, userId: string) { return entityService.getEntityById(entityId, userId); }
  async updateEntity(entityId: string, data: any, userId: string) { return entityService.updateEntity(entityId, data, userId); }
  async deleteEntity(entityId: string, userId: string) { return entityService.deleteEntity(entityId, userId); }

  // Folder operations
  async getWorldFolders(worldId: string, userId: string) { return folderService.getWorldFolders(worldId, userId); }
  async createFolder(worldId: string, data: any, userId: string) { return folderService.createFolder(worldId, data, userId); }
  async getFolderById(folderId: string, userId: string) { return folderService.getFolderById(folderId, userId); }
  async updateFolder(folderId: string, data: any, userId: string) { return folderService.updateFolder(folderId, data, userId); }
  async deleteFolder(folderId: string, userId: string) { return folderService.deleteFolder(folderId, userId); }

  // Legacy operations - delegate to old service temporarily
  async getWorldRelationships(worldId: string, userId: string) { return supabaseWorldService.getWorldRelationships(worldId, userId); }
  async createRelationship(worldId: string, data: any, userId: string) { return supabaseWorldService.createRelationship(worldId, data, userId); }
  async updateRelationship(relationshipId: string, data: any, userId: string) { return supabaseWorldService.updateRelationship(relationshipId, data, userId); }
  async deleteRelationship(relationshipId: string, userId: string) { return supabaseWorldService.deleteRelationship(relationshipId, userId); }

  async getWorldTemplates(worldId: string) { return supabaseWorldService.getWorldTemplates(worldId); }
  async getSystemTemplates() { return supabaseWorldService.getSystemTemplates(); }
  async createTemplate(worldId: string, data: any) { return supabaseWorldService.createTemplate(worldId, data); }
  async updateTemplate(templateId: string, data: any, userId: string) { return supabaseWorldService.updateTemplate(templateId, data, userId); }
  async deleteTemplate(templateId: string, userId: string) { return supabaseWorldService.deleteTemplate(templateId, userId); }

  async getWorldMembers(worldId: string, userId: string) { return supabaseWorldService.getWorldMembers(worldId, userId); }
  async updateMemberRole(worldId: string, memberId: string, role: string, userId: string) { return supabaseWorldService.updateMemberRole(worldId, memberId, role, userId); }
  async removeMember(worldId: string, memberId: string, userId: string) { return supabaseWorldService.removeMember(worldId, memberId, userId); }
}

// Export singleton unified service for backward compatibility
export const unifiedService = new UnifiedService();