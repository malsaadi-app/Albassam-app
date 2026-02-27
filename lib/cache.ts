/**
 * Redis Cache Layer for Albassam Schools App
 * 
 * Provides caching utilities for:
 * - Dashboard statistics
 * - Frequently accessed data
 * - API responses
 * - Session data (optional)
 * 
 * Uses Upstash Redis (serverless, free tier available)
 * Falls back to in-memory cache when Redis unavailable
 */

import { Redis } from '@upstash/redis'
import { getMemoryCache } from './cache-memory'

// Initialize Redis client
// For local development without Redis, it will gracefully degrade
let redis: Redis | null = null
let useMemoryCache = false

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    
    // Test connection
    redis.ping().catch((err) => {
      console.warn('Redis ping failed, falling back to memory cache:', err.message)
      redis = null
      useMemoryCache = true
    })
  } else {
    console.info('Redis credentials not found, using in-memory cache')
    useMemoryCache = true
  }
} catch (error) {
  console.warn('Redis initialization failed, using in-memory cache:', error)
  useMemoryCache = true
}

// Get cache instance (Redis or Memory)
const memCache = getMemoryCache()

/**
 * Cache configuration
 */
export const CACHE_TTL = {
  DASHBOARD_STATS: 5 * 60, // 5 minutes
  USER_DATA: 15 * 60, // 15 minutes
  LIST_DATA: 10 * 60, // 10 minutes
  REFERENCE_DATA: 60 * 60, // 1 hour (branches, departments, etc.)
  REPORTS: 30 * 60, // 30 minutes
} as const

/**
 * Cache key prefixes
 */
export const CACHE_PREFIX = {
  DASHBOARD: 'dashboard',
  USER: 'user',
  EMPLOYEE: 'employee',
  ATTENDANCE: 'attendance',
  TASK: 'task',
  BRANCH: 'branch',
  DEPARTMENT: 'department',
  REPORT: 'report',
} as const

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redis !== null
}

/**
 * Check if using memory cache
 */
export function isUsingMemoryCache(): boolean {
  return useMemoryCache
}

/**
 * Get value from cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  // Try Redis first
  if (redis) {
    try {
      const value = await redis.get<T>(key)
      return value
    } catch (error) {
      console.error('Redis GET error:', error)
      // Fall through to memory cache
    }
  }
  
  // Fallback to memory cache
  if (useMemoryCache) {
    return memCache.get<T>(key)
  }
  
  return null
}

/**
 * Set value in cache
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL.LIST_DATA
): Promise<boolean> {
  // Try Redis first
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttl })
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      // Fall through to memory cache
    }
  }
  
  // Fallback to memory cache
  if (useMemoryCache) {
    return memCache.set(key, value, ttl)
  }
  
  return false
}

/**
 * Delete value from cache
 */
export async function deleteCached(key: string): Promise<boolean> {
  // Try Redis first
  if (redis) {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      // Fall through to memory cache
    }
  }
  
  // Fallback to memory cache
  if (useMemoryCache) {
    return memCache.delete(key)
  }
  
  return false
}

/**
 * Delete multiple keys by pattern
 */
export async function deleteCachedPattern(pattern: string): Promise<number> {
  if (!redis) return 0
  
  try {
    // Note: Upstash Redis doesn't support SCAN, so we'll use a list approach
    // For production, consider maintaining a separate key list
    console.warn('Pattern deletion not fully supported. Manual invalidation recommended.')
    return 0
  } catch (error) {
    console.error('Redis pattern delete error:', error)
    return 0
  }
}

/**
 * Cache wrapper function with automatic fallback
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.LIST_DATA
): Promise<T> {
  // Try to get from cache
  const cached = await getCached<T>(key)
  if (cached !== null) {
    return cached
  }
  
  // Cache miss - fetch fresh data
  const data = await fetchFn()
  
  // Store in cache (fire and forget)
  setCached(key, data, ttl).catch(err => 
    console.warn('Cache set failed:', err)
  )
  
  return data
}

/**
 * Build cache key
 */
export function buildCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return [prefix, ...parts].join(':')
}

/**
 * Invalidate user-related cache
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await deleteCached(buildCacheKey(CACHE_PREFIX.USER, userId))
  await deleteCached(buildCacheKey(CACHE_PREFIX.DASHBOARD, userId))
}

/**
 * Invalidate employee-related cache
 */
export async function invalidateEmployeeCache(employeeId?: string): Promise<void> {
  if (employeeId) {
    await deleteCached(buildCacheKey(CACHE_PREFIX.EMPLOYEE, employeeId))
  }
  // Invalidate list cache
  await deleteCached(buildCacheKey(CACHE_PREFIX.EMPLOYEE, 'list'))
}

/**
 * Invalidate attendance cache
 */
export async function invalidateAttendanceCache(date?: string): Promise<void> {
  if (date) {
    await deleteCached(buildCacheKey(CACHE_PREFIX.ATTENDANCE, date))
  }
  // Invalidate today's cache
  const today = new Date().toISOString().split('T')[0]
  await deleteCached(buildCacheKey(CACHE_PREFIX.ATTENDANCE, today))
}

/**
 * Invalidate dashboard cache
 */
export async function invalidateDashboardCache(userId?: string): Promise<void> {
  if (userId) {
    await deleteCached(buildCacheKey(CACHE_PREFIX.DASHBOARD, userId))
  } else {
    // Invalidate all dashboard caches (not ideal, but works)
    await deleteCached(buildCacheKey(CACHE_PREFIX.DASHBOARD, 'global'))
  }
}

/**
 * Clear all cache (use with caution)
 */
export async function clearAllCache(): Promise<boolean> {
  if (!redis) return false
  
  try {
    console.warn('FLUSHDB is not recommended in production. Use specific invalidations instead.')
    // For Upstash, we'll skip this for safety
    return false
  } catch (error) {
    console.error('Redis FLUSHDB error:', error)
    return false
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  available: boolean
  enabled: boolean
  type: 'redis' | 'memory' | 'none'
  stats?: any
} | null> {
  // Try Redis
  if (redis) {
    try {
      await redis.ping()
      return {
        available: true,
        enabled: true,
        type: 'redis',
      }
    } catch (error) {
      // Redis failed, check memory cache
    }
  }
  
  // Memory cache
  if (useMemoryCache) {
    return {
      available: true,
      enabled: true,
      type: 'memory',
      stats: memCache.stats(),
    }
  }
  
  // No cache available
  return {
    available: false,
    enabled: false,
    type: 'none',
  }
}

/**
 * Example: Cache dashboard stats
 */
export async function getCachedDashboardStats(userId: string) {
  const cacheKey = buildCacheKey(CACHE_PREFIX.DASHBOARD, userId)
  
  return withCache(
    cacheKey,
    async () => {
      // Fetch fresh data from database
      // This is just an example - implement actual logic
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        todayAttendance: 0,
      }
    },
    CACHE_TTL.DASHBOARD_STATS
  )
}

// Export Redis instance for advanced usage
export { redis }
