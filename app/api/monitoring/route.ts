/**
 * Monitoring API
 * GET /api/monitoring
 * 
 * Returns comprehensive monitoring data:
 * - System health
 * - Performance metrics
 * - Resource usage
 * - Error rates
 * - Custom metrics
 */

import { NextResponse } from 'next/server';
import { Monitoring, checkSystemHealth } from '@/lib/monitoring';
import { getCacheStats } from '@/lib/cache';

export async function GET() {
  try {
    // Get system health
    const health = await checkSystemHealth();

    // Get performance metrics
    const metrics = Monitoring.getMetrics();

    // Get cache stats
    const cacheStats = await getCacheStats();

    // Memory usage
    const memUsage = process.memoryUsage();
    const memory = {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      usage: `${Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)}%`,
    };

    // Process info
    const process_info = {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.floor(process.uptime()),
      uptimeFormatted: formatUptime(process.uptime()),
    };

    // Calculate rates
    const apiRequests = metrics.counters['api.requests.total'] || 0;
    const apiErrors = (metrics.counters['api.errors.4xx'] || 0) + (metrics.counters['api.errors.5xx'] || 0);
    const errorRate = apiRequests > 0 ? (apiErrors / apiRequests) * 100 : 0;

    const dbQueries = metrics.counters['db.queries.total'] || 0;
    const dbErrors = metrics.counters['db.queries.error'] || 0;
    const dbErrorRate = dbQueries > 0 ? (dbErrors / dbQueries) * 100 : 0;

    return NextResponse.json({
      status: health.status,
      timestamp: new Date().toISOString(),
      
      // Health checks
      health: health.checks,

      // Performance metrics
      performance: {
        api: {
          requests: apiRequests,
          errors: apiErrors,
          errorRate: `${errorRate.toFixed(2)}%`,
          avgDuration: metrics.histograms['api.duration']?.avg
            ? `${metrics.histograms['api.duration'].avg.toFixed(2)}ms`
            : 'N/A',
          p95Duration: metrics.histograms['api.duration']?.p95
            ? `${metrics.histograms['api.duration'].p95.toFixed(2)}ms`
            : 'N/A',
        },
        database: {
          queries: dbQueries,
          errors: dbErrors,
          errorRate: `${dbErrorRate.toFixed(2)}%`,
          avgDuration: metrics.histograms['db.query.duration']?.avg
            ? `${metrics.histograms['db.query.duration'].avg.toFixed(2)}ms`
            : 'N/A',
        },
        cache: {
          ...cacheStats,
          hitRate: metrics.gauges['cache.hit_rate']
            ? `${(metrics.gauges['cache.hit_rate'] * 100).toFixed(1)}%`
            : 'N/A',
        },
      },

      // Resource usage
      resources: {
        memory,
        process: process_info,
      },

      // Raw metrics (for advanced monitoring)
      metrics: {
        counters: metrics.counters,
        gauges: metrics.gauges,
        histograms: metrics.histograms,
      },
    });
  } catch (error) {
    console.error('Monitoring error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Failed to collect monitoring data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '< 1m';
}

/**
 * Usage:
 * 
 * curl -s http://localhost:3000/api/monitoring | jq '.'
 * 
 * Example response:
 * {
 *   "status": "healthy",
 *   "health": {
 *     "database": { "status": "healthy", "latency": "2.15ms" },
 *     "cache": { "status": "healthy", "type": "memory" },
 *     "memory": { "status": "healthy", "usage": "45%" },
 *     "uptime": { "status": "healthy", "formatted": "2h 15m" }
 *   },
 *   "performance": {
 *     "api": {
 *       "requests": 1250,
 *       "errors": 5,
 *       "errorRate": "0.40%",
 *       "avgDuration": "45.32ms",
 *       "p95Duration": "120.50ms"
 *     },
 *     "database": {
 *       "queries": 850,
 *       "errors": 2,
 *       "errorRate": "0.24%",
 *       "avgDuration": "12.45ms"
 *     },
 *     "cache": {
 *       "available": true,
 *       "type": "memory",
 *       "hitRate": "85.7%"
 *     }
 *   },
 *   "resources": {
 *     "memory": {
 *       "heapUsed": "66MB",
 *       "heapTotal": "128MB",
 *       "usage": "52%"
 *     },
 *     "process": {
 *       "uptime": 8100,
 *       "uptimeFormatted": "2h 15m"
 *     }
 *   }
 * }
 */
