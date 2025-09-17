/**
 * World Access Cache - Optimizes world access checks to prevent N+1 queries
 * Uses LRU cache with TTL for performance without sacrificing security
 */

interface CacheEntry {
  hasAccess: boolean;
  timestamp: number;
  ttl: number;
}

class WorldAccessCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxSize = 1000; // Maximum cache entries

  /**
   * Generate cache key for user-world pair
   */
  private getCacheKey(worldId: string, userId: string): string {
    return `${userId}:${worldId}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Clean expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict oldest entries if cache is at capacity
   */
  private evictOldest(): void {
    if (this.cache.size >= this.maxSize) {
      // Find and remove the oldest entry
      let oldestKey = '';
      let oldestTime = Date.now();

      for (const [key, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Get cached access result if available and valid
   */
  get(worldId: string, userId: string): boolean | null {
    const key = this.getCacheKey(worldId, userId);
    const entry = this.cache.get(key);

    if (!entry || !this.isValid(entry)) {
      if (entry) {
        this.cache.delete(key); // Remove expired entry
      }
      return null;
    }

    return entry.hasAccess;
  }

  /**
   * Cache access result with optional custom TTL
   */
  set(worldId: string, userId: string, hasAccess: boolean, ttl?: number): void {
    this.cleanup(); // Clean expired entries first
    this.evictOldest(); // Ensure space for new entry

    const key = this.getCacheKey(worldId, userId);
    this.cache.set(key, {
      hasAccess,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Invalidate cache for specific world (when world permissions change)
   */
  invalidateWorld(worldId: string): void {
    for (const key of this.cache.keys()) {
      if (key.endsWith(`:${worldId}`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate cache for specific user (when user permissions change)
   */
  invalidateUser(userId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): {
    size: number;
    hitRate: number;
    maxSize: number;
  } {
    return {
      size: this.cache.size,
      hitRate: this.hitRate,
      maxSize: this.maxSize
    };
  }

  // Track hit rate for performance monitoring
  private hits = 0;
  private misses = 0;

  private get hitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  /**
   * Get with hit/miss tracking
   */
  getWithStats(worldId: string, userId: string): boolean | null {
    const result = this.get(worldId, userId);
    if (result !== null) {
      this.hits++;
    } else {
      this.misses++;
    }
    return result;
  }

  /**
   * Bulk cache operations for efficient batch access checks
   */
  getBulk(worldIds: string[], userId: string): Map<string, boolean | null> {
    const results = new Map<string, boolean | null>();

    for (const worldId of worldIds) {
      results.set(worldId, this.getWithStats(worldId, userId));
    }

    return results;
  }

  /**
   * Set multiple entries efficiently
   */
  setBulk(entries: Array<{ worldId: string; userId: string; hasAccess: boolean }>, ttl?: number): void {
    for (const entry of entries) {
      this.set(entry.worldId, entry.userId, entry.hasAccess, ttl);
    }
  }
}

// Export singleton instance
export const worldAccessCache = new WorldAccessCache();

// Export type for testing
export type { CacheEntry };