/**
 * Health Monitor Script
 * 
 * Runs periodic health checks and sends alerts if issues detected.
 * Designed to run as a cron job (every 5-15 minutes).
 * 
 * Checks:
 * - Database connectivity & latency
 * - Memory usage
 * - Error rates
 * - Cache health
 * - Disk space (if applicable)
 * 
 * Run with: npx tsx scripts/health-monitor.ts
 */

import { checkSystemHealth } from '../lib/monitoring';
import { Alerts } from '../lib/alerting';
import logger from '../lib/logger';

// Thresholds
const THRESHOLDS = {
  DATABASE_LATENCY_WARNING: 100, // ms
  DATABASE_LATENCY_CRITICAL: 500, // ms
  MEMORY_USAGE_WARNING: 85, // percent
  MEMORY_USAGE_CRITICAL: 95, // percent
  ERROR_RATE_WARNING: 2, // percent
  ERROR_RATE_CRITICAL: 5, // percent
};

async function main() {
  logger.info('Starting health monitor check...');

  try {
    // Get system health
    const health = await checkSystemHealth();

    logger.info('Health check completed', {
      status: health.status,
      checks: Object.keys(health.checks).map((key) => ({
        name: key,
        status: health.checks[key].status,
      })),
    });

    // Check database
    if (health.checks.database) {
      const dbStatus = health.checks.database.status;
      const dbLatency = parseFloat(health.checks.database.latency?.replace('ms', '') || '0');

      if (dbStatus === 'unhealthy') {
        await Alerts.databaseDown(health.checks.database.error);
        logger.error('Database is down!');
      } else if (dbLatency > THRESHOLDS.DATABASE_LATENCY_CRITICAL) {
        await Alerts.databaseSlow(dbLatency);
        logger.warn('Database latency is critical', { latency: dbLatency });
      } else if (dbLatency > THRESHOLDS.DATABASE_LATENCY_WARNING) {
        logger.warn('Database latency is high', { latency: dbLatency });
      }
    }

    // Check memory
    if (health.checks.memory) {
      const memUsage = parseFloat(health.checks.memory.usage?.replace('%', '') || '0');

      if (memUsage > THRESHOLDS.MEMORY_USAGE_CRITICAL) {
        await Alerts.highMemoryUsage(memUsage);
        logger.error('Memory usage is critical', { usage: memUsage });
      } else if (memUsage > THRESHOLDS.MEMORY_USAGE_WARNING) {
        logger.warn('Memory usage is high', { usage: memUsage });
      }
    }

    // Check cache
    if (health.checks.cache && health.checks.cache.status === 'degraded') {
      logger.warn('Cache is degraded', { cache: health.checks.cache });
    }

    // Overall status
    if (health.status === 'unhealthy') {
      logger.error('System is unhealthy!', { health });
    } else if (health.status === 'degraded') {
      logger.warn('System is degraded', { health });
    } else {
      logger.info('System is healthy ✓');
    }

    // Log completion
    logger.info('Health monitor check completed', {
      status: health.status,
      timestamp: health.timestamp,
    });
  } catch (error) {
    logger.error('Health monitor check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Send critical alert
    await Alerts.applicationCrashed(
      error instanceof Error ? error.message : 'Health monitor failed'
    );
  }
}

// Run main function
main()
  .then(() => {
    logger.info('Health monitor exiting normally');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Health monitor exiting with error', { error });
    process.exit(1);
  });

/**
 * Setup as OpenClaw cron job:
 * 
 * Schedule: Every 15 minutes
 * {
 *   "name": "Health Monitor",
 *   "schedule": {
 *     "kind": "every",
 *     "everyMs": 900000
 *   },
 *   "payload": {
 *     "kind": "systemEvent",
 *     "text": "Run health monitor: npx tsx scripts/health-monitor.ts"
 *   },
 *   "sessionTarget": "main"
 * }
 * 
 * Or run manually:
 * npx tsx scripts/health-monitor.ts
 * 
 * Or via pm2:
 * pm2 start "npx tsx scripts/health-monitor.ts" --name health-monitor --cron "0,15,30,45 * * * *" --no-autorestart
 */
