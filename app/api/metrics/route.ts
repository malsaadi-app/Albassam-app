import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isRedisAvailable, getCacheStats } from '@/lib/cache';

/**
 * System Metrics API
 * Returns application health and performance metrics
 * Useful for monitoring dashboards
 */

export async function GET() {
  try {
    const startTime = Date.now();

    // Database connectivity check
    let dbHealthy = true;
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
    } catch {
      dbHealthy = false;
    }

    // Get database statistics
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.employee.count(),
      prisma.task.count(),
      prisma.hRRequest.count(),
      prisma.attendanceRecord.count(),
    ]).catch(() => [0, 0, 0, 0, 0]);

    const [userCount, employeeCount, taskCount, hrRequestCount, attendanceCount] = stats;

    // Cache statistics
    const cacheStats = await getCacheStats();

    // System metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    const metrics = {
      timestamp: new Date().toISOString(),
      status: dbHealthy ? 'healthy' : 'degraded',
      
      // Database
      database: {
        healthy: dbHealthy,
        latency: dbLatency,
        records: {
          users: userCount,
          employees: employeeCount,
          tasks: taskCount,
          hrRequests: hrRequestCount,
          attendance: attendanceCount,
        },
      },

      // Application
      application: {
        uptime: Math.floor(uptime),
        uptimeFormatted: formatUptime(uptime),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'production',
      },

      // Memory
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },

      // Cache
      cache: {
        available: cacheStats?.available || false,
        enabled: cacheStats?.enabled || false,
      },

      // Response time
      responseTime: Date.now() - startTime,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to fetch metrics',
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
