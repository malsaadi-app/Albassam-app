/**
 * Server-Side Permission Helpers
 * 
 * Use these functions in API routes and server components
 * to check permissions and filter data based on org structure.
 */

import { prisma } from '@/lib/db';
import type { SessionUser } from '@/lib/session';

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: SessionUser | null | undefined, permission: string): boolean {
  if (!user) return false;
  if (!user.permissions) return false;
  
  // SUPER_ADMIN has all permissions
  if (user.permissions.includes('*')) return true;
  
  return user.permissions.includes(permission);
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(user: SessionUser | null | undefined, permissions: string[]): boolean {
  if (!user || !user.permissions) return false;
  if (user.permissions.includes('*')) return true;
  
  return permissions.some(p => user.permissions?.includes(p));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(user: SessionUser | null | undefined, permissions: string[]): boolean {
  if (!user || !user.permissions) return false;
  if (user.permissions.includes('*')) return true;
  
  return permissions.every(p => user.permissions?.includes(p));
}

/**
 * Get employee IDs accessible by the user based on org structure assignments
 * 
 * Logic:
 * - If user has global permission (e.g., "employees.view"), returns ALL employee IDs
 * - If user has team permission (e.g., "employees.view_team"), returns employee IDs in same org units
 * - Otherwise, returns only user's own employee ID
 * 
 * @param userId - User ID
 * @param globalPermission - Permission for accessing ALL data (e.g., "employees.view")
 * @param teamPermission - Permission for accessing TEAM data (e.g., "employees.view_team")
 * @returns Array of accessible employee IDs
 */
export async function getAccessibleEmployees(
  user: SessionUser | null | undefined,
  globalPermission?: string,
  teamPermission?: string
): Promise<string[]> {
  if (!user) return [];
  
  // If user has global permission, return ALL employee IDs
  if (globalPermission && hasPermission(user, globalPermission)) {
    const allEmployees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true }
    });
    return allEmployees.map(e => e.id);
  }
  
  // If user has team permission, return employee IDs in same org units
  if (teamPermission && hasPermission(user, teamPermission)) {
    // Get user's org assignments where they are HEAD or SUPERVISOR
    const orgAssignments = user.orgAssignments || [];
    
    const managedUnitIds = orgAssignments
      .filter(a => a.role === 'HEAD' || a.role === 'SUPERVISOR')
      .map(a => a.orgUnitId);
    
    if (managedUnitIds.length === 0) {
      // User has permission but no managed units → return only their own ID
      const userEmployee = await prisma.user.findUnique({
        where: { id: user.id },
        select: { employee: { select: { id: true } } }
      });
      return userEmployee?.employee?.id ? [userEmployee.employee.id] : [];
    }
    
    // Get all employees assigned to these org units
    const teamAssignments = await prisma.orgUnitAssignment.findMany({
      where: {
        orgUnitId: { in: managedUnitIds },
        active: true
      },
      select: { employeeId: true }
    });
    
    const uniqueEmployeeIds = [...new Set(teamAssignments.map(a => a.employeeId))];
    return uniqueEmployeeIds;
  }
  
  // No permission → return only user's own employee ID
  const userEmployee = await prisma.user.findUnique({
    where: { id: user.id },
    select: { employee: { select: { id: true } } }
  });
  
  return userEmployee?.employee?.id ? [userEmployee.employee.id] : [];
}

/**
 * Get org unit IDs accessible by the user
 * 
 * Returns org units where user is HEAD or SUPERVISOR
 */
export async function getAccessibleOrgUnits(
  user: SessionUser | null | undefined
): Promise<string[]> {
  if (!user || !user.orgAssignments) return [];
  
  return user.orgAssignments
    .filter(a => a.role === 'HEAD' || a.role === 'SUPERVISOR')
    .map(a => a.orgUnitId);
}

/**
 * Check if user can access a specific employee
 * 
 * @param userId - User ID
 * @param targetEmployeeId - Target employee ID to check access for
 * @param globalPermission - Permission for accessing ALL employees
 * @param teamPermission - Permission for accessing TEAM employees
 */
export async function canAccessEmployee(
  user: SessionUser | null | undefined,
  targetEmployeeId: string,
  globalPermission?: string,
  teamPermission?: string
): Promise<boolean> {
  if (!user) return false;
  
  // SUPER_ADMIN can access everything
  if (user.permissions?.includes('*')) return true;
  
  const accessibleEmployees = await getAccessibleEmployees(
    user,
    globalPermission,
    teamPermission
  );
  
  return accessibleEmployees.includes(targetEmployeeId);
}

/**
 * Require permission middleware helper
 * 
 * Returns error Response if user doesn't have permission, null otherwise
 * 
 * Usage:
 * ```
 * const error = requirePermission(session.user, 'employees.view');
 * if (error) return error;
 * ```
 */
export function requirePermission(
  user: SessionUser | null | undefined,
  permission: string
): Response | null {
  if (!hasPermission(user, permission)) {
    return Response.json(
      { error: 'ليس لديك صلاحية للوصول لهذا المورد' },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Require any permission middleware helper
 */
export function requireAnyPermission(
  user: SessionUser | null | undefined,
  permissions: string[]
): Response | null {
  if (!hasAnyPermission(user, permissions)) {
    return Response.json(
      { error: 'ليس لديك صلاحية للوصول لهذا المورد' },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Get user's permission list (for debugging/logging)
 */
export function getUserPermissions(user: SessionUser | null | undefined): string[] {
  return user?.permissions || [];
}

/**
 * Check if user is Super Admin
 */
export function isSuperAdmin(user: SessionUser | null | undefined): boolean {
  return user?.permissions?.includes('*') || false;
}
