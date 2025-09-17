/**
 * AI Context Cache - Optimizes world context building for AI generation
 * Caches expensive context string building to reduce token costs and latency
 */

import { World } from '@/lib/types';
import { createHash } from 'crypto';

interface ContextCacheEntry {
  contextString: string;
  hash: string;
  timestamp: number;
  ttl: number;
}

type WorldContextFields = Pick<World, 'name' | 'description' | 'summary' | 'logline' | 'genreBlend' | 'overallTone' | 'keyThemes' | 'audienceRating' | 'scopeScale' | 'technologyLevel' | 'magicLevel' | 'cosmologyModel' | 'climateBiomes' | 'calendarTimekeeping' | 'societalOverview' | 'conflictDrivers' | 'rulesConstraints' | 'aestheticDirection'>;

class AIContextCache {
  private cache = new Map<string, ContextCacheEntry>();
  private readonly defaultTTL = 30 * 60 * 1000; // 30 minutes (longer since world context changes less frequently)
  private readonly maxSize = 500; // Maximum cache entries

  /**
   * Generate a content hash for the world context to detect changes
   */
  private generateContextHash(worldContext?: WorldContextFields): string {
    if (!worldContext) return 'empty';

    // Create a normalized representation for hashing
    const normalizedContext = {
      name: worldContext.name || '',
      description: worldContext.description || '',
      summary: worldContext.summary || '',
      logline: worldContext.logline || '',
      genreBlend: (worldContext.genreBlend || []).sort().join(','),
      overallTone: Array.isArray(worldContext.overallTone)
        ? worldContext.overallTone.sort().join(',')
        : (worldContext.overallTone || ''),
      keyThemes: (worldContext.keyThemes || []).sort().join(','),
      audienceRating: worldContext.audienceRating || '',
      scopeScale: worldContext.scopeScale || '',
      technologyLevel: (worldContext.technologyLevel || []).sort().join(','),
      magicLevel: (worldContext.magicLevel || []).sort().join(','),
      cosmologyModel: worldContext.cosmologyModel || '',
      climateBiomes: (worldContext.climateBiomes || []).sort().join(','),
      calendarTimekeeping: worldContext.calendarTimekeeping || '',
      societalOverview: worldContext.societalOverview || '',
      conflictDrivers: Array.isArray(worldContext.conflictDrivers)
        ? worldContext.conflictDrivers.sort().join(',')
        : (worldContext.conflictDrivers || ''),
      rulesConstraints: worldContext.rulesConstraints || '',
      aestheticDirection: worldContext.aestheticDirection || ''
    };

    return createHash('sha256')
      .update(JSON.stringify(normalizedContext))
      .digest('hex')
      .substring(0, 16); // Use first 16 chars for shorter cache keys
  }

  /**
   * Build the actual world context string (extracted from AIService)
   */
  private buildWorldContextString(worldContext?: WorldContextFields): string {
    if (!worldContext) return '';

    let context = '';
    if (worldContext.name) context += `World: ${worldContext.name}\n`;
    if (worldContext.summary) context += `Summary: ${worldContext.summary}\n`;
    if (worldContext.description) context += `Description: ${worldContext.description}\n`;
    if (worldContext.logline) context += `Logline: ${worldContext.logline}\n`;
    if (worldContext.genreBlend?.length) context += `Genre: ${worldContext.genreBlend.join(', ')}\n`;
    if (worldContext.overallTone) {
      const tone = Array.isArray(worldContext.overallTone)
        ? worldContext.overallTone.join(', ')
        : worldContext.overallTone;
      context += `Tone: ${tone}\n`;
    }
    if (worldContext.keyThemes?.length) context += `Theme: ${worldContext.keyThemes.join(', ')}\n`;
    if (worldContext.audienceRating) context += `Audience Rating: ${worldContext.audienceRating}\n`;
    if (worldContext.scopeScale) context += `Scope & Scale: ${worldContext.scopeScale}\n`;
    if (worldContext.technologyLevel?.length) context += `Technology Level: ${worldContext.technologyLevel.join(', ')}\n`;
    if (worldContext.magicLevel?.length) context += `Magic Level: ${worldContext.magicLevel.join(', ')}\n`;
    if (worldContext.cosmologyModel) context += `Cosmology: ${worldContext.cosmologyModel}\n`;
    if (worldContext.climateBiomes?.length) context += `Travel Difficulty: ${worldContext.climateBiomes.join(', ')}\n`;
    if (worldContext.calendarTimekeeping) context += `Calendar & Timekeeping: ${worldContext.calendarTimekeeping}\n`;
    if (worldContext.societalOverview) context += `Societal Overview: ${worldContext.societalOverview}\n`;
    if (worldContext.conflictDrivers) {
      const drivers = Array.isArray(worldContext.conflictDrivers)
        ? worldContext.conflictDrivers.join(', ')
        : worldContext.conflictDrivers;
      context += `Conflict Drivers: ${drivers}\n`;
    }
    if (worldContext.rulesConstraints) context += `Rules & Constraints: ${worldContext.rulesConstraints}\n`;
    if (worldContext.aestheticDirection) context += `Aesthetic Direction: ${worldContext.aestheticDirection}\n`;

    return context ? `World Context:\n${context}\n` : '';
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: ContextCacheEntry): boolean {
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
   * Get cached world context or build and cache it
   */
  getWorldContext(worldContext?: WorldContextFields, customTTL?: number): string {
    const hash = this.generateContextHash(worldContext);
    const cached = this.cache.get(hash);

    // Return cached result if valid
    if (cached && this.isValid(cached)) {
      this.hits++;
      return cached.contextString;
    }

    // Build new context string
    this.misses++;
    const contextString = this.buildWorldContextString(worldContext);

    // Clean up before adding new entry
    this.cleanup();
    this.evictOldest();

    // Cache the result
    this.cache.set(hash, {
      contextString,
      hash,
      timestamp: Date.now(),
      ttl: customTTL || this.defaultTTL
    });

    return contextString;
  }

  /**
   * Manually invalidate cache for a specific world context
   * Useful when world data is updated
   */
  invalidateContext(worldContext?: WorldContextFields): void {
    const hash = this.generateContextHash(worldContext);
    this.cache.delete(hash);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  // Performance tracking
  private hits = 0;
  private misses = 0;

  /**
   * Get cache performance statistics
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    maxSize: number;
  } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : this.hits / total,
      maxSize: this.maxSize
    };
  }

  /**
   * Estimate token savings from caching
   * Rough estimate: ~4 characters per token for context strings
   */
  getTokenSavings(): {
    estimatedTokensSaved: number;
    estimatedCostSavedUSD: number;
  } {
    let totalContextLength = 0;

    for (const entry of this.cache.values()) {
      totalContextLength += entry.contextString.length;
    }

    // Rough token estimation (4 chars per token on average)
    const estimatedTokensSaved = Math.floor((totalContextLength * this.hits) / 4);

    // Estimate cost savings based on gpt-5-mini pricing (~$0.00015 per 1K tokens)
    const estimatedCostSavedUSD = (estimatedTokensSaved / 1000) * 0.00015;

    return {
      estimatedTokensSaved,
      estimatedCostSavedUSD
    };
  }

  /**
   * Get cache entries for debugging/monitoring
   */
  getEntries(): Array<{
    hash: string;
    contextLength: number;
    age: number;
    ttl: number;
  }> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([hash, entry]) => ({
      hash,
      contextLength: entry.contextString.length,
      age: now - entry.timestamp,
      ttl: entry.ttl
    }));
  }
}

// Export singleton instance
export const aiContextCache = new AIContextCache();

// Export types for testing
export type { ContextCacheEntry, WorldContextFields };