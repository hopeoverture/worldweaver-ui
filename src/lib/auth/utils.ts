/**
 * Authentication Utilities
 * Helper functions for authentication and session management
 */

import { auth } from "@/lib/auth/config"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import { getConfig } from "@/lib/config/env"

const config = getConfig()
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

/**
 * Get the current authenticated user from the session
 */
export async function getCurrentUser() {
  const session = await auth()
  return session?.user || null
}

/**
 * Get the current user's ID from the session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id || null
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth()
  return !!session?.user
}

/**
 * Hash a password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Create a new user account
 */
export async function createUser(email: string, password: string, name?: string) {
  try {
    const passwordHash = await hashPassword(password)
    
    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING id, email, name, created_at`,
      [email, name || email, passwordHash]
    )
    
    return result.rows[0]
  } catch (error) {
    console.error('Error creating user:', error)
    throw new Error('Failed to create user account')
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    const result = await pool.query(
      'SELECT id, email, name, "emailVerified", created_at FROM users WHERE email = $1',
      [email]
    )
    
    return result.rows[0] || null
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  try {
    const result = await pool.query(
      'SELECT id, email, name, "emailVerified", created_at FROM users WHERE id = $1',
      [id]
    )
    
    return result.rows[0] || null
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

/**
 * Update user profile
 */
export async function updateUser(id: string, data: { name?: string; email?: string }) {
  try {
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount}`)
      values.push(data.name)
      paramCount++
    }

    if (data.email !== undefined) {
      updates.push(`email = $${paramCount}`)
      values.push(data.email)
      paramCount++
    }

    if (updates.length === 0) {
      throw new Error('No data to update')
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, name, "emailVerified"
    `

    const result = await pool.query(query, values)
    return result.rows[0]
  } catch (error) {
    console.error('Error updating user:', error)
    throw new Error('Failed to update user')
  }
}

/**
 * Delete user account
 */
export async function deleteUser(id: string) {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id])
    return true
  } catch (error) {
    console.error('Error deleting user:', error)
    throw new Error('Failed to delete user')
  }
}

/**
 * Check if user owns a world
 */
export async function userOwnsWorld(userId: string, worldId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT 1 FROM worlds WHERE id = $1 AND owner_id = $2',
      [worldId, userId]
    )
    
    return result.rows.length > 0
  } catch (error) {
    console.error('Error checking world ownership:', error)
    return false
  }
}

/**
 * Check if user has access to a world (owns it or is a member)
 */
export async function userHasWorldAccess(userId: string, worldId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT 1 FROM worlds w 
       WHERE w.id = $1 AND (
         w.owner_id = $2 OR 
         w.is_public = true OR 
         EXISTS (SELECT 1 FROM world_members wm WHERE wm.world_id = w.id AND wm.user_id = $2)
       )`,
      [worldId, userId]
    )
    
    return result.rows.length > 0
  } catch (error) {
    console.error('Error checking world access:', error)
    return false
  }
}

/**
 * Require authentication for API routes
 * Throws an error if user is not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

/**
 * Require specific world access
 * Throws an error if user doesn't have access to the world
 */
export async function requireWorldAccess(worldId: string) {
  const user = await requireAuth()
  const hasAccess = await userHasWorldAccess(user.id, worldId)
  
  if (!hasAccess) {
    throw new Error('Access denied to this world')
  }
  
  return user
}

/**
 * Require world ownership
 * Throws an error if user doesn't own the world
 */
export async function requireWorldOwnership(worldId: string) {
  const user = await requireAuth()
  const isOwner = await userOwnsWorld(user.id, worldId)
  
  if (!isOwner) {
    throw new Error('Only the world owner can perform this action')
  }
  
  return user
}