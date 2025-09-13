export interface ActivityLogParams {
  userId: string
  action: string
  description: string
  resourceType?: string
  resourceId?: string
  resourceName?: string
  worldId?: string
  metadata?: Record<string, any>
}

/**
 * Log user activity to the database
 * Client-safe wrapper that dynamically imports server-only functionality
 */
export async function logActivity(params: ActivityLogParams): Promise<void> {
  try {
    // Only run on server-side
    if (typeof window !== 'undefined') {
      return // Skip on client-side
    }

    // Dynamic import of server-only module
    const { logActivity: serverLogActivity } = await import('@/lib/activity-logger-server')
    await serverLogActivity(params)
  } catch (error) {
    console.error('Activity logging error:', error)
    // Silent failure for activity logging
  }
}

/**
 * Activity action types for consistency
 */
export const ACTIVITY_ACTIONS = {
  // World actions
  CREATE_WORLD: 'create_world',
  UPDATE_WORLD: 'update_world',
  DELETE_WORLD: 'delete_world',
  ARCHIVE_WORLD: 'archive_world',
  UNARCHIVE_WORLD: 'unarchive_world',

  // Entity actions
  CREATE_ENTITY: 'create_entity',
  UPDATE_ENTITY: 'update_entity',
  DELETE_ENTITY: 'delete_entity',
  MOVE_ENTITY: 'move_entity',

  // Template actions
  CREATE_TEMPLATE: 'create_template',
  UPDATE_TEMPLATE: 'update_template',
  DELETE_TEMPLATE: 'delete_template',

  // Folder actions
  CREATE_FOLDER: 'create_folder',
  UPDATE_FOLDER: 'update_folder',
  DELETE_FOLDER: 'delete_folder',

  // Relationship actions
  CREATE_RELATIONSHIP: 'create_relationship',
  DELETE_RELATIONSHIP: 'delete_relationship',

  // Member actions
  INVITE_MEMBER: 'invite_member',
  ACCEPT_INVITE: 'accept_invite',
  REMOVE_MEMBER: 'remove_member',
  UPDATE_MEMBER_ROLE: 'update_member_role',

  // Profile actions
  UPDATE_PROFILE: 'update_profile',

  // File actions
  UPLOAD_FILE: 'upload_file',
  DELETE_FILE: 'delete_file'
} as const

/**
 * Helper functions for common activity logging patterns
 */
export const ActivityLogger = {
  // World activities
  worldCreated: (userId: string, worldName: string, worldId: string) =>
    logActivity({
      userId,
      action: ACTIVITY_ACTIONS.CREATE_WORLD,
      description: `Created world "${worldName}"`,
      resourceType: 'world',
      resourceId: worldId,
      resourceName: worldName,
      worldId
    }),

  worldUpdated: (userId: string, worldName: string, worldId: string) =>
    logActivity({
      userId,
      action: ACTIVITY_ACTIONS.UPDATE_WORLD,
      description: `Updated world "${worldName}"`,
      resourceType: 'world',
      resourceId: worldId,
      resourceName: worldName,
      worldId
    }),

  worldArchived: (userId: string, worldName: string, worldId: string) =>
    logActivity({
      userId,
      action: ACTIVITY_ACTIONS.ARCHIVE_WORLD,
      description: `Archived world "${worldName}"`,
      resourceType: 'world',
      resourceId: worldId,
      resourceName: worldName,
      worldId
    }),

  // Entity activities
  entityCreated: (userId: string, entityName: string, entityId: string, worldId: string, worldName: string) =>
    logActivity({
      userId,
      action: ACTIVITY_ACTIONS.CREATE_ENTITY,
      description: `Created entity "${entityName}" in "${worldName}"`,
      resourceType: 'entity',
      resourceId: entityId,
      resourceName: entityName,
      worldId
    }),

  entityUpdated: (userId: string, entityName: string, entityId: string, worldId: string, worldName: string) =>
    logActivity({
      userId,
      action: ACTIVITY_ACTIONS.UPDATE_ENTITY,
      description: `Updated entity "${entityName}" in "${worldName}"`,
      resourceType: 'entity',
      resourceId: entityId,
      resourceName: entityName,
      worldId
    }),

  // Template activities
  templateCreated: (userId: string, templateName: string, templateId: string, worldId: string, worldName: string) =>
    logActivity({
      userId,
      action: ACTIVITY_ACTIONS.CREATE_TEMPLATE,
      description: `Created template "${templateName}" in "${worldName}"`,
      resourceType: 'template',
      resourceId: templateId,
      resourceName: templateName,
      worldId
    }),

  // Profile activities
  profileUpdated: (userId: string, fields: string[]) =>
    logActivity({
      userId,
      action: ACTIVITY_ACTIONS.UPDATE_PROFILE,
      description: `Updated profile (${fields.join(', ')})`,
      resourceType: 'profile',
      resourceId: userId,
      metadata: { updatedFields: fields }
    })
}