import { useMemo, useState, useEffect } from 'react';
import { NAVIGATION_CONFIG, getAccessibleModules } from '@/lib/navigation-config';

interface SessionUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  permissions: string[];
  systemRoleId: string;
  systemRole?: {
    id: string;
    name: string;
    permissions: string[];
  };
  orgAssignments?: Array<{
    id: string;
    orgUnitId: string;
    role: string;
  }>;
}

interface Session {
  user?: SessionUser;
  expires?: string;
}

interface UsePermissionsReturn {
  userPermissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  getAccessibleNavigation: any[];
  accessibleModules: string[];
  canAccessPath: (path: string) => boolean;
  isSuperAdmin: boolean;
  isLoggedIn: boolean;
  loading: boolean;
  user: SessionUser | null;
}

/**
 * Hook للتحقق من الصلاحيات وفلترة الواجهة
 * 
 * الاستخدام:
 * const { hasPermission, getAccessibleNavigation } = usePermissions();
 * 
 * if (hasPermission('employees.view')) {
 *   // عرض المحتوى
 * }
 */
export function usePermissions(): UsePermissionsReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch session from API
    fetch('/api/auth/session')
      .then(res => {
        if (!res.ok) {
          // Session invalid or expired - redirect to login
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data || !data.user) {
          // No user in session - redirect to login
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          setSession(null);
        } else {
          setSession(data);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching session:', error);
        // On error, redirect to login
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        setLoading(false);
      });
  }, []);
  
  // جلب صلاحيات المستخدم من الـ session
  const userPermissions = useMemo(() => {
    if (!session?.user?.permissions) return [];
    return session.user.permissions;
  }, [session]);
  
  /**
   * التحقق من صلاحية واحدة
   */
  const hasPermission = (permission: string): boolean => {
    if (!permission) return true; // لا صلاحية مطلوبة
    if (userPermissions.includes('*')) return true; // SUPER_ADMIN
    return userPermissions.includes(permission);
  };
  
  /**
   * التحقق من أي صلاحية من مجموعة
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true;
    if (userPermissions.includes('*')) return true; // SUPER_ADMIN
    return permissions.some(p => userPermissions.includes(p));
  };
  
  /**
   * التحقق من جميع الصلاحيات
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true;
    if (userPermissions.includes('*')) return true; // SUPER_ADMIN
    return permissions.every(p => userPermissions.includes(p));
  };
  
  /**
   * فلترة عنصر navigation حسب الصلاحيات
   */
  const filterNavItem = (item: any): any => {
    // التحقق من الصلاحية الأساسية
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }
    
    // التحقق من anyPermission
    if (item.anyPermission && !hasAnyPermission(item.anyPermission)) {
      return null;
    }
    
    // فلترة الـ children
    if (item.children) {
      const accessibleChildren = item.children
        .map(filterNavItem)
        .filter(Boolean)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      
      // إذا كل الـ children محجوبة، احجب الـ parent أيضاً
      if (accessibleChildren.length === 0) {
        return null;
      }
      
      return {
        ...item,
        children: accessibleChildren
      };
    }
    
    return item;
  };
  
  /**
   * الحصول على قائمة Navigation المسموح بها
   */
  const getAccessibleNavigation = useMemo(() => {
    return NAVIGATION_CONFIG
      .map(filterNavItem)
      .filter(Boolean)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  }, [userPermissions]);
  
  /**
   * الحصول على الـ modules المسموح بها
   */
  const accessibleModules = useMemo(() => {
    return getAccessibleModules(userPermissions) as string[];
  }, [userPermissions]);
  
  /**
   * التحقق من الوصول لمسار معين
   */
  const canAccessPath = (path: string): boolean => {
    // البحث في navigation config
    const findItem = (items: any[]): any => {
      for (const item of items) {
        if (item.path === path) {
          return item;
        }
        if (item.children) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const navItem = findItem(NAVIGATION_CONFIG);
    if (!navItem) return true; // لا قيود على المسار
    
    if (navItem.permission) {
      return hasPermission(navItem.permission);
    }
    
    if (navItem.anyPermission) {
      return hasAnyPermission(navItem.anyPermission);
    }
    
    return true;
  };
  
  return {
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getAccessibleNavigation,
    accessibleModules,
    canAccessPath,
    isSuperAdmin: userPermissions.includes('*'),
    isLoggedIn: !!session?.user,
    loading,
    user: session?.user || null
  };
}

/**
 * Higher-Order Component لحماية الصفحات
 * 
 * الاستخدام:
 * export default withPermission(MyPage, 'employees.view');
 */
export function withPermission(Component: any, requiredPermission: string) {
  return function ProtectedComponent(props: any) {
    const { hasPermission, isLoggedIn } = usePermissions();
    
    if (!isLoggedIn) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">غير مصرح</h1>
            <p className="text-gray-600">يجب تسجيل الدخول للوصول لهذه الصفحة</p>
          </div>
        </div>
      );
    }
    
    if (!hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">🚫 غير مصرح</h1>
            <p className="text-gray-600">ليس لديك صلاحية للوصول لهذه الصفحة</p>
            <p className="text-sm text-gray-400 mt-2">
              الصلاحية المطلوبة: <code className="bg-gray-100 px-2 py-1 rounded">{requiredPermission}</code>
            </p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

/**
 * Component للتحقق من الصلاحية قبل عرض المحتوى
 * 
 * الاستخدام:
 * <PermissionGuard permission="employees.create">
 *   <button>إضافة موظف</button>
 * </PermissionGuard>
 */
export function PermissionGuard({ 
  permission, 
  anyPermission, 
  allPermissions,
  fallback = null, 
  children 
}: {
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
  fallback?: any;
  children: any;
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  
  let hasAccess = true;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyPermission) {
    hasAccess = hasAnyPermission(anyPermission);
  } else if (allPermissions) {
    hasAccess = hasAllPermissions(allPermissions);
  }
  
  return hasAccess ? children : fallback;
}
