import { Pool } from 'pg'

// Create connection pool with fallback connection string
const getConnectionString = () => {
  return process.env.DATABASE_URL || 'postgresql://worldweaver_user:worldweaver2025!@localhost:5432/worldweaver_dev'
}

const pool = new Pool({
  connectionString: getConnectionString(),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export class LocalDatabaseService {
  async query(text: string, params?: any[]) {
    const client = await pool.connect()
    try {
      const result = await client.query(text, params)
      return result
    } finally {
      client.release()
    }
  }

  // ================================
  // User Operations
  // ================================

  async createUser(email: string, passwordHash?: string) {
    const result = await this.query(
      'INSERT INTO auth_users (email, password_hash, email_confirmed) VALUES ($1, $2, $3) RETURNING *',
      [email, passwordHash, true]
    )
    return result.rows[0]
  }

  async getUserByEmail(email: string) {
    const result = await this.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [email]
    )
    return result.rows[0]
  }

  async getUserById(id: string) {
    const result = await this.query(
      'SELECT * FROM auth_users WHERE id = $1',
      [id]
    )
    return result.rows[0]
  }

  // ================================
  // Profile Operations
  // ================================

  async getProfile(userId: string) {
    const result = await this.query(
      'SELECT * FROM profiles WHERE id = $1',
      [userId]
    )
    return result.rows[0]
  }

  async updateProfile(userId: string, data: any) {
    const { full_name, username, bio, website, avatar_url } = data
    const result = await this.query(
      `UPDATE profiles 
       SET full_name = COALESCE($2, full_name),
           username = COALESCE($3, username),
           bio = COALESCE($4, bio),
           website = COALESCE($5, website),
           avatar_url = COALESCE($6, avatar_url),
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [userId, full_name, username, bio, website, avatar_url]
    )
    return result.rows[0]
  }

  // ================================
  // World Operations
  // ================================

  async createWorld(name: string, description: string, ownerId: string) {
    const result = await this.query(
      'INSERT INTO worlds (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, ownerId]
    )
    return result.rows[0]
  }

  async getWorldsByUser(userId: string) {
    const result = await this.query(`
      SELECT w.*, 
             COUNT(e.id) as entity_count,
             (SELECT COUNT(*) FROM world_members wm WHERE wm.world_id = w.id) as member_count
      FROM worlds w
      LEFT JOIN entities e ON e.world_id = w.id AND e.is_archived = false
      WHERE w.owner_id = $1 OR w.id IN (
        SELECT world_id FROM world_members WHERE user_id = $1
      )
      GROUP BY w.id
      ORDER BY w.updated_at DESC
    `, [userId])
    return result.rows
  }

  async getWorldById(worldId: string, userId: string) {
    const result = await this.query(`
      SELECT w.*, 
             COUNT(e.id) as entity_count
      FROM worlds w
      LEFT JOIN entities e ON e.world_id = w.id AND e.is_archived = false
      WHERE w.id = $1 
        AND (w.owner_id = $2 OR w.is_public = true OR EXISTS (
          SELECT 1 FROM world_members wm WHERE wm.world_id = w.id AND wm.user_id = $2
        ))
      GROUP BY w.id
    `, [worldId, userId])
    return result.rows[0]
  }

  async updateWorld(worldId: string, data: any) {
    const { name, description, is_public, is_archived, cover_image, settings } = data
    const result = await this.query(
      `UPDATE worlds 
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           is_public = COALESCE($4, is_public),
           is_archived = COALESCE($5, is_archived),
           cover_image = COALESCE($6, cover_image),
           settings = COALESCE($7, settings),
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [worldId, name, description, is_public, is_archived, cover_image, JSON.stringify(settings)]
    )
    return result.rows[0]
  }

  async deleteWorld(worldId: string) {
    const result = await this.query(
      'DELETE FROM worlds WHERE id = $1 RETURNING *',
      [worldId]
    )
    return result.rows[0]
  }

  // ================================
  // Template Operations
  // ================================

  async getSystemTemplates() {
    const result = await this.query(
      'SELECT * FROM templates WHERE is_system = true ORDER BY name'
    )
    return result.rows
  }

  async getWorldTemplates(worldId: string) {
    const result = await this.query(
      'SELECT * FROM templates WHERE world_id = $1 ORDER BY name',
      [worldId]
    )
    return result.rows
  }

  async getAllTemplates(worldId?: string) {
    let query = 'SELECT * FROM templates WHERE is_system = true'
    let params: any[] = []
    
    if (worldId) {
      query += ' OR world_id = $1'
      params = [worldId]
    }
    
    query += ' ORDER BY is_system DESC, name'
    
    const result = await this.query(query, params)
    return result.rows
  }

  // ================================
  // Entity Operations
  // ================================

  async createEntity(data: any) {
    const { name, description, template_id, world_id, folder_id, entity_data, image_url, tags, created_by } = data
    const result = await this.query(
      `INSERT INTO entities (name, description, template_id, world_id, folder_id, data, image_url, tags, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, description, template_id, world_id, folder_id, JSON.stringify(entity_data || {}), image_url, tags, created_by]
    )
    return result.rows[0]
  }

  async getEntitiesByWorld(worldId: string) {
    const result = await this.query(`
      SELECT e.*, t.name as template_name, t.category as template_category
      FROM entities e
      LEFT JOIN templates t ON e.template_id = t.id
      WHERE e.world_id = $1 AND e.is_archived = false
      ORDER BY e.updated_at DESC
    `, [worldId])
    return result.rows
  }

  async getEntityById(entityId: string) {
    const result = await this.query(`
      SELECT e.*, t.name as template_name, t.fields as template_fields
      FROM entities e
      LEFT JOIN templates t ON e.template_id = t.id
      WHERE e.id = $1
    `, [entityId])
    return result.rows[0]
  }

  // ================================
  // Utility Operations
  // ================================

  async testConnection() {
    const result = await this.query('SELECT NOW() as current_time')
    return result.rows[0]
  }

  async getStats() {
    const tables = await this.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    const templates = await this.query('SELECT COUNT(*) FROM templates WHERE is_system = true')
    const users = await this.query('SELECT COUNT(*) FROM auth_users')
    const worlds = await this.query('SELECT COUNT(*) FROM worlds')
    
    return {
      tables: tables.rows.length,
      systemTemplates: parseInt(templates.rows[0].count),
      users: parseInt(users.rows[0].count),
      worlds: parseInt(worlds.rows[0].count)
    }
  }
}

// Export singleton instance
export const localDb = new LocalDatabaseService()

// Export types for use in the app
export interface AuthUser {
  id: string
  email: string
  password_hash?: string
  email_confirmed: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  username?: string
  bio?: string
  website?: string
  created_at: string
  updated_at: string
}

export interface World {
  id: string
  name: string
  description?: string
  cover_image?: string
  owner_id: string
  is_public: boolean
  is_archived: boolean
  settings: any
  created_at: string
  updated_at: string
  entity_count?: number
  member_count?: number
}

export interface Template {
  id: string
  name: string
  description?: string
  icon?: string
  category?: string
  fields: any[]
  is_system: boolean
  world_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Entity {
  id: string
  name: string
  description?: string
  template_id?: string
  world_id: string
  folder_id?: string
  data: any
  image_url?: string
  tags?: string[]
  is_archived: boolean
  created_by?: string
  created_at: string
  updated_at: string
  template_name?: string
  template_category?: string
  template_fields?: any[]
}
