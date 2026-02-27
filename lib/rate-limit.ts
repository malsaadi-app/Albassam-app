/**
 * Rate Limiting Utilities for Albassam Schools App
 * 
 * Protects against brute force attacks and API abuse.
 * Uses in-memory store (suitable for single-instance deployment).
 * 
 * For multi-instance deployment, use Redis store:
 * npm install rate-limit-redis ioredis
 */

import rateLimit from 'express-rate-limit'

/**
 * Rate limit for login attempts
 * 
 * Limits: 5 attempts per 15 minutes per IP
 * Use: Protect /api/auth/login endpoint
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'تم تجاوز عدد المحاولات المسموحة. يرجى المحاولة بعد 15 دقيقة.',
    message: 'Too many login attempts. Please try again after 15 minutes.',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests (only count failed logins)
  skipSuccessfulRequests: true,
  // Handler for when limit is exceeded
  handler: (req, res) => {
    res.status(429).json({
      error: 'تم تجاوز عدد المحاولات المسموحة',
      message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
      retryAfter: Math.ceil((req.rateLimit?.resetTime?.getTime() || Date.now() + 15 * 60 * 1000 - Date.now()) / 1000),
    })
  },
})

/**
 * Rate limit for general API endpoints
 * 
 * Limits: 100 requests per 15 minutes per IP
 * Use: General API protection
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'تم تجاوز عدد الطلبات المسموحة',
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'تم تجاوز عدد الطلبات المسموحة',
      message: 'Too many requests from this IP. Please slow down.',
      retryAfter: Math.ceil((req.rateLimit?.resetTime?.getTime() || Date.now() + 15 * 60 * 1000 - Date.now()) / 1000),
    })
  },
})

/**
 * Rate limit for public pages
 * 
 * Limits: 200 requests per 15 minutes per IP
 * Use: Public routes (less restrictive)
 */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // More generous for public pages
  message: {
    error: 'تم تجاوز عدد الطلبات المسموحة',
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Strict rate limit for sensitive operations
 * 
 * Limits: 10 requests per hour per IP
 * Use: Password reset, account creation, etc.
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'تم تجاوز عدد المحاولات المسموحة',
    message: 'Too many attempts. Please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Helper to get client IP address
 * Handles proxies (Cloudflare, nginx, etc.)
 */
export function getClientIp(req: Request): string {
  const headers = req.headers
  
  // Check common proxy headers (in order of preference)
  const cfConnectingIp = headers.get('cf-connecting-ip')
  const xForwardedFor = headers.get('x-forwarded-for')
  const xRealIp = headers.get('x-real-ip')
  
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  if (xForwardedFor) {
    // X-Forwarded-For can be a comma-separated list
    return xForwardedFor.split(',')[0].trim()
  }
  
  if (xRealIp) {
    return xRealIp
  }
  
  // Fallback (should not happen with Cloudflare)
  return 'unknown'
}

/**
 * Apply rate limiter to Next.js API route
 * 
 * Usage:
 * ```typescript
 * import { applyRateLimit, loginLimiter } from '@/lib/rateLimit'
 * 
 * export async function POST(req: Request) {
 *   // Apply rate limiting
 *   const rateLimitResult = await applyRateLimit(req, loginLimiter)
 *   if (rateLimitResult) {
 *     return rateLimitResult // Returns 429 response
 *   }
 *   
 *   // Continue with normal logic
 *   // ...
 * }
 * ```
 */
export async function applyRateLimit(
  req: Request,
  limiter: ReturnType<typeof rateLimit>
): Promise<Response | null> {
  return new Promise((resolve) => {
    // Convert Next.js Request to Express-like request
    const mockReq: any = {
      ip: getClientIp(req),
      headers: Object.fromEntries(req.headers.entries()),
      method: req.method,
      url: new URL(req.url).pathname,
    }
    
    const mockRes: any = {
      status: (code: number) => ({
        json: (data: any) => {
          resolve(
            new Response(JSON.stringify(data), {
              status: code,
              headers: { 'Content-Type': 'application/json' },
            })
          )
        },
      }),
      setHeader: () => {},
    }
    
    const next = () => resolve(null)
    
    limiter(mockReq, mockRes, next)
  })
}
