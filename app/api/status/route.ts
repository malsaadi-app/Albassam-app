/**
 * Public Status API
 * GET /api/status
 * 
 * Returns public-facing status information:
 * - Application status
 * - Database connectivity
 * - Uptime
 * - No sensitive data exposed
 * 
 * This endpoint is designed for:
 * - UptimeRobot monitoring
 * - Public status pages
 * - User-facing health checks
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const startTime = performance.now();

    // Check database
    let databaseStatus: 'operational' | 'degraded' | 'down' = 'operational';
    let databaseLatency = 0;

    try {
      const dbStart = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      databaseLatency = performance.now() - dbStart;

      if (databaseLatency > 100) {
        databaseStatus = 'degraded';
      }
    } catch (error) {
      databaseStatus = 'down';
    }

    // Overall status
    let status: 'operational' | 'degraded' | 'down' = 'operational';

    if (databaseStatus === 'down') {
      status = 'down';
    } else if (databaseStatus === 'degraded') {
      status = 'degraded';
    }

    // Response time
    const responseTime = performance.now() - startTime;

    return NextResponse.json({
      status,
      services: {
        application: {
          status: 'operational',
          responseTime: `${responseTime.toFixed(2)}ms`,
        },
        database: {
          status: databaseStatus,
          latency: `${databaseLatency.toFixed(2)}ms`,
        },
      },
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: formatUptime(process.uptime()),
      },
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'down',
        error: 'Service unavailable',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
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
 * curl -s https://app.albassam-app.com/api/status | jq '.'
 * 
 * Example response:
 * {
 *   "status": "operational",
 *   "services": {
 *     "application": {
 *       "status": "operational",
 *       "responseTime": "2.45ms"
 *     },
 *     "database": {
 *       "status": "operational",
 *       "latency": "12.34ms"
 *     }
 *   },
 *   "uptime": {
 *     "seconds": 8100,
 *     "formatted": "2h 15m"
 *   },
 *   "timestamp": "2026-02-24T14:45:00.000Z",
 *   "version": "1.0.0"
 * }
 * 
 * For UptimeRobot:
 * - Monitor URL: https://app.albassam-app.com/api/status
 * - Check for keyword: "operational"
 * - Or check for HTTP 200 status code
 */
