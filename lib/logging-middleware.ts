/**
 * HTTP Logging Middleware
 * 
 * Automatically logs all API requests with:
 * - Request details (method, URL, headers)
 * - Response details (status, duration)
 * - User context (if authenticated)
 * - Error details (if any)
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from './logger';

/**
 * Log HTTP request/response
 */
export function logRequest(
  request: NextRequest,
  response: NextResponse,
  duration: number,
  userId?: string,
  error?: Error
) {
  const { method, url } = request;
  const { status } = response;
  const pathname = new URL(url).pathname;

  // Skip health checks and static assets
  if (
    pathname === '/api/health' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static')
  ) {
    return;
  }

  const logData = {
    method,
    url: pathname,
    status,
    duration: `${duration.toFixed(2)}ms`,
    userId,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    referer: request.headers.get('referer'),
  };

  // Log level based on status code
  if (status >= 500) {
    logger.error(`${method} ${pathname} ${status}`, {
      ...logData,
      error: error?.message,
      stack: error?.stack,
    });
  } else if (status >= 400) {
    logger.warn(`${method} ${pathname} ${status}`, logData);
  } else {
    logger.http(`${method} ${pathname} ${status}`, logData);
  }
}

/**
 * Create request logger with context
 */
export function createRequestLogger(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const pathname = new URL(request.url).pathname;

  return logger.child({
    requestId,
    method: request.method,
    url: pathname,
  });
}

/**
 * Usage in API routes:
 * 
 * import { logRequest, createRequestLogger } from '@/lib/logging-middleware';
 * 
 * export async function GET(request: NextRequest) {
 *   const startTime = performance.now();
 *   const requestLogger = createRequestLogger(request);
 * 
 *   try {
 *     requestLogger.info('Fetching employees');
 *     
 *     const employees = await prisma.employee.findMany();
 *     
 *     const response = NextResponse.json(employees);
 *     const duration = performance.now() - startTime;
 *     
 *     logRequest(request, response, duration, session.user?.id);
 *     
 *     return response;
 *   } catch (error) {
 *     requestLogger.error('Failed to fetch employees', { error });
 *     
 *     const response = NextResponse.json(
 *       { error: 'Internal error' },
 *       { status: 500 }
 *     );
 *     const duration = performance.now() - startTime;
 *     
 *     logRequest(request, response, duration, session.user?.id, error as Error);
 *     
 *     return response;
 *   }
 * }
 */
