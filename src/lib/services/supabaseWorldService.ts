import type { Database } from '../supabase/types.generated';
import { World, Entity, Template, TemplateField, Json } from '../types';
import { createClient as createServerSupabaseClient } from '../supabase/server';
import { adminClient } from '../supabase/admin';
import { logDatabaseError, logAuditEvent } from '../logging';
import { 
  adaptWorldFromDatabase, 
  adaptWorldToDatabase,
  adaptEntityFromDatabase,
  adaptEntityToDatabase,
  adaptTemplateFromDatabase,
  adaptTemplateToDatabase,
  adaptFolderFromDatabase,
  adaptFolderToDatabase,
  isValidWorld,
  isValidEntity 
} from '../adapters';
import { logError } from '../logging';
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
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) {
        logError('Supabase error fetching worlds', error, { action: 'getUserWorlds', userId });
        throw new Error(`Database error: ${error.message}`);
      }

      return worlds?.map(world => adaptWorldFromDatabase(world)) || [];
    } catch (error) {
      logError('Error fetching user worlds', error as Error, { action: 'getUserWorlds', userId });
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
      const supabase = await createServerSupabaseClient()
      // Ensure server client has an authenticated user context (RLS)
      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData?.user) {
        logError('createWorld: missing server auth user', authErr || new Error('No auth user'), { action: 'createWorld', userId });
        throw new Error('Not authenticated (server)');
      }
      const ownerId = authData.user.id;
      const insertData = adaptWorldToDatabase({
        name: data.name,
        summary: data.description || '',
        isPublic: data.isPublic || false,
        isArchived: false,
        settings: {}
      });
      
      const { data: world, error } = await supabase
        .from('worlds')
        .insert({
          name: data.name, // Required field
          description: data.description || '',
          owner_id: ownerId,
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

      // Audit log for world creation
      logAuditEvent('world_created', {
        userId,
        worldId: adaptedWorld.id,
        action: 'create_world',
        metadata: {
          worldName: adaptedWorld.name,
          isPublic: adaptedWorld.isPublic,
          description: adaptedWorld.description
        }
      });
      
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
      const supabase = await createServerSupabaseClient()
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
      const supabase = await createServerSupabaseClient()
      
      // Get world details before deletion for audit logging
      const { data: worldData } = await supabase
        .from('worlds')
        .select('name, description, is_public')
        .eq('id', worldId)
        .eq('owner_id', userId)
        .single();
      
      const { error } = await supabase
        .from('worlds')
        .delete()
        .eq('id', worldId)
        .eq('owner_id', userId); // Only owner can delete

      if (error) {
        logDatabaseError('Supabase error deleting world', error as Error, { worldId, action: 'delete_world' });
        throw new Error(`Database error: ${error.message}`);
      }

      // Audit log for world deletion
      logAuditEvent('world_deleted', {
        userId,
        worldId,
        action: 'delete_world',
        metadata: {
          worldName: worldData?.name || 'Unknown',
          description: worldData?.description,
          isPublic: worldData?.is_public,
          deletedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logDatabaseError('Error deleting world', error as Error, { worldId, action: 'delete_world' });
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
        logDatabaseError('Supabase error archiving world', error as Error, { worldId, action: 'archive_world' });
        throw new Error(`Database error: ${error.message}`);
      }
    } catch (error) {
      logDatabaseError('Error archiving world', error as Error, { worldId, action: 'archive_world' });
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
        logDatabaseError('Supabase error fetching entities', error as Error, { worldId, action: 'fetch_entities' });
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
    // Access check by fetching world
    const world = await this.getWorldById(worldId, userId)
    if (!world) throw new Error('World not found or access denied')

    const supabase = await createServerSupabaseClient();
    
    // Merge custom fields with regular fields for data JSONB column
    const { templateId, folderId, name, fields, tags, ...customFields } = data;
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

  /** Get a single entity by ID (with access check) */
  async getEntityById(entityId: string, userId: string): Promise<Entity | null> {
    const supabase = await createServerSupabaseClient()
    const { data: row, error } = await supabase
      .from('entities')
      .select('*')
      .eq('id', entityId)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      logError('Supabase error fetching entity', error, { action: 'getEntityById', entityId, userId });
      throw new Error(`Database error: ${error.message}`);
    }

    // Access check via world
    const world = await this.getWorldById(row.world_id, userId);
    if (!world) return null;

    const adaptedEntity = adaptEntityFromDatabase(row);
    if (!isValidEntity(adaptedEntity)) {
      logError('Invalid entity data from database', new Error('Entity validation failed'), { entityId, userId });
      throw new Error('Invalid entity data');
    }
    
    return adaptedEntity;
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
      logDatabaseError('Supabase error updating entity', error, { entityId, action: 'update_entity' })
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
      logDatabaseError('Supabase error deleting entity', error, { entityId, action: 'delete_entity' })
      throw new Error(`Database error: ${error.message}`)
    }
  }

  /**
   * Relationships: list for a world
   */
  async getWorldRelationships(worldId: string, userId: string): Promise<Array<{
    id: string;
    worldId: string;
    from: string;
    to: string;
    label: string;
    description?: string | null;
    metadata?: Json | null;
    updatedAt?: string;
  }>> {
    // Verify access to world
    const world = await this.getWorldById(worldId, userId)
    if (!world) throw new Error('World not found or access denied')

    const supabase = await createServerSupabaseClient()
    const { data: rows, error } = await supabase
      .from('relationships')
      .select('*')
      .eq('world_id', worldId)
      .order('updated_at', { ascending: false })

    if (error) {
      logDatabaseError('Supabase error fetching relationships', error, { worldId, action: 'fetch_relationships' })
      throw new Error(`Database error: ${error.message}`)
    }

    return (rows || []).map(r => ({
      id: r.id,
      worldId: r.world_id,
      from: r.from_entity_id,
      to: r.to_entity_id,
      label: r.relationship_type,
      description: r.description,
      metadata: r.metadata as Json | null,
      updatedAt: r.updated_at,
    }))
  }

  /**
   * Relationships: create (idempotent on unique triple)
   */
  async createRelationship(
    worldId: string,
    data: { fromEntityId: string; toEntityId: string; label: string; description?: string | null; metadata?: Json | null; [key: string]: any },
    userId: string,
  ): Promise<{
    id: string;
    worldId: string;
    from: string;
    to: string;
    label: string;
    description?: string | null;
    metadata?: Json | null;
    created?: boolean;
  }> {
    const startTime = Date.now()
    console.log('🔄 CreateRelationship: Starting', { 
      worldId, 
      fromEntityId: data.fromEntityId, 
      toEntityId: data.toEntityId, 
      label: data.label,
      userId,
      environment: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      startTime
    })
    
    // Verify access
    console.log('🔍 CreateRelationship: Checking world access', { worldId, userId })
    let world
    try {
      world = await this.getWorldById(worldId, userId)
    } catch (worldError) {
      console.log('❌ CreateRelationship: Error checking world access', { 
        worldId, 
        userId,
        error: worldError instanceof Error ? worldError.message : 'Unknown world access error',
        stack: worldError instanceof Error ? worldError.stack : undefined
      })
      throw new Error(`World access check failed: ${worldError instanceof Error ? worldError.message : 'Unknown error'}`)
    }
    
    if (!world) {
      console.log('❌ CreateRelationship: World not found or access denied', { worldId, userId })
      throw new Error('World not found or access denied')
    }
    
    console.log('✅ CreateRelationship: World access verified', { worldId, worldName: world.name, userId })

    console.log('🔧 CreateRelationship: Setting up client with environment check', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      adminClientExists: !!adminClient,
      nodeEnv: process.env.NODE_ENV
    })
    
    let supabase
    try {
      // Use regular client first to try normal RLS flow
      supabase = await createServerSupabaseClient()
      console.log('✅ CreateRelationship: Regular client created')
      
      // Check if we have authentication context
      const { data: authData, error: authError } = await supabase.auth.getUser()
      console.log('🔐 CreateRelationship: Auth context check', { 
        hasUser: !!authData?.user, 
        userId: authData?.user?.id,
        passedUserId: userId,
        authMatch: authData?.user?.id === userId,
        authError: authError?.message
      })
      
      // If auth context is missing or invalid, use admin client
      if (authError || !authData?.user || authData.user.id !== userId) {
        console.log('⚠️ CreateRelationship: Auth context invalid, switching to admin client')
        
        if (!adminClient) {
          console.log('❌ CreateRelationship: Admin client not available - missing SUPABASE_SERVICE_ROLE_KEY')
          throw new Error('Admin client not configured and regular auth failed - check SUPABASE_SERVICE_ROLE_KEY environment variable')
        }
        
        // Use admin client which bypasses RLS
        // We still maintain access control through our world access check above
        supabase = adminClient
        console.log('✅ CreateRelationship: Using admin client to bypass RLS')
      } else {
        console.log('✅ CreateRelationship: Using regular authenticated client')
      }
      
    } catch (supabaseError) {
      console.log('❌ CreateRelationship: Failed to create Supabase client', {
        error: supabaseError instanceof Error ? supabaseError.message : 'Unknown Supabase error',
        stack: supabaseError instanceof Error ? supabaseError.stack : undefined,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasAdminClient: !!adminClient
      })
      throw new Error(`Supabase client setup failed: ${supabaseError instanceof Error ? supabaseError.message : 'Unknown error'}`)
    }

    // Verify both entities exist in this world
    console.log('🔍 CreateRelationship: Validating entities exist', { fromEntityId: data.fromEntityId, toEntityId: data.toEntityId })
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('id')
      .eq('world_id', worldId)
      .in('id', [data.fromEntityId, data.toEntityId])

    if (entitiesError) {
      console.log('❌ CreateRelationship: Error checking entities', { error: entitiesError, fromEntityId: data.fromEntityId, toEntityId: data.toEntityId })
      logDatabaseError('Supabase error checking entities', entitiesError, { fromEntityId: data.fromEntityId, toEntityId: data.toEntityId, action: 'check_entities' })
      throw new Error(`Database error checking entities: ${entitiesError.message}`)
    }

    if (!entities || entities.length !== 2) {
      const foundIds = entities?.map(e => e.id) || []
      const missingIds = [data.fromEntityId, data.toEntityId].filter(id => !foundIds.includes(id))
      console.log('❌ CreateRelationship: Entities not found', { fromEntityId: data.fromEntityId, toEntityId: data.toEntityId, foundIds, missingIds })
      throw new Error(`Entity not found in this world: ${missingIds.join(', ')}`)
    }

    console.log('✅ CreateRelationship: Entities validated', { fromEntityId: data.fromEntityId, toEntityId: data.toEntityId })

    // Pre-check to avoid uniqueness error and behave idempotently
    console.log('🔍 CreateRelationship: Checking for existing relationship')
    const { data: existingRows, error: findErr } = await supabase
      .from('relationships')
      .select('*')
      .eq('world_id', worldId)
      .eq('from_entity_id', data.fromEntityId)
      .eq('to_entity_id', data.toEntityId)
      .eq('relationship_type', data.label)
      .limit(1)
    if (findErr) {
      console.log('❌ CreateRelationship: Error checking existing relationship', { error: findErr, fromEntityId: data.fromEntityId, toEntityId: data.toEntityId })
      logDatabaseError('Supabase error pre-checking relationship', findErr, { fromEntityId: data.fromEntityId, toEntityId: data.toEntityId, action: 'precheck_relationship' })
      throw new Error(`Database error: ${findErr.message}`)
    }
    if (existingRows && existingRows.length > 0) {
      const r = existingRows[0]
      console.log('✅ CreateRelationship: Found existing relationship, returning it', { relationshipId: r.id })
      return {
        id: r.id,
        worldId: r.world_id,
        from: r.from_entity_id,
        to: r.to_entity_id,
        label: r.relationship_type,
        description: r.description,
        metadata: r.metadata as Json | null,
        created: false,
      }
    }

    // Persist all provided custom fields in metadata JSONB
    const customFields = { ...((data.metadata ?? {}) as Record<string, unknown>) };
    for (const key of Object.keys(data)) {
      if (!['fromEntityId', 'toEntityId', 'label', 'description', 'metadata'].includes(key)) {
        customFields[key] = data[key];
      }
    }
    
    const insertData = {
      world_id: worldId,
      from_entity_id: data.fromEntityId,
      to_entity_id: data.toEntityId,
      relationship_type: data.label,
      description: data.description ?? null,
      metadata: customFields as Json,
    }
    
    console.log('💾 CreateRelationship: Inserting relationship', { insertData })
    const { data: row, error } = await supabase
      .from('relationships')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      console.log('❌ CreateRelationship: Database insert error', { 
        error, 
        insertData,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        usingAdminClient: supabase === adminClient
      })
      logDatabaseError('Supabase error creating relationship', error, { fromEntityId: data.fromEntityId, toEntityId: data.toEntityId, action: 'create_relationship' })
      throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
    }

    if (!row) {
      console.log('❌ CreateRelationship: No row returned after insert')
      throw new Error('Relationship creation succeeded but no data returned')
    }

    const endTime = Date.now()
    const duration = endTime - startTime
    console.log('✅ CreateRelationship: Successfully created', { 
      relationshipId: row.id,
      duration: `${duration}ms`,
      environment: process.env.NODE_ENV
    })
    return {
      id: row.id,
      worldId: row.world_id,
      from: row.from_entity_id,
      to: row.to_entity_id,
      label: row.relationship_type,
      description: row.description,
      metadata: row.metadata as Json | null,
      created: true,
    }
  }

  /**
   * Relationships: update label/metadata by ID
   */
  async updateRelationship(
    relationshipId: string,
    data: { label?: string; description?: string | null; metadata?: Json | null; [key: string]: any },
    userId: string,
  ): Promise<{ id: string; worldId: string; from: string; to: string; label: string; description?: string | null; metadata?: Json | null }> {
    const supabase = await createServerSupabaseClient()

    // Fetch current to check access via world
    const { data: current, error: fetchErr } = await supabase
      .from('relationships')
      .select('*')
      .eq('id', relationshipId)
      .single()
    if (fetchErr) {
      logDatabaseError('Supabase error fetching relationship', fetchErr, { relationshipId, action: 'fetch_relationship' })
      throw new Error(`Database error: ${fetchErr.message}`)
    }

    const world = await this.getWorldById(current.world_id, userId)
    if (!world) throw new Error('Relationship not found or access denied')

    // Persist all provided custom fields in metadata JSONB
    const customFields = { ...((data.metadata ?? {}) as Record<string, unknown>) };
    for (const key of Object.keys(data)) {
      if (!['label', 'description', 'metadata'].includes(key)) {
        customFields[key] = data[key];
      }
    }
    const patch: any = {}
    if (data.label !== undefined) patch.relationship_type = data.label
    if (data.description !== undefined) patch.description = data.description
    patch.metadata = customFields as Json

    const { data: row, error } = await supabase
      .from('relationships')
      .update(patch)
      .eq('id', relationshipId)
      .select('*')
      .single()
    if (error) {
      logDatabaseError('Supabase error updating relationship', error, { relationshipId, action: 'update_relationship' })
      throw new Error(`Database error: ${error.message}`)
    }
    return {
      id: row.id,
      worldId: row.world_id,
      from: row.from_entity_id,
      to: row.to_entity_id,
      label: row.relationship_type,
      description: row.description,
      metadata: row.metadata as Json | null,
    }
  }

  /**
   * Relationships: delete by ID
   */
  async deleteRelationship(relationshipId: string, userId: string): Promise<void> {
    const supabase = await createServerSupabaseClient()
    const { data: current, error: fetchErr } = await supabase
      .from('relationships')
      .select('id, world_id')
      .eq('id', relationshipId)
      .single()
    if (fetchErr) {
      logDatabaseError('Supabase error fetching relationship for delete', fetchErr, { relationshipId, action: 'fetch_relationship_for_delete' })
      throw new Error(`Database error: ${fetchErr.message}`)
    }
    const world = await this.getWorldById(current.world_id, userId)
    if (!world) throw new Error('Relationship not found or access denied')

    const { error } = await supabase
      .from('relationships')
      .delete()
      .eq('id', relationshipId)
    if (error) {
      logDatabaseError('Supabase error deleting relationship', error, { relationshipId, action: 'delete_relationship' })
      throw new Error(`Database error: ${error.message}`)
    }
  }

  /**
   * Get templates for a world (including system templates)
   */
  async getWorldTemplates(worldId: string): Promise<Template[]> {
    try {
      // Use service role key for system templates since they need elevated access
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: templates, error } = await supabase
        .from('templates')
        .select('*')
        .or(`is_system.eq.true,world_id.eq.${worldId}`)
        .order('name');

      if (error) {
        logDatabaseError('Supabase error fetching templates', error, { worldId, action: 'fetch_world_templates' });
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
      const result = deduped.map(template => ({
        id: template.id,
        worldId: template.world_id || worldId,
        folderId: undefined,
        name: template.name,
        description: template.description || '',
        icon: template.icon || undefined,
        category: template.category || 'General',
        fields: (template.fields as any[]) || [],
        isSystem: template.is_system || false
      }));
      
      return result;
    } catch (error) {
      logDatabaseError('Error fetching world templates', error as Error, { worldId, action: 'fetch_world_templates' });
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
        logDatabaseError('Supabase error fetching system templates', error, { action: 'fetch_system_templates' });
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
      logDatabaseError('Error fetching system templates', error as Error, { action: 'fetch_system_templates' });
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
    [key: string]: any;
  }, userId: string, supabase?: any): Promise<Template> {
    const dbClient = supabase || await createServerSupabaseClient()
    
    // Access check by fetching world using the same client - prevents auth context issues
    console.log('🎯 Template creation - starting world access check', { worldId, userId })
    const { data: world, error: worldError } = await dbClient
      .from('worlds')
      .select('id, name, owner_id')
      .eq('id', worldId)
      .single()
    
    console.log('🎯 Template creation - world access check result', { world, worldError })
    
    if (worldError || !world) {
      console.log('🎯 Template creation - world access check failed', { worldError, worldId, userId })
      logDatabaseError('World access check failed for template creation', worldError, { worldId, userId, action: 'template_create_world_check' })
      throw new Error('World not found or access denied')
    }
    
    console.log('🎯 Template creation - world access check passed', { worldId: world.id, worldName: world.name })
    
    try {
      console.log('🎯 Template creation - preparing to insert template', { 
        worldId, 
        templateName: data.name, 
        fieldsLength: data.fields?.length || 0
      })
      
      const insertData = {
        world_id: worldId,
        name: data.name,
        description: data.description || '',
        icon: data.icon || 'file-text',
        category: data.category || 'general',
        fields: (data.fields as unknown) as Json,
        is_system: false,
      }
      
      console.log('🎯 Template creation - insert data prepared', insertData)
      
      // Debug: Check auth context at database level by querying worlds with owner check
      const { data: authUser } = await dbClient.auth.getUser()
      
      // Test what the database sees as the current user by checking world access
      const { data: ownedWorlds, error: ownerCheckError } = await dbClient
        .from('worlds') 
        .select('id')
        .eq('owner_id', world.owner_id)
      
      // Check membership
      const { data: membership } = await dbClient
        .from('world_members')
        .select('role')
        .eq('world_id', worldId)
        .eq('user_id', authUser?.id || 'none')
        .single()
      
      const debugInfo = {
        clientAuthUserId: authUser?.id,
        passedUserId: userId,
        worldOwner: world.owner_id,
        authMatch: authUser?.id === world.owner_id,
        membership: membership?.role || 'none',
        canCreate: authUser?.id === world.owner_id || ['admin', 'editor'].includes(membership?.role || 'none'),
        ownedWorldsCount: ownedWorlds?.length || 0,
        ownerCheckError: ownerCheckError?.message || 'none'
      }
      
      console.log('🎯 Template creation - auth context check', debugInfo)
      
      const { data: row, error } = await dbClient
        .from('templates')
        .insert(insertData)
        .select('*')
        .single()
      
      console.log('🎯 Template creation - insert result', { row, error })
      
      if (error) {
        console.log('🎯 Template creation - database error', { error, insertData, debugInfo })
        logDatabaseError('Supabase error creating template', error, { worldId, templateName: data.name, userId, action: 'create_template' })
        const detailedError = new Error(`Database error: ${error.message}. Debug: ${JSON.stringify(debugInfo)}`)
        // Add debug info as properties so it can be accessed
        ;(detailedError as any).debugInfo = debugInfo
        ;(detailedError as any).originalError = error
        throw detailedError
      }
      
      if (!row) {
        throw new Error('Template creation succeeded but no data returned')
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
    } catch (error) {
      console.log('🎯 Template creation - caught error', { error, worldId, templateName: data.name, userId })
      logDatabaseError('Error in template creation', error as Error, { worldId, templateName: data.name, userId, action: 'create_template' })
      throw error
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
      logDatabaseError('Supabase error fetching template', fetchErr, { templateId, action: 'fetch_template' })
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

    // Persist all provided custom fields in fields JSONB
  const customFields: Record<string, unknown> = Array.isArray((data as any).fields) ? { ...(data as any).fields } : {};
    for (const key of Object.keys(data)) {
      if (!['name', 'description', 'icon', 'category', 'fields'].includes(key)) {
        customFields[key] = (data as any)[key];
      }
    }
    const patch: Partial<{ name: string; description?: string | null; icon?: string | null; category?: string | null; fields?: Json }> = {}
    if (data.name !== undefined) patch.name = data.name
    if (data.description !== undefined) patch.description = data.description
    if (data.icon !== undefined) patch.icon = data.icon
    if (data.category !== undefined) patch.category = data.category
    if ((data as Partial<Template>).fields !== undefined) patch.fields = (customFields as unknown) as Json

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
        logDatabaseError('Supabase error finding template override', ovErr, { templateId, worldId, action: 'find_template_override' })
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
          logDatabaseError('Supabase error updating template override', error, { templateId, worldId, action: 'update_template_override' })
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
        logDatabaseError('Supabase error creating template override', insErr, { templateId, worldId, action: 'create_template_override' })
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
      logDatabaseError('Supabase error updating template', error, { templateId, action: 'update_template' })
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
      logDatabaseError('Supabase error fetching template for delete', fetchErr, { templateId, action: 'fetch_template_for_delete' })
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
      logDatabaseError('Supabase error deleting template', error, { templateId, action: 'delete_template' })
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
        logDatabaseError('Supabase error fetching folders', error, { worldId, action: 'fetch_folders' })
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
      logDatabaseError('Error fetching world folders', error as Error, { worldId, action: 'fetch_world_folders' })
      throw new Error('Failed to fetch folders')
    }
  }

  /** Create a folder in a world */
  async createFolder(worldId: string, data: { name: string; description?: string; color?: string; [key: string]: unknown }, userId: string): Promise<import('../types').Folder> {
    // Access check
    const world = await this.getWorldById(worldId, userId)
    if (!world) throw new Error('World not found or access denied')

    const supabase = await createServerSupabaseClient()
    // Persist all provided custom fields in data JSONB
  const customFields: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      if (!['name', 'description', 'color'].includes(key)) {
        customFields[key] = data[key];
      }
    }
    const { data: row, error } = await supabase
      .from('folders')
      .insert({
        world_id: worldId,
        name: data.name,
        description: data.description || '',
        color: data.color || null,
        data: customFields as Json,
      })
      .select('*')
      .single()

    if (error) {
      logDatabaseError('Supabase error creating folder', error, { worldId, folderName: data.name, action: 'create_folder' })
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
      logDatabaseError('Supabase error fetching folder', error, { folderId, action: 'fetch_folder' })
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
      logDatabaseError('Supabase error updating folder', error, { folderId, action: 'update_folder' })
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
      logDatabaseError('Supabase error deleting folder', error, { folderId, action: 'delete_folder' })
      throw new Error(`Database error: ${error.message}`)
    }
  }

  // Members management
  async getWorldMembers(worldId: string, userId: string) {
    try {
      // First verify user has access to this world
      const world = await this.getWorldById(worldId, userId);
      if (!world) {
        throw new Error('World not found or access denied');
      }

      const supabase = await createServerSupabaseClient()
      
      // For now, just return the world owner as a member
      // TODO: Implement full members functionality when world_members table is properly set up
      const { data: worldData, error: worldError } = await supabase
        .from('worlds')
        .select(`
          owner_id
        `)
        .eq('id', worldId)
        .single();

      if (worldError) {
        logDatabaseError('Supabase error fetching world owner', worldError, { worldId, action: 'fetch_world_owner' });
        throw new Error(`Database error: ${worldError.message}`);
      }

      // Get owner profile
      let ownerProfile: any = null;
      if (worldData?.owner_id) {
        const { data: ownerProfileData, error: ownerProfileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .eq('id', worldData.owner_id)
          .single();
          
        if (!ownerProfileError && ownerProfileData) {
          ownerProfile = ownerProfileData;
        }
      }

      // Return just the owner for now
      if (worldData?.owner_id && ownerProfile) {
        const ownerMember = {
          id: `owner-${worldData.owner_id}`, // Special ID for owner
          worldId: worldId,
          userId: worldData.owner_id,
          role: 'owner' as const,
          joinedAt: new Date().toISOString(), // Placeholder
          lastActiveAt: new Date().toISOString(),
          name: ownerProfile.full_name || 'Unknown User',
          email: ownerProfile.email || '',
          avatar: ownerProfile.avatar_url || undefined,
          permissions: {}
        };
        
        return [ownerMember];
      }

      return [];
    } catch (error) {
      logDatabaseError('Error fetching world members', error as Error, { worldId, action: 'fetch_world_members' });
      throw new Error('Failed to fetch members');
    }
  }

  async updateMemberRole(worldId: string, memberId: string, role: string, userId: string) {
    try {
      // First verify user has admin/owner access to this world
      const world = await this.getWorldById(worldId, userId);
      if (!world) {
        throw new Error('World not found or access denied');
      }

      const supabase = await createServerSupabaseClient()
      
      // Check if the requesting user is the owner or admin
      const { data: worldData } = await supabase
        .from('worlds')
        .select('owner_id')
        .eq('id', worldId)
        .single();

      const isOwner = worldData?.owner_id === userId;
      
      if (!isOwner) {
        // Check if user is admin
        const { data: requestingMember } = await supabase
          .from('world_members')
          .select('role')
          .eq('world_id', worldId)
          .eq('user_id', userId)
          .single();

        if (!requestingMember || requestingMember.role !== 'admin') {
          throw new Error('Insufficient permissions to update member roles');
        }
      }

      // Validate role (can't set owner role through this method)
      const validRoles = ['admin', 'editor', 'viewer'];
      if (!validRoles.includes(role)) {
        throw new Error('Invalid role specified');
      }

      // Get current member data for audit logging
      const { data: currentMember } = await supabase
        .from('world_members')
        .select('role, user_id, profiles(email, full_name)')
        .eq('id', memberId)
        .eq('world_id', worldId)
        .single();

      // Update the member role
      const { data: updatedMember, error } = await supabase
        .from('world_members')
        .update({ role: role as 'admin' | 'editor' | 'viewer' })
        .eq('id', memberId)
        .eq('world_id', worldId)
        .select(`
          id,
          world_id,
          user_id,
          role,
          joined_at
        `)
        .single();

      if (error) {
        logDatabaseError('Supabase error updating member role', error, { worldId, userId, role: role, action: 'update_member_role' });
        throw new Error(`Database error: ${error.message}`);
      }

      // Get the updated member's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('id', updatedMember.user_id)
        .single();

      // Audit log for member role change
      logAuditEvent('member_role_updated', {
        userId,
        worldId,
        targetUserId: updatedMember.user_id,
        targetEmail: profileData?.email || (currentMember as any)?.profiles?.email || '',
        action: 'update_member_role',
        previousValue: currentMember?.role,
        newValue: role,
        metadata: {
          memberId,
          targetUserName: profileData?.full_name || (currentMember as any)?.profiles?.full_name || 'Unknown User',
          worldName: world.name,
          updatedBy: userId
        }
      });

      return {
        id: updatedMember.id,
        worldId: updatedMember.world_id,
        userId: updatedMember.user_id,
        role: updatedMember.role as 'admin' | 'editor' | 'viewer',
        joinedAt: updatedMember.joined_at,
        lastActiveAt: updatedMember.joined_at,
        name: profileData?.full_name || 'Unknown User',
        email: profileData?.email || '',
        avatar: profileData?.avatar_url || undefined,
        permissions: {}
      };
    } catch (error) {
      logDatabaseError('Error updating member role', error as Error, { worldId, userId, role: role, action: 'update_member_role' });
      throw new Error('Failed to update member role');
    }
  }

  async removeMember(worldId: string, memberId: string, userId: string) {
    try {
      // First verify user has admin/owner access to this world
      const world = await this.getWorldById(worldId, userId);
      if (!world) {
        throw new Error('World not found or access denied');
      }

      const supabase = await createServerSupabaseClient()
      
      // Check if the requesting user is the owner or admin
      const { data: worldData } = await supabase
        .from('worlds')
        .select('owner_id')
        .eq('id', worldId)
        .single();

      const isOwner = worldData?.owner_id === userId;
      
      if (!isOwner) {
        // Check if user is admin
        const { data: requestingMember } = await supabase
          .from('world_members')
          .select('role')
          .eq('world_id', worldId)
          .eq('user_id', userId)
          .single();

        if (!requestingMember || requestingMember.role !== 'admin') {
          throw new Error('Insufficient permissions to remove members');
        }
      }

      // Cannot remove the owner (owner is not in world_members table)
      if (memberId.startsWith('owner-')) {
        throw new Error('Cannot remove the world owner');
      }

      // Get member details before removal for audit logging
      const { data: memberToRemove } = await supabase
        .from('world_members')
        .select('user_id, role, profiles(email, full_name)')
        .eq('id', memberId)
        .eq('world_id', worldId)
        .single();

      // Remove the member
      const { error } = await supabase
        .from('world_members')
        .delete()
        .eq('id', memberId)
        .eq('world_id', worldId);

      if (error) {
        logDatabaseError('Supabase error removing member', error, { worldId, userId, action: 'remove_member' });
        throw new Error(`Database error: ${error.message}`);
      }

      // Audit log for member removal
      if (memberToRemove) {
        logAuditEvent('member_removed', {
          userId,
          worldId,
          targetUserId: memberToRemove.user_id,
          targetEmail: (memberToRemove as any)?.profiles?.email || '',
          action: 'remove_member',
          metadata: {
            memberId,
            targetUserName: (memberToRemove as any)?.profiles?.full_name || 'Unknown User',
            memberRole: memberToRemove.role,
            worldName: world.name,
            removedBy: userId,
            removedAt: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      logDatabaseError('Error removing member', error as Error, { worldId, userId, action: 'remove_member' });
      throw new Error('Failed to remove member');
    }
  }
}

// Export singleton instance
export const supabaseWorldService = new SupabaseWorldService();
