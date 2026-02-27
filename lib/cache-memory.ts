/**
 * In-Memory Cache (Fallback when Redis unavailable)
 * 
 * Simple LRU cache implementation for development/fallback
 * Not suitable for production with multiple instances
 * Use Redis for production
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  accessCount: number;
  lastAccess: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccess = Date.now();
    this.hits++;

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttlSeconds: number = 60): boolean {
    // Enforce max size (LRU eviction)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      accessCount: 0,
      lastAccess: Date.now(),
    };

    this.cache.set(key, entry);
    return true;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache stats
   */
  stats(): {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean expired entries (garbage collection)
   */
  cleanExpired(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Singleton instance
let memoryCache: MemoryCache | null = null;

export function getMemoryCache(): MemoryCache {
  if (!memoryCache) {
    memoryCache = new MemoryCache(1000); // Max 1000 entries

    // Auto-cleanup expired entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        const removed = memoryCache!.cleanExpired();
        if (removed > 0) {
          console.log(`[MemoryCache] Cleaned ${removed} expired entries`);
        }
      }, 5 * 60 * 1000);
    }
  }

  return memoryCache;
}

export default MemoryCache;

/**
 * Usage:
 * 
 * import { getMemoryCache } from '@/lib/cache-memory';
 * 
 * const cache = getMemoryCache();
 * 
 * // Set
 * cache.set('user:123', { name: 'Mohammed' }, 300); // 5 minutes TTL
 * 
 * // Get
 * const user = cache.get('user:123');
 * 
 * // Delete
 * cache.delete('user:123');
 * 
 * // Stats
 * console.log(cache.stats());
 * // { size: 150, hits: 450, misses: 50, hitRate: 0.9 }
 */
