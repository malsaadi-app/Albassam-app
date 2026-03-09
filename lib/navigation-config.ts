/**
 * Navigation Configuration - Permission-Based
 * 
 * كل عنصر في القائمة يحدد:
 * - الصلاحية المطلوبة (permission)
 * - أو مجموعة صلاحيات بديلة (anyPermission)
 * 
 * النظام يفلتر تلقائياً ويعرض فقط ما يسمح للمستخدم برؤيته.
 */

export const NAVIGATION_CONFIG = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    labelEn: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/',
    permission: null, // متاح للجميع
    order: 1
  },
  
  // === الموارد البشرية ===
  {
    id: 'hr',
    label: 'الموارد البشرية',
    labelEn: 'Human Resources',
    icon: 'Users',
    order: 2,
    children: [
      {
        id: 'employees-list',
        label: 'قائمة الموظفين',
        labelEn: 'Employees List',
        path: '/hr/employees',
        anyPermission: ['employees.view', 'employees.view_team'],
        order: 1
      },
      {
        id: 'employees-add',
        label: 'إضافة موظف',
        labelEn: 'Add Employee',
        path: '/hr/employees/new',
        permission: 'employees.create',
        order: 2
      },
      {
        id: 'hr-requests',
        label: 'الطلبات',
        labelEn: 'Requests',
        path: '/hr/requests',
        anyPermission: ['hr.view_requests', 'hr.submit_request'],
        order: 3
      },
      {
        id: 'hr-leaves',
        label: 'الإجازات',
        labelEn: 'Leaves',
        path: '/hr/leaves',
        permission: 'hr.manage_leaves',
        order: 4
      }
    ]
  },
  
  // === الحضور ===
  {
    id: 'attendance',
    label: 'الحضور والانصراف',
    labelEn: 'Attendance',
    icon: 'Clock',
    order: 3,
    children: [
      {
        id: 'attendance-dashboard',
        label: 'لوحة الحضور',
        labelEn: 'Dashboard',
        path: '/attendance/dashboard',
        anyPermission: ['attendance.submit', 'attendance.view_own', 'attendance.view_team', 'attendance.view'],
        order: 1
      },
      {
        id: 'attendance-checkin',
        label: 'تسجيل حضور',
        labelEn: 'Check In/Out',
        path: '/attendance',
        permission: 'attendance.submit',
        order: 2
      },
      {
        id: 'attendance-records',
        label: 'السجلات',
        labelEn: 'Records',
        path: '/hr/attendance',
        anyPermission: ['attendance.view', 'attendance.view_team'],
        order: 3
      },
      {
        id: 'attendance-requests',
        label: 'الطلبات',
        labelEn: 'Requests',
        path: '/hr/attendance/requests',
        anyPermission: ['attendance.view', 'attendance.view_team', 'attendance.view_own'],
        order: 4
      },
      {
        id: 'attendance-reports',
        label: 'التقارير',
        labelEn: 'Reports',
        path: '/hr/attendance/reports',
        anyPermission: ['attendance.view', 'attendance.export'],
        order: 5
      },
      {
        id: 'attendance-settings',
        label: 'الإعدادات',
        labelEn: 'Settings',
        path: '/hr/attendance/settings',
        permission: 'attendance.manage',
        order: 6
      }
    ]
  },
  
  // === المهام ===
  {
    id: 'tasks',
    label: 'المهام',
    labelEn: 'Tasks',
    icon: 'CheckSquare',
    path: '/tasks',
    permission: 'tasks.view',
    order: 4,
    children: [
      {
        id: 'tasks-list',
        label: 'قائمة المهام',
        labelEn: 'Tasks List',
        path: '/tasks',
        permission: 'tasks.view',
        order: 1
      },
      {
        id: 'tasks-create',
        label: 'إنشاء مهمة',
        labelEn: 'Create Task',
        path: '/tasks/new',
        permission: 'tasks.create',
        order: 2
      },
      {
        id: 'tasks-assign',
        label: 'تعيين المهام',
        labelEn: 'Assign Tasks',
        path: '/tasks/assign',
        permission: 'tasks.assign',
        order: 3
      }
    ]
  },
  
  // === المشتريات ===
  {
    id: 'procurement',
    label: 'المشتريات',
    labelEn: 'Procurement',
    icon: 'ShoppingCart',
    path: '/procurement',
    anyPermission: ['procurement.view', 'procurement.create'],
    order: 5,
    children: [
      {
        id: 'procurement-list',
        label: 'طلبات الشراء',
        labelEn: 'Purchase Requests',
        path: '/procurement',
        anyPermission: ['procurement.view', 'procurement.create'],
        order: 1
      },
      {
        id: 'procurement-create',
        label: 'طلب شراء جديد',
        labelEn: 'New Purchase Request',
        path: '/procurement/new',
        permission: 'procurement.create',
        order: 2
      },
      {
        id: 'procurement-approve',
        label: 'اعتماد الطلبات',
        labelEn: 'Approve Requests',
        path: '/procurement/approve',
        permission: 'procurement.approve',
        order: 3
      }
    ]
  },
  
  // === الإعدادات ===
  {
    id: 'settings',
    label: 'الإعدادات',
    labelEn: 'Settings',
    icon: 'Settings',
    order: 100,
    children: [
      {
        id: 'org-structure',
        label: 'الهيكل التنظيمي',
        labelEn: 'Org Structure',
        path: '/settings/org-structure',
        anyPermission: ['org.view', 'org.manage'],
        order: 1
      },
      {
        id: 'roles',
        label: 'الأدوار والصلاحيات',
        labelEn: 'Roles & Permissions',
        path: '/settings/roles',
        permission: 'settings.manage_roles',
        order: 2
      },
      {
        id: 'branches',
        label: 'الفروع',
        labelEn: 'Branches',
        path: '/settings/branches',
        permission: 'settings.manage',
        order: 3
      },
      {
        id: 'general-settings',
        label: 'إعدادات عامة',
        labelEn: 'General Settings',
        path: '/settings',
        permission: 'settings.view',
        order: 4
      }
    ]
  }
];

/**
 * Permission-to-Module Mapping
 * يربط كل صلاحية بالـ modules المتأثرة
 */
export const PERMISSION_MODULE_MAP = {
  // Employees
  'employees.view': ['hr', 'employees-list'],
  'employees.view_team': ['hr', 'employees-list'],
  'employees.create': ['hr', 'employees-add'],
  'employees.edit': ['hr'],
  'employees.delete': ['hr'],
  'employees.view_salary': ['hr'],
  
  // Org Structure
  'org.view': ['settings', 'org-structure'],
  'org.manage': ['settings', 'org-structure'],
  'org.assign': ['settings', 'org-structure'],
  'org.view_team': ['hr'],
  
  // HR Requests
  'hr.view_requests': ['hr', 'hr-requests'],
  'hr.approve_requests': ['hr', 'hr-requests'],
  'hr.manage_leaves': ['hr', 'hr-leaves'],
  'hr.submit_request': ['hr', 'hr-requests'],
  
  // Attendance
  'attendance.view': ['attendance'],
  'attendance.view_team': ['attendance'],
  'attendance.manage': ['attendance'],
  'attendance.export': ['attendance'],
  
  // Tasks
  'tasks.view': ['tasks', 'tasks-list'],
  'tasks.create': ['tasks', 'tasks-create'],
  'tasks.assign': ['tasks', 'tasks-assign'],
  'tasks.manage': ['tasks'],
  
  // Procurement
  'procurement.view': ['procurement', 'procurement-list'],
  'procurement.create': ['procurement', 'procurement-create'],
  'procurement.approve': ['procurement', 'procurement-approve'],
  
  // Settings
  'settings.view': ['settings', 'general-settings'],
  'settings.manage': ['settings', 'branches'],
  'settings.manage_roles': ['settings', 'roles']
};

/**
 * Helper: احصل على جميع الصلاحيات اللي تفتح module معين
 */
export function getPermissionsForModule(moduleId: string): string[] {
  return Object.entries(PERMISSION_MODULE_MAP)
    .filter(([_, modules]) => modules.includes(moduleId))
    .map(([permission]) => permission);
}

/**
 * Helper: احصل على جميع الـ modules المسموح بها لمجموعة صلاحيات
 */
export function getAccessibleModules(userPermissions: string[]): string[] {
  const modules = new Set<string>();
  
  userPermissions.forEach(permission => {
    const moduleList = (PERMISSION_MODULE_MAP as any)[permission] || [];
    moduleList.forEach((m: string) => modules.add(m));
  });
  
  return Array.from(modules);
}
