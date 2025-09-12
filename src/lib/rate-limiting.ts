/**
 * Scalable Rate Limiting Service
 * 
 * This service provides scalable rate limiting that works in distributed environments.
 * It uses Redis/KV when available, with database fallback for persistence.
 */

import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { logError } from './logging'

// Rate limit configuration interface
export interface RateLimitConfig {
  bucket: string
  maxRequests: number
  windowSeconds: number
  description?: string
}

// Rate limit result interface
export interface RateLimitResult {
  allowed: boolean
  count: number
  remaining: number
  resetTime: number
  retryAfter: number
}

// Default rate limit configurations
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  'invites.create': { bucket: 'invites.create', maxRequests: 10, windowSeconds: 60 },
  'admin.seed': { bucket: 'admin.seed', maxRequests: 2, windowSeconds: 60 },
  'auth.login': { bucket: 'auth.login', maxRequests: 5, windowSeconds: 300 },
  'auth.register': { bucket: 'auth.register', maxRequests: 3, windowSeconds: 300 },
  'api.general': { bucket: 'api.general', maxRequests: 100, windowSeconds: 60 },
  'upload.files': { bucket: 'upload.files', maxRequests: 20, windowSeconds: 60 },
  'worlds.create': { bucket: 'worlds.create', maxRequests: 5, windowSeconds: 300 },
  'entities.create': { bucket: 'entities.create', maxRequests: 50, windowSeconds: 60 },
}

/**
 * Storage interface for rate limiting data
 */
interface RateLimitStorage {
  get(key: string): Promise<{ count: number; resetTime: number } | null>
  set(key: string, value: { count: number; resetTime: number }, ttlSeconds: number): Promise<void>
  increment(key: string, ttlSeconds: number): Promise<{ count: number; resetTime: number }>
}

/**
 * In-memory storage implementation (for development and fallback)
 */
class MemoryStorage implements RateLimitStorage {
  private store = new Map<string, { count: number; resetTime: number }>()

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const record = this.store.get(key)
    if (!record) return null
    
    // Check if expired
    if (Date.now() > record.resetTime) {
      this.store.delete(key)
      return null
    }
    
    return record
  }

  async set(key: string, value: { count: number; resetTime: number }, ttlSeconds: number): Promise<void> {
    this.store.set(key, value)
    
    // Set cleanup timeout
    setTimeout(() => {
      this.store.delete(key)
    }, ttlSeconds * 1000)
  }

  async increment(key: string, ttlSeconds: number): Promise<{ count: number; resetTime: number }> {
    const existing = await this.get(key)
    const now = Date.now()
    
    if (!existing) {
      const newRecord = { count: 1, resetTime: now + (ttlSeconds * 1000) }
      await this.set(key, newRecord, ttlSeconds)
      return newRecord
    }
    
    const updated = { count: existing.count + 1, resetTime: existing.resetTime }
    await this.set(key, updated, Math.ceil((updated.resetTime - now) / 1000))
    return updated
  }
}

/**
 * Vercel KV storage implementation (for production)
 */
class KVStorage implements RateLimitStorage {
  private kv: any = null

  constructor() {
    // Dynamically import Vercel KV if available
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        // This will only work if @vercel/kv is installed
        this.kv = require('@vercel/kv')
      } catch (error) {
        console.log('Vercel KV not available, falling back to memory storage')
      }
    }
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    if (!this.kv) return null
    
    try {
      const data = await this.kv.get(key)
      return data || null
    } catch (error) {
      logError('KV get error', error as Error, { action: 'kv_get', key })
      return null
    }
  }

  async set(key: string, value: { count: number; resetTime: number }, ttlSeconds: number): Promise<void> {
    if (!this.kv) return
    
    try {
      await this.kv.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (error) {
      logError('KV set error', error as Error, { action: 'kv_set', key })
    }
  }

  async increment(key: string, ttlSeconds: number): Promise<{ count: number; resetTime: number }> {
    if (!this.kv) {
      throw new Error('KV not available')
    }
    
    try {
      const now = Date.now()
      const resetTime = now + (ttlSeconds * 1000)
      
      // Use Redis-style increment with expiry
      const count = await this.kv.incr(key)
      
      if (count === 1) {
        // First increment, set expiry
        await this.kv.expire(key, ttlSeconds)
      }
      
      return { count, resetTime }
    } catch (error) {
      logError('KV increment error', error as Error, { action: 'kv_increment', key })
      throw error
    }
  }
}

/**
 * Rate limiting service class
 */
export class RateLimitService {
  private static instance: RateLimitService | null = null
  private storage: RateLimitStorage
  private fallbackStorage: MemoryStorage = new MemoryStorage()

  private constructor() {
    // Try to use KV storage first, fall back to memory
    const kvStorage = new KVStorage()
    this.storage = kvStorage
  }

  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService()
    }
    return RateLimitService.instance
  }

  /**
   * Extract client IP address from request
   */
  private getClientIp(req: NextRequest): string {
    // Check for forwarded IP first (common in production)
    const xForwardedFor = req.headers.get('x-forwarded-for')
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim()
    }

    // Check for real IP header
    const xRealIp = req.headers.get('x-real-ip')
    if (xRealIp) {
      return xRealIp.trim()
    }

    // Check for CF-Connecting-IP (Cloudflare)
    const cfConnectingIp = req.headers.get('cf-connecting-ip')
    if (cfConnectingIp) {
      return cfConnectingIp.trim()
    }

    // Fallback to localhost for development
    return '127.0.0.1'
  }

  /**
   * Generate a hashed key for rate limiting
   * Uses SHA-256 hash to protect IP privacy while maintaining uniqueness
   */
  private generateKey(ip: string, bucket: string): string {
    const key = `${ip}:${bucket}`
    const hash = crypto.createHash('sha256').update(key).digest('hex')
    return `rl:${hash.substring(0, 16)}` // Use first 16 chars for shorter keys
  }

  /**
   * Match request to rate limit bucket
   */
  private matchBucket(pathname: string, method: string): string | null {
    // Invite creation
    if (method === 'POST' && /^\/api\/worlds\/[\w-]+\/invites$/.test(pathname)) {
      return 'invites.create'
    }

    // Admin seeding
    if (method === 'POST' && pathname === '/api/admin/seed-core-templates') {
      return 'admin.seed'
    }

    // Authentication endpoints
    if (method === 'POST' && pathname === '/api/auth/sign-in') {
      return 'auth.login'
    }

    if (method === 'POST' && pathname === '/api/auth/sign-up') {
      return 'auth.register'
    }

    // File uploads
    if (method === 'POST' && pathname.includes('/upload')) {
      return 'upload.files'
    }

    // World creation
    if (method === 'POST' && pathname === '/api/worlds') {
      return 'worlds.create'
    }

    // Entity creation
    if (method === 'POST' && /^\/api\/worlds\/[\w-]+\/entities$/.test(pathname)) {
      return 'entities.create'
    }

    // General API rate limiting for all other API endpoints
    if (pathname.startsWith('/api/')) {
      return 'api.general'
    }

    return null
  }

  /**
   * Get configuration for a specific bucket
   */
  private getConfig(bucket: string): RateLimitConfig {
    return DEFAULT_CONFIGS[bucket] || DEFAULT_CONFIGS['api.general']
  }

  /**
   * Check if request should be rate limited
   */
  async checkRateLimit(req: NextRequest): Promise<RateLimitResult | null> {
    const bucket = this.matchBucket(req.nextUrl.pathname, req.method)
    
    if (!bucket) {
      return null // No rate limiting for this endpoint
    }

    const config = this.getConfig(bucket)
    const ip = this.getClientIp(req)
    const key = this.generateKey(ip, bucket)

    try {
      // Try primary storage first
      let record: { count: number; resetTime: number }
      
      try {
        record = await this.storage.increment(key, config.windowSeconds)
      } catch (error) {
        console.warn('Primary storage failed, using fallback:', error)
        record = await this.fallbackStorage.increment(key, config.windowSeconds)
      }

      const now = Date.now()
      const remaining = Math.max(0, config.maxRequests - record.count)
      const allowed = record.count <= config.maxRequests
      const retryAfter = allowed ? 0 : Math.ceil((record.resetTime - now) / 1000)

      return {
        allowed,
        count: record.count,
        remaining,
        resetTime: Math.floor(record.resetTime / 1000), // Convert to seconds
        retryAfter
      }
    } catch (error) {
      logError('Rate limit check error', error as Error, { action: 'rate_limit_check', endpoint: req.nextUrl.pathname })
      // On error, allow the request (fail open)
      return null
    }
  }

  /**
   * Get current rate limit status for a request (for monitoring)
   */
  getRateLimitInfo(req: NextRequest): {
    bucket: string | null
    config: RateLimitConfig | null
  } {
    const bucket = this.matchBucket(req.nextUrl.pathname, req.method)
    if (!bucket) {
      return { bucket: null, config: null }
    }

    return {
      bucket,
      config: this.getConfig(bucket)
    }
  }
}

/**
 * Convenience function to get rate limit service instance
 */
export function getRateLimitService(): RateLimitService {
  return RateLimitService.getInstance()
}

/**
 * Middleware-compatible rate limiting function
 */
export async function checkRateLimit(req: NextRequest): Promise<RateLimitResult | null> {
  const service = getRateLimitService()
  return service.checkRateLimit(req)
}

/**
 * Get rate limit configuration for monitoring
 */
export function getRateLimitConfigs(): Record<string, RateLimitConfig> {
  return { ...DEFAULT_CONFIGS }
}
