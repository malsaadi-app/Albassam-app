import { NextResponse } from 'next/server';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { getSession } from './session';

export type UserRole = 'ADMIN' | 'HR_EMPLOYEE' | 'USER';

export interface AuthResult {
  error?: NextResponse;
  session?: any; // AppSession from session.ts
}

/**
 * Require authentication and specific roles
 * @param cookieStore - Next.js cookies
 * @param allowedRoles - Array of allowed roles
 * @returns AuthResult with either error or session
 */
export async function requireRole(
  cookieStore: ReadonlyRequestCookies,
  allowedRoles: UserRole[]
): Promise<AuthResult> {
  const session = await getSession(cookieStore);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(session.user.role as UserRole)) {
    return {
      error: NextResponse.json(
        { error: 'ليس لديك صلاحية للوصول' },
        { status: 403 }
      ),
    };
  }

  return { session };
}

/**
 * Check if user is authenticated (any role)
 */
export async function requireAuth(
  cookieStore: ReadonlyRequestCookies
): Promise<AuthResult> {
  const session = await getSession(cookieStore);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      ),
    };
  }

  return { session };
}

/**
 * Check if user is ADMIN
 */
export async function requireAdmin(
  cookieStore: ReadonlyRequestCookies
): Promise<AuthResult> {
  return requireRole(cookieStore, ['ADMIN']);
}

/**
 * Check if user is ADMIN or HR_EMPLOYEE
 */
export async function requireHR(
  cookieStore: ReadonlyRequestCookies
): Promise<AuthResult> {
  return requireRole(cookieStore, ['ADMIN', 'HR_EMPLOYEE']);
}
