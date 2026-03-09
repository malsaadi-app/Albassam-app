import { useMemo, useState, useEffect } from 'react';
import { NAVIGATION_CONFIG, getAccessibleModules } from '@/lib/navigation-config';

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
export function usePermissions() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch session from API
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setSession(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching session:', error);
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
  const hasPermission = (permission) => {
    if (!permission) return true; // لا صلاحية مطلوبة
    if (userPermissions.includes('*')) return true; // SUPER_ADMIN
    return userPermissions.includes(permission);
  };
  
  /**
   * التحقق من أي صلاحية من مجموعة
   */
  const hasAnyPermission = (permissions) => {
    if (!permissions || permissions.length === 0) return true;
    if (userPermissions.includes('*')) return true; // SUPER_ADMIN
    return permissions.some(p => userPermissions.includes(p));
  };
  
  /**
   * التحقق من جميع الصلاحيات
   */
  const hasAllPermissions = (permissions) => {
    if (!permissions || permissions.length === 0) return true;
    if (userPermissions.includes('*')) return true; // SUPER_ADMIN
    return permissions.every(p => userPermissions.includes(p));
  };
  
  /**
   * فلترة عنصر navigation حسب الصلاحيات
   */
  const filterNavItem = (item) => {
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
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
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
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [userPermissions]);
  
  /**
   * الحصول على الـ modules المسموح بها
   */
  const accessibleModules = useMemo(() => {
    return getAccessibleModules(userPermissions);
  }, [userPermissions]);
  
  /**
   * التحقق من الوصول لمسار معين
   */
  const canAccessPath = (path) => {
    // البحث في navigation config
    const findItem = (items) => {
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
export function withPermission(Component, requiredPermission) {
  return function ProtectedComponent(props) {
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
