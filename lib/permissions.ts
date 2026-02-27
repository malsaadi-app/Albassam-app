import { prisma } from '@/lib/db';

// Cache للصلاحيات (تحسين الأداء)
interface CacheEntry {
  permissions: Set<string>;
  timestamp: number;
}

const permissionsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * جلب صلاحيات المستخدم من قاعدة البيانات
 */
async function fetchUserPermissions(userId: string): Promise<Set<string>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      systemRole: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });

  if (!user || !user.systemRole) {
    return new Set<string>();
  }

  const permissions = new Set<string>(
    user.systemRole.permissions.map(rp => rp.permission.name)
  );

  return permissions;
}

/**
 * جلب صلاحيات المستخدم (مع Cache)
 */
async function getUserPermissions(userId: string): Promise<Set<string>> {
  const cached = permissionsCache.get(userId);
  
  // Check cache
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }

  // Fetch from DB
  const permissions = await fetchUserPermissions(userId);
  
  // Update cache
  permissionsCache.set(userId, {
    permissions,
    timestamp: Date.now()
  });

  return permissions;
}

/**
 * التحقق من صلاحية واحدة
 */
export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.has(permission);
}

/**
 * التحقق من صلاحيات متعددة (يحتاج كلها)
 */
export async function hasAllPermissions(
  userId: string,
  requiredPermissions: string[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return requiredPermissions.every(p => permissions.has(p));
}

/**
 * التحقق من صلاحيات متعددة (يحتاج واحدة على الأقل)
 */
export async function hasAnyPermission(
  userId: string,
  requiredPermissions: string[]
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return requiredPermissions.some(p => permissions.has(p));
}

/**
 * رمي خطأ إذا المستخدم ما عنده الصلاحية
 */
export async function requirePermission(
  userId: string,
  permission: string
): Promise<void> {
  const hasP = await hasPermission(userId, permission);
  
  if (!hasP) {
    throw new Error(`غير مصرح: الصلاحية المطلوبة: ${permission}`);
  }
}

/**
 * رمي خطأ إذا المستخدم ما عنده جميع الصلاحيات
 */
export async function requireAllPermissions(
  userId: string,
  requiredPermissions: string[]
): Promise<void> {
  const hasAll = await hasAllPermissions(userId, requiredPermissions);
  
  if (!hasAll) {
    throw new Error(`غير مصرح: الصلاحيات المطلوبة: ${requiredPermissions.join(', ')}`);
  }
}

/**
 * رمي خطأ إذا المستخدم ما عنده أي من الصلاحيات
 */
export async function requireAnyPermission(
  userId: string,
  requiredPermissions: string[]
): Promise<void> {
  const hasAny = await hasAnyPermission(userId, requiredPermissions);
  
  if (!hasAny) {
    throw new Error(`غير مصرح: يحتاج واحدة من الصلاحيات: ${requiredPermissions.join(', ')}`);
  }
}

/**
 * إلغاء الـ cache للمستخدم (بعد تغيير الصلاحيات)
 */
export function clearUserPermissionsCache(userId: string): void {
  permissionsCache.delete(userId);
}

/**
 * إلغاء جميع الـ cache
 */
export function clearAllPermissionsCache(): void {
  permissionsCache.clear();
}

/**
 * التحقق من SUPER_ADMIN (كل الصلاحيات)
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      systemRole: true
    }
  });

  return user?.systemRole?.name === 'SUPER_ADMIN';
}

/**
 * جلب جميع صلاحيات المستخدم (للعرض)
 */
export async function getAllUserPermissions(userId: string): Promise<string[]> {
  const permissions = await getUserPermissions(userId);
  return Array.from(permissions);
}

/**
 * التحقق من صلاحية module كامل (أي صلاحية في الموديول)
 */
export async function hasModuleAccess(
  userId: string,
  module: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  
  for (const perm of permissions) {
    if (perm.startsWith(`${module}.`)) {
      return true;
    }
  }
  
  return false;
}
