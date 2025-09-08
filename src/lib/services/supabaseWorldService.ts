import type { Database } from '../supabase/types.generated';
import { World, Entity, Template, TemplateField, Json } from '../types';
import { createClient as createServerSupabaseClient } from '../supabase/server';
// Use domain Json type for serialization

/**
 * Supabase World Service - Database operations using Supabase
 */
export class SupabaseWorldService {
  /**
   * Get all worlds for the current user
   */
  async getUserWorlds(userId: string): Promise<World[]> {
    try {
      const supabase = await createServerSupabaseClient()
      const { data: worlds, error } = await supabase
        .from('worlds')
        .select(`
          *,
          entities(count),
          world_members(count)
        `)
        .or(`owner_id.eq.${userId},world_members.user_id.eq.${userId}`)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching worlds:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return worlds?.map(world => ({
        id: world.id,
        name: world.name,
        summary: world.description || '',
        entityCount: world.entities?.length || 0,
        updatedAt: world.updated_at,
        isArchived: world.is_archived || false,
        archivedAt: world.is_archived ? world.updated_at : undefined,
        coverImage: undefined, // Not in current schema
        isPublic: world.is_public || false,
        settings: (world.settings as Record<string, Json>) || {}
      })) || [];
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
      const supabase = await createServerSupabaseClient()
      const { data: world, error } = await supabase
        .from('worlds')
        .select(`
          *,
          entities(count)
        `)
        .eq('id', worldId)
        .or(`owner_id.eq.${userId},is_public.eq.true,world_members.user_id.eq.${userId}`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Supabase error fetching world:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        id: world.id,
        name: world.name,
        summary: world.description || '',
        entityCount: world.entities?.length || 0,
        updatedAt: world.updated_at,
        isArchived: world.is_archived || false,
        archivedAt: world.is_archived ? world.updated_at : undefined,
        coverImage: undefined, // Not in current schema
        isPublic: world.is_public || false,
        settings: (world.settings as Record<string, Json>) || {}
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
  }, userId: string): Promise<World> {
    try {
      const supabase = await createServerSupabaseClient()
      const { data: world, error } = await supabase
        .from('worlds')
        .insert({
          name: data.name,
          description: data.description || '',
          owner_id: userId,
          is_public: data.isPublic || false,
          is_archived: false,
          settings: {} as Json
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating world:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        id: world.id,
        name: world.name,
        summary: world.description || '',
        entityCount: 0,
        updatedAt: world.updated_at,
        isArchived: false,
        coverImage: undefined, // Not in current schema
        isPublic: world.is_public || false,
        settings: (world.settings as Record<string, any>) || {}
      };
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
      const supabase = await createServerSupabaseClient()
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.summary !== undefined) updateData.description = data.summary;
      if (data.isPublic !== undefined) updateData.is_public = data.isPublic;
      if (data.isArchived !== undefined) updateData.is_archived = data.isArchived;
      if (data.settings !== undefined) updateData.settings = data.settings as Json;

      const { data: world, error } = await supabase
        .from('worlds')
        .update(updateData)
        .eq('id', worldId)
        .eq('owner_id', userId) // Only owner can update
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating world:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        id: world.id,
        name: world.name,
        summary: world.description || '',
        entityCount: 0, // We'd need another query to get this
        updatedAt: world.updated_at,
        isArchived: world.is_archived || false,
        archivedAt: world.is_archived ? world.updated_at : undefined,
        coverImage: undefined, // Not in current schema
        isPublic: world.is_public || false,
        settings: (world.settings as Record<string, any>) || {}
      };
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
      const supabase = await createServerSupabaseClient()
      const { error } = await supabase
        .from('worlds')
        .delete()
        .eq('id', worldId)
        .eq('owner_id', userId); // Only owner can delete

      if (error) {
        console.error('Supabase error deleting world:', error);
        throw new Error(`Database error: ${error.message}`);
      }
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
      const supabase = await createServerSupabaseClient()
      const { error } = await supabase
        .from('worlds')
        .update({ is_archived: archived })
        .eq('id', worldId)
        .eq('owner_id', userId); // Only owner can archive

      if (error) {
        console.error('Supabase error archiving world:', error);
        throw new Error(`Database error: ${error.message}`);
      }
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
      // First verify user has access to this world
      const world = await this.getWorldById(worldId, userId);
      if (!world) {
        throw new Error('World not found or access denied');
      }

      const supabase = await createServerSupabaseClient()
      const { data: entities, error } = await supabase
        .from('entities')
        .select(`
          *,
          templates(name, category)
        `)
        .eq('world_id', worldId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching entities:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return entities?.map(entity => ({
        id: entity.id,
        worldId: entity.world_id,
        folderId: entity.folder_id || undefined,
        templateId: entity.template_id || undefined,
        name: entity.name,
        summary: '', // Entities don't have description in current schema
        fields: (entity.data as Record<string, unknown>) || {},
        links: [], // Will be populated by relationship service
        updatedAt: entity.updated_at,
        tags: entity.tags || [],
        templateName: entity.templates?.name || undefined,
        templateCategory: entity.templates?.category || undefined
      })) || [];
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
    // Access check by fetching world
    const world = await this.getWorldById(worldId, userId)
    if (!world) throw new Error('World not found or access denied')

    const supabase = await createServerSupabaseClient()
    const { data: row, error } = await supabase
      .from('entities')
      .insert({
        world_id: worldId,
        template_id: data.templateId || null,
        folder_id: data.folderId || null,
        name: data.name,
        data: (data.fields ?? {}) as Json,
        tags: data.tags || [],
      })
      .select('*')
      .single()

    if (error) {
      console.error('Supabase error creating entity:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    return {
      id: row.id,
      worldId: row.world_id,
      folderId: row.folder_id || undefined,
      templateId: row.template_id || undefined,
      name: row.name,
      summary: '',
      fields: (row.data as Record<string, unknown>) || {},
      links: [],
      updatedAt: row.updated_at,
      tags: row.tags || [],
    }
  }

  /** Get a single entity by ID (with access check) */
  async getEntityById(entityId: string, userId: string): Promise<Entity | null> {
    const supabase = await createServerSupabaseClient()
    const { data: row, error } = await supabase
      .from('entities')
      .select('*')
      .eq('id', entityId)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') return null
      console.error('Supabase error fetching entity:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    // Access check via world
    const world = await this.getWorldById(row.world_id, userId)
    if (!world) return null

    return {
      id: row.id,
      worldId: row.world_id,
      folderId: row.folder_id || undefined,
      templateId: row.template_id || undefined,
      name: row.name,
      summary: '',
      fields: (row.data as Record<string, unknown>) || {},
      links: [],
      updatedAt: row.updated_at,
      tags: row.tags || [],
    }
  }

  /** Update an entity by ID */
  async updateEntity(entityId: string, data: Partial<{
    name: string
    templateId: string | null
    folderId: string | null
    fields: Record<string, unknown>
    tags: string[] | null
  }>, userId: string): Promise<Entity> {
    const supabase = await createServerSupabaseClient()

    // Fetch to determine world and access
    const current = await this.getEntityById(entityId, userId)
    if (!current) throw new Error('Entity not found or access denied')

    const payload: any = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.templateId !== undefined) payload.template_id = data.templateId
    if (data.folderId !== undefined) payload.folder_id = data.folderId
    if (data.fields !== undefined) payload.data = (data.fields as unknown as Json) ?? {}
    if (data.tags !== undefined) payload.tags = data.tags

    const { data: row, error } = await supabase
      .from('entities')
      .update(payload)
      .eq('id', entityId)
      .select('*')
      .single()

    if (error) {
      console.error('Supabase error updating entity:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    return {
      id: row.id,
      worldId: row.world_id,
      folderId: row.folder_id || undefined,
      templateId: row.template_id || undefined,
      name: row.name,
      summary: '',
      fields: (row.data as Record<string, unknown>) || {},
      links: [],
      updatedAt: row.updated_at,
      tags: row.tags || [],
    }
  }

  /** Delete an entity by ID */
  async deleteEntity(entityId: string, userId: string): Promise<void> {
    // Access check first
    const current = await this.getEntityById(entityId, userId)
    if (!current) throw new Error('Entity not found or access denied')

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('entities')
      .delete()
      .eq('id', entityId)

    if (error) {
      console.error('Supabase error deleting entity:', error)
      throw new Error(`Database error: ${error.message}`)
    }
  }

  /**
   * Get templates for a world (including system templates)
   */
  async getWorldTemplates(worldId: string): Promise<Template[]> {
    try {
      const supabase = await createServerSupabaseClient()
      const { data: templates, error } = await supabase
        .from('templates')
        .select('*')
        .or(`is_system.eq.true,world_id.eq.${worldId}`)
        .order('name');

      if (error) {
        console.error('Supabase error fetching templates:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Deduplicate by name, preferring world-specific overrides over system versions
      const byName = new Map<string, any>()
      const list = templates || []
      // First pass: insert world-specific overrides for this world
      for (const t of list) {
        const key = (t.name || '').toLowerCase()
        if (t.world_id === worldId) {
          byName.set(key, t)
        }
      }
      // Second pass: add system templates only if no override present
      for (const t of list) {
        const key = (t.name || '').toLowerCase()
        if (!byName.has(key)) {
          byName.set(key, t)
        }
      }

      const deduped = Array.from(byName.values())
      // Map to domain type
      return deduped.map(template => ({
        id: template.id,
        worldId: template.world_id || worldId,
        folderId: undefined,
        name: template.name,
        description: template.description || '',
        icon: template.icon || undefined,
        category: template.category || 'General',
        fields: (template.fields as any[]) || [],
        isSystem: template.is_system || false
      }))
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
      const supabase = await createServerSupabaseClient()
      const { data: templates, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_system', true)
        .order('name');

      if (error) {
        console.error('Supabase error fetching system templates:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return templates?.map(template => ({
        id: template.id,
        worldId: '', // System templates don't belong to a specific world
        folderId: undefined,
        name: template.name,
        description: template.description || '',
        icon: template.icon || undefined,
        category: template.category || 'General',
        fields: (template.fields as any[]) || [],
        isSystem: true
      })) || [];
    } catch (error) {
      console.error('Error fetching system templates:', error);
      throw new Error('Failed to fetch system templates');
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
    const supabase = await createServerSupabaseClient()
    const { data: row, error } = await supabase
      .from('templates')
      .insert({
        world_id: worldId,
        name: data.name,
        description: data.description || '',
        icon: data.icon || 'file-text',
        category: data.category || 'general',
        fields: ((data.fields ?? []) as unknown) as Json,
        is_system: false,
      })
      .select('*')
      .single()
    if (error) {
      console.error('Supabase error creating template:', error)
      throw new Error(`Database error: ${error.message}`)
    }
    return {
      id: row.id,
      worldId: row.world_id || worldId,
      name: row.name,
      description: row.description || '',
      icon: row.icon || undefined,
      category: row.category || 'general',
      fields: (row.fields as TemplateField[]) || [],
      isSystem: row.is_system || false,
    }
  }

  /** Update a template. If the template is a system template, create/update a world-specific override. */
  async updateTemplate(templateId: string, data: Partial<Template>, userId: string): Promise<Template> {
    const supabase = await createServerSupabaseClient()

    // Fetch the current template row to determine if it is system/global
    const { data: current, error: fetchErr } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()
    if (fetchErr) {
      console.error('Supabase error fetching template:', fetchErr)
      throw new Error(`Database error: ${fetchErr.message}`)
    }

    // Helper to map DB row to domain Template
    const mapRow = (row: any): Template => ({
      id: row.id,
      worldId: row.world_id || '',
      name: row.name,
      description: row.description || '',
      icon: row.icon || undefined,
      category: row.category || 'general',
      fields: (row.fields as TemplateField[]) || [],
      isSystem: row.is_system || false,
    })

    // Build patch from incoming data
    const patch: Partial<{ name: string; description?: string | null; icon?: string | null; category?: string | null; fields?: Json }> = {}
    if (data.name !== undefined) patch.name = data.name
    if (data.description !== undefined) patch.description = data.description
    if (data.icon !== undefined) patch.icon = data.icon
    if (data.category !== undefined) patch.category = data.category
    if ((data as Partial<Template>).fields !== undefined) patch.fields = (data as any).fields as unknown as Json

    // If editing a system template, create or update a world-specific override
    if (current.is_system) {
      const worldId = (data as any)?.worldId
      if (!worldId) {
        throw new Error('Editing a system template requires a worldId to create a world-specific version')
      }

      // Verify user has access to that world
      const world = await this.getWorldById(worldId, userId)
      if (!world) {
        throw new Error('World not found or access denied')
      }

      // Try to find an existing world-specific override (match by name for now)
      const { data: overrides, error: ovErr } = await supabase
        .from('templates')
        .select('*')
        .eq('world_id', worldId)
        .eq('name', data.name ?? current.name)
        .limit(1)
      if (ovErr) {
        console.error('Supabase error finding template override:', ovErr)
        throw new Error(`Database error: ${ovErr.message}`)
      }

      if (overrides && overrides.length > 0) {
        // Update existing override
        const targetId = overrides[0].id
        const { data: row, error } = await supabase
          .from('templates')
          .update(patch)
          .eq('id', targetId)
          .select('*')
          .single()
        if (error) {
          console.error('Supabase error updating template override:', error)
          throw new Error(`Database error: ${error.message}`)
        }
        return mapRow(row)
      }

      // Insert new world-specific copy seeded from system template, then apply patch via insert data
      const insertPayload: any = {
        name: data.name ?? current.name,
        description: data.description ?? current.description ?? null,
        icon: data.icon ?? current.icon ?? null,
        category: data.category ?? current.category ?? null,
        fields: (data as any).fields !== undefined ? ((data as any).fields as unknown as Json) : (current.fields as Json),
        is_system: false,
        world_id: worldId,
      }
      const { data: ins, error: insErr } = await supabase
        .from('templates')
        .insert(insertPayload)
        .select('*')
        .single()
      if (insErr) {
        console.error('Supabase error creating template override:', insErr)
        throw new Error(`Database error: ${insErr.message}`)
      }
      return mapRow(ins)
    }

    // Non-system template: ensure user has access to the world before updating
    if (!current.world_id) {
      throw new Error('Template is not associated with a world and is not system; cannot determine ownership')
    }
    const world = await this.getWorldById(current.world_id, userId)
    if (!world) {
      throw new Error('World not found or access denied')
    }

    const { data: row, error } = await supabase
      .from('templates')
      .update(patch)
      .eq('id', templateId)
      .select('*')
      .single()
    if (error) {
      console.error('Supabase error updating template:', error)
      throw new Error(`Database error: ${error.message}`)
    }
    return mapRow(row)
  }

  /** Delete a template. System templates cannot be deleted. */
  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    const supabase = await createServerSupabaseClient()

    // Fetch template to enforce rules
    const { data: current, error: fetchErr } = await supabase
      .from('templates')
      .select('id, is_system, world_id')
      .eq('id', templateId)
      .single()
    if (fetchErr) {
      console.error('Supabase error fetching template for delete:', fetchErr)
      throw new Error(`Database error: ${fetchErr.message}`)
    }
    if (current.is_system) {
      throw new Error('Cannot delete system template')
    }
    if (!current.world_id) {
      throw new Error('Template has no world association; cannot delete')
    }

    // Verify access to world
    const world = await this.getWorldById(current.world_id, userId)
    if (!world) {
      throw new Error('World not found or access denied')
    }

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId)
    if (error) {
      console.error('Supabase error deleting template:', error)
      throw new Error(`Database error: ${error.message}`)
    }
  }

  /**
   * Get folders for a world
   */
  async getWorldFolders(worldId: string, userId: string): Promise<import('../types').Folder[]> {
    try {
      // Verify access
      const world = await this.getWorldById(worldId, userId)
      if (!world) throw new Error('World not found or access denied')

      const supabase = await createServerSupabaseClient()
      const { data: folders, error } = await supabase
        .from('folders')
        .select(`*, entities(count)`) // count entities per folder
        .eq('world_id', worldId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching folders:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      type FolderRow = { id: string; world_id: string; name: string; description?: string | null; color?: string | null; entities?: number | unknown[] }
      return (folders || []).map((f: FolderRow) => ({
        id: f.id,
        worldId: f.world_id,
        name: f.name,
        description: f.description || '',
        color: f.color || undefined,
        // Current schema has one folders table; treat as entity folders for now
        kind: 'entities' as const,
        count: Array.isArray(f.entities) ? f.entities.length : (typeof f.entities === 'number' ? f.entities : 0),
      }))
    } catch (error) {
      console.error('Error fetching world folders:', error)
      throw new Error('Failed to fetch folders')
    }
  }

  /** Create a folder in a world */
  async createFolder(worldId: string, data: { name: string; description?: string; color?: string }, userId: string): Promise<import('../types').Folder> {
    // Access check
    const world = await this.getWorldById(worldId, userId)
    if (!world) throw new Error('World not found or access denied')

    const supabase = await createServerSupabaseClient()
    const { data: row, error } = await supabase
      .from('folders')
      .insert({
        world_id: worldId,
        name: data.name,
        description: data.description || '',
        color: data.color || null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Supabase error creating folder:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    return {
      id: row.id,
      worldId: row.world_id,
      name: row.name,
      description: row.description || '',
      color: row.color || undefined,
      kind: 'entities',
      count: 0,
    }
  }

  /** Fetch a folder by ID (with access check) */
  async getFolderById(folderId: string, userId: string): Promise<import('../types').Folder | null> {
    const supabase = await createServerSupabaseClient()
    const { data: row, error } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') return null
      console.error('Supabase error fetching folder:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    const world = await this.getWorldById(row.world_id, userId)
    if (!world) return null

    return {
      id: row.id,
      worldId: row.world_id,
      name: row.name,
      description: row.description || '',
      color: row.color || undefined,
      kind: 'entities',
      count: 0,
    }
  }

  /** Update a folder by ID */
  async updateFolder(folderId: string, data: { name?: string; description?: string; color?: string | null }, userId: string): Promise<import('../types').Folder> {
    // Access check
    const current = await this.getFolderById(folderId, userId)
    if (!current) throw new Error('Folder not found or access denied')

    const patch: any = {}
    if (data.name !== undefined) patch.name = data.name
    if (data.description !== undefined) patch.description = data.description
    if (data.color !== undefined) patch.color = data.color

    const supabase = await createServerSupabaseClient()
    const { data: row, error } = await supabase
      .from('folders')
      .update(patch)
      .eq('id', folderId)
      .select('*')
      .single()
    if (error) {
      console.error('Supabase error updating folder:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    return {
      id: row.id,
      worldId: row.world_id,
      name: row.name,
      description: row.description || '',
      color: row.color || undefined,
      kind: 'entities',
      count: current.count,
    }
  }

  /** Delete a folder by ID */
  async deleteFolder(folderId: string, userId: string): Promise<void> {
    // Access check
    const current = await this.getFolderById(folderId, userId)
    if (!current) throw new Error('Folder not found or access denied')

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)

    if (error) {
      console.error('Supabase error deleting folder:', error)
      throw new Error(`Database error: ${error.message}`)
    }
  }
}

// Export singleton instance
export const supabaseWorldService = new SupabaseWorldService();
