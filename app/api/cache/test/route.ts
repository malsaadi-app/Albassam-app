/**
 * Cache Performance Test API
 * GET /api/cache/test
 * 
 * Tests cache performance by:
 * 1. Reading from cache (cold)
 * 2. Writing to cache
 * 3. Reading from cache (hot)
 * 4. Measuring latency
 */

import { NextResponse } from 'next/server';
import { getCached, setCached, getCacheStats, isUsingMemoryCache } from '@/lib/cache';

export async function GET() {
  try {
    const testKey = 'cache:test:performance';
    const testValue = {
      message: 'This is a test value',
      timestamp: Date.now(),
      data: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random(),
      })),
    };

    // Test 1: Cold read (cache miss)
    const coldStart = performance.now();
    const coldValue = await getCached(testKey);
    const coldLatency = performance.now() - coldStart;

    // Test 2: Write
    const writeStart = performance.now();
    await setCached(testKey, testValue, 60); // 1 minute TTL
    const writeLatency = performance.now() - writeStart;

    // Test 3: Hot read (cache hit)
    const hotStart = performance.now();
    const hotValue = await getCached(testKey);
    const hotLatency = performance.now() - hotStart;

    // Test 4: Multiple reads (measure consistency)
    const multiReadStart = performance.now();
    const reads = await Promise.all([
      getCached(testKey),
      getCached(testKey),
      getCached(testKey),
      getCached(testKey),
      getCached(testKey),
    ]);
    const multiReadLatency = performance.now() - multiReadStart;

    // Get cache stats
    const stats = await getCacheStats();

    return NextResponse.json({
      success: true,
      cacheType: isUsingMemoryCache() ? 'memory' : 'redis',
      stats,
      performance: {
        coldRead: {
          latency: `${coldLatency.toFixed(2)} ms`,
          hit: coldValue !== null,
        },
        write: {
          latency: `${writeLatency.toFixed(2)} ms`,
        },
        hotRead: {
          latency: `${hotLatency.toFixed(2)} ms`,
          hit: hotValue !== null,
          improvement: coldLatency > 0 
            ? `${((1 - hotLatency / coldLatency) * 100).toFixed(1)}% faster`
            : 'N/A',
        },
        multiRead: {
          latency: `${multiReadLatency.toFixed(2)} ms`,
          avgPerRead: `${(multiReadLatency / 5).toFixed(2)} ms`,
          allHits: reads.every(r => r !== null),
        },
      },
      recommendations: {
        cacheType: isUsingMemoryCache() 
          ? '⚠️ Using in-memory cache. Consider Redis for production.'
          : '✅ Using Redis. Good for production.',
        performance: hotLatency < 5
          ? '✅ Excellent cache performance (< 5ms)'
          : hotLatency < 20
          ? '⚡ Good cache performance (< 20ms)'
          : '⚠️ Cache latency high. Check Redis connection.',
      },
    });
  } catch (error) {
    console.error('Cache test error:', error);
    return NextResponse.json(
      {
        error: 'Cache test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Usage:
 * 
 * curl -s http://localhost:3000/api/cache/test | jq '.'
 * 
 * Example response:
 * {
 *   "success": true,
 *   "cacheType": "memory",
 *   "stats": {
 *     "available": true,
 *     "enabled": true,
 *     "type": "memory",
 *     "stats": {
 *       "size": 1,
 *       "maxSize": 1000,
 *       "hits": 5,
 *       "misses": 1,
 *       "hitRate": 0.833
 *     }
 *   },
 *   "performance": {
 *     "coldRead": {
 *       "latency": "0.15 ms",
 *       "hit": false
 *     },
 *     "write": {
 *       "latency": "0.08 ms"
 *     },
 *     "hotRead": {
 *       "latency": "0.05 ms",
 *       "hit": true,
 *       "improvement": "66.7% faster"
 *     },
 *     "multiRead": {
 *       "latency": "0.25 ms",
 *       "avgPerRead": "0.05 ms",
 *       "allHits": true
 *     }
 *   },
 *   "recommendations": {
 *     "cacheType": "⚠️ Using in-memory cache. Consider Redis for production.",
 *     "performance": "✅ Excellent cache performance (< 5ms)"
 *   }
 * }
 */
