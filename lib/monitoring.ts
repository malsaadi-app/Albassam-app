/**
 * Application Monitoring
 * 
 * Collects and exposes metrics for:
 * - Application health
 * - Performance metrics
 * - Resource usage
 * - Error rates
 * - Custom business metrics
 */

import logger from './logger';

/**
 * Metric types
 */
type MetricValue = number | string | boolean;

/**
 * Metrics store
 */
class MetricsStore {
  private metrics: Map<string, MetricValue> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * Set a metric value
   */
  set(name: string, value: MetricValue): void {
    this.metrics.set(name, value);
  }

  /**
   * Get a metric value
   */
  get(name: string): MetricValue | undefined {
    return this.metrics.get(name);
  }

  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  /**
   * Set a gauge value
   */
  gauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  /**
   * Record a histogram value
   */
  histogram(name: string, value: number): void {
    const values = this.histograms.get(name) || [];
    values.push(value);
    
    // Keep last 100 values
    if (values.length > 100) {
      values.shift();
    }
    
    this.histograms.set(name, values);
  }

  /**
   * Get all metrics
   */
  getAll(): any {
    return {
      metrics: Object.fromEntries(this.metrics),
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([name, values]) => [
          name,
          {
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            p50: this.percentile(values, 0.5),
            p95: this.percentile(values, 0.95),
            p99: this.percentile(values, 0.99),
          },
        ])
      ),
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

// Singleton instance
const metricsStore = new MetricsStore();

/**
 * Performance tracker
 */
export class PerformanceTracker {
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = performance.now();
  }

  /**
   * End tracking and record duration
   */
  end(): number {
    const duration = performance.now() - this.startTime;
    metricsStore.histogram(`${this.name}.duration`, duration);
    return duration;
  }

  /**
   * End and log
   */
  endAndLog(message?: string): number {
    const duration = this.end();
    logger.debug(message || `${this.name} completed`, {
      duration: `${duration.toFixed(2)}ms`,
    });
    return duration;
  }
}

/**
 * Monitoring utilities
 */
export const Monitoring = {
  /**
   * Track a metric
   */
  set(name: string, value: MetricValue): void {
    metricsStore.set(name, value);
  },

  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1): void {
    metricsStore.increment(name, value);
  },

  /**
   * Set a gauge
   */
  gauge(name: string, value: number): void {
    metricsStore.gauge(name, value);
  },

  /**
   * Record duration
   */
  histogram(name: string, value: number): void {
    metricsStore.histogram(name, value);
  },

  /**
   * Start performance tracking
   */
  track(name: string): PerformanceTracker {
    return new PerformanceTracker(name);
  },

  /**
   * Track async function
   */
  async trackAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const tracker = new PerformanceTracker(name);
    try {
      const result = await fn();
      tracker.endAndLog();
      metricsStore.increment(`${name}.success`);
      return result;
    } catch (error) {
      tracker.endAndLog(`${name} failed`);
      metricsStore.increment(`${name}.error`);
      throw error;
    }
  },

  /**
   * Get all metrics
   */
  getMetrics(): any {
    return metricsStore.getAll();
  },

  /**
   * Reset metrics
   */
  reset(): void {
    metricsStore.reset();
  },

  /**
   * Record API request
   */
  recordRequest(method: string, endpoint: string, status: number, duration: number): void {
    metricsStore.increment('api.requests.total');
    metricsStore.increment(`api.requests.${method.toLowerCase()}`);
    metricsStore.increment(`api.status.${status}`);
    metricsStore.histogram('api.duration', duration);
    
    if (status >= 500) {
      metricsStore.increment('api.errors.5xx');
    } else if (status >= 400) {
      metricsStore.increment('api.errors.4xx');
    }
  },

  /**
   * Record database query
   */
  recordQuery(duration: number, success: boolean): void {
    metricsStore.increment('db.queries.total');
    metricsStore.histogram('db.query.duration', duration);
    
    if (success) {
      metricsStore.increment('db.queries.success');
    } else {
      metricsStore.increment('db.queries.error');
    }
  },

  /**
   * Record cache operation
   */
  recordCacheOp(operation: 'hit' | 'miss' | 'set', duration: number): void {
    metricsStore.increment(`cache.${operation}`);
    metricsStore.histogram(`cache.${operation}.duration`, duration);
    
    // Calculate hit rate
    const hits = metricsStore.get('cache.hit') as number || 0;
    const misses = metricsStore.get('cache.miss') as number || 0;
    const total = hits + misses;
    
    if (total > 0) {
      const hitRate = hits / total;
      metricsStore.gauge('cache.hit_rate', hitRate);
    }
  },
};

/**
 * System health check
 */
export async function checkSystemHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: any;
  timestamp: string;
}> {
  const checks: any = {};

  try {
    // Check database
    const dbStart = performance.now();
    try {
      const { default: prisma } = await import('./prisma');
      await prisma.$queryRaw`SELECT 1`;
      checks.database = {
        status: 'healthy',
        latency: `${(performance.now() - dbStart).toFixed(2)}ms`,
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Check cache
    const cacheStart = performance.now();
    try {
      const { getCacheStats } = await import('./cache');
      const cacheStats = await getCacheStats();
      checks.cache = {
        status: cacheStats?.available ? 'healthy' : 'degraded',
        type: cacheStats?.type || 'none',
        latency: `${(performance.now() - cacheStart).toFixed(2)}ms`,
      };
    } catch (error) {
      checks.cache = {
        status: 'degraded',
        error: 'Cache unavailable',
      };
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    checks.memory = {
      status: memUsage.heapUsed < memUsage.heapTotal * 0.9 ? 'healthy' : 'degraded',
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      usage: `${Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)}%`,
    };

    // Check uptime
    checks.uptime = {
      status: 'healthy',
      seconds: Math.floor(process.uptime()),
      formatted: formatUptime(process.uptime()),
    };

    // Overall status
    const statuses = Object.values(checks).map((c: any) => c.status);
    const status = statuses.includes('unhealthy')
      ? 'unhealthy'
      : statuses.includes('degraded')
      ? 'degraded'
      : 'healthy';

    return {
      status,
      checks,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Health check failed', { error });
    return {
      status: 'unhealthy',
      checks: { error: 'Health check failed' },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Format uptime
 */
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
 * Start periodic metrics collection
 */
export function startMetricsCollection(intervalMs: number = 60000): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      // Collect system metrics
      const memUsage = process.memoryUsage();
      Monitoring.gauge('system.memory.heap_used', memUsage.heapUsed);
      Monitoring.gauge('system.memory.heap_total', memUsage.heapTotal);
      Monitoring.gauge('system.uptime', process.uptime());

      // Log metrics summary
      const metrics = Monitoring.getMetrics();
      logger.debug('Metrics collected', metrics);
    } catch (error) {
      logger.error('Failed to collect metrics', { error });
    }
  }, intervalMs);
}

/**
 * Usage Examples:
 * 
 * 1. Track API request:
 * const tracker = Monitoring.track('api.employees.get');
 * const employees = await prisma.employee.findMany();
 * const duration = tracker.end();
 * Monitoring.recordRequest('GET', '/api/employees', 200, duration);
 * 
 * 2. Track async function:
 * const result = await Monitoring.trackAsync('fetchEmployees', async () => {
 *   return await prisma.employee.findMany();
 * });
 * 
 * 3. Custom metrics:
 * Monitoring.increment('user.login');
 * Monitoring.gauge('active_users', 150);
 * Monitoring.histogram('response_time', 45);
 * 
 * 4. Health check:
 * const health = await checkSystemHealth();
 * console.log(health.status); // 'healthy' | 'degraded' | 'unhealthy'
 */
