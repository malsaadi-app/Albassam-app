const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== PERMISSIONS ====================
const permissions = [
  // Employees Module
  { name: 'employees.view', nameAr: 'عرض الموظفين', nameEn: 'View Employees', module: 'employees' },
  { name: 'employees.create', nameAr: 'إضافة موظف', nameEn: 'Create Employee', module: 'employees' },
  { name: 'employees.edit', nameAr: 'تعديل موظف', nameEn: 'Edit Employee', module: 'employees' },
  { name: 'employees.delete', nameAr: 'حذف موظف', nameEn: 'Delete Employee', module: 'employees' },
  { name: 'employees.export', nameAr: 'تصدير بيانات الموظفين', nameEn: 'Export Employees', module: 'employees' },
  
  // HR Requests Module
  { name: 'hr_requests.view', nameAr: 'عرض الطلبات', nameEn: 'View Requests', module: 'hr' },
  { name: 'hr_requests.view_all', nameAr: 'عرض جميع الطلبات', nameEn: 'View All Requests', module: 'hr' },
  { name: 'hr_requests.create', nameAr: 'إنشاء طلب', nameEn: 'Create Request', module: 'hr' },
  { name: 'hr_requests.review', nameAr: 'مراجعة الطلبات', nameEn: 'Review Requests', module: 'hr' },
  { name: 'hr_requests.approve', nameAr: 'الموافقة على الطلبات', nameEn: 'Approve Requests', module: 'hr' },
  { name: 'hr_requests.reject', nameAr: 'رفض الطلبات', nameEn: 'Reject Requests', module: 'hr' },
  { name: 'hr_requests.delete', nameAr: 'حذف الطلبات', nameEn: 'Delete Requests', module: 'hr' },
  
  // Attendance Module
  { name: 'attendance.view', nameAr: 'عرض الحضور', nameEn: 'View Attendance', module: 'attendance' },
  { name: 'attendance.view_all', nameAr: 'عرض حضور الجميع', nameEn: 'View All Attendance', module: 'attendance' },
  { name: 'attendance.checkin', nameAr: 'تسجيل حضور', nameEn: 'Check-in', module: 'attendance' },
  { name: 'attendance.edit_own', nameAr: 'تعديل حضوري', nameEn: 'Edit Own Attendance', module: 'attendance' },
  { name: 'attendance.edit_all', nameAr: 'تعديل حضور الجميع', nameEn: 'Edit All Attendance', module: 'attendance' },
  { name: 'attendance.approve', nameAr: 'الموافقة على طلبات التعديل', nameEn: 'Approve Modifications', module: 'attendance' },
  { name: 'attendance.export', nameAr: 'تصدير سجلات الحضور', nameEn: 'Export Attendance', module: 'attendance' },
  
  // Positions Module
  { name: 'positions.view', nameAr: 'عرض الوظائف', nameEn: 'View Positions', module: 'positions' },
  { name: 'positions.create', nameAr: 'إنشاء وظيفة', nameEn: 'Create Position', module: 'positions' },
  { name: 'positions.edit', nameAr: 'تعديل وظيفة', nameEn: 'Edit Position', module: 'positions' },
  { name: 'positions.delete', nameAr: 'حذف وظيفة', nameEn: 'Delete Position', module: 'positions' },
  { name: 'positions.open', nameAr: 'فتح وظيفة', nameEn: 'Open Position', module: 'positions' },
  
  // Reports Module
  { name: 'reports.view', nameAr: 'عرض التقارير', nameEn: 'View Reports', module: 'reports' },
  { name: 'reports.export', nameAr: 'تصدير التقارير', nameEn: 'Export Reports', module: 'reports' },
  { name: 'reports.financial', nameAr: 'التقارير المالية', nameEn: 'Financial Reports', module: 'reports' },
  
  // Procurement Module
  { name: 'procurement.view', nameAr: 'عرض طلبات المشتريات', nameEn: 'View Purchase Requests', module: 'procurement' },
  { name: 'procurement.create', nameAr: 'إنشاء طلب شراء', nameEn: 'Create Purchase Request', module: 'procurement' },
  { name: 'procurement.review', nameAr: 'مراجعة طلبات الشراء', nameEn: 'Review Purchases', module: 'procurement' },
  { name: 'procurement.approve', nameAr: 'الموافقة على طلبات الشراء', nameEn: 'Approve Purchases', module: 'procurement' },
  { name: 'procurement.reject', nameAr: 'رفض طلبات الشراء', nameEn: 'Reject Purchases', module: 'procurement' },
  
  // Maintenance Module
  { name: 'maintenance.view', nameAr: 'عرض طلبات الصيانة', nameEn: 'View Maintenance', module: 'maintenance' },
  { name: 'maintenance.create', nameAr: 'إنشاء طلب صيانة', nameEn: 'Create Maintenance', module: 'maintenance' },
  { name: 'maintenance.assign', nameAr: 'تعيين فني', nameEn: 'Assign Technician', module: 'maintenance' },
  { name: 'maintenance.complete', nameAr: 'إنهاء طلب صيانة', nameEn: 'Complete Maintenance', module: 'maintenance' },
  
  // Settings Module
  { name: 'settings.view', nameAr: 'عرض الإعدادات', nameEn: 'View Settings', module: 'settings' },
  { name: 'settings.edit', nameAr: 'تعديل الإعدادات', nameEn: 'Edit Settings', module: 'settings' },
  { name: 'settings.users', nameAr: 'إدارة المستخدمين', nameEn: 'Manage Users', module: 'settings' },
  { name: 'settings.roles', nameAr: 'إدارة الأدوار', nameEn: 'Manage Roles', module: 'settings' },
  { name: 'settings.permissions', nameAr: 'إدارة الصلاحيات', nameEn: 'Manage Permissions', module: 'settings' },
  
  // Tasks Module
  { name: 'tasks.view_all', nameAr: 'عرض جميع المهام', nameEn: 'View All Tasks', module: 'tasks' },
  { name: 'tasks.view_own', nameAr: 'عرض مهامي فقط', nameEn: 'View Own Tasks', module: 'tasks' },
  { name: 'tasks.create', nameAr: 'إنشاء مهمة', nameEn: 'Create Task', module: 'tasks' },
  { name: 'tasks.edit', nameAr: 'تعديل مهمة', nameEn: 'Edit Task', module: 'tasks' },
  { name: 'tasks.delete', nameAr: 'حذف مهمة', nameEn: 'Delete Task', module: 'tasks' },
  { name: 'tasks.assign', nameAr: 'تعيين مهمة لشخص', nameEn: 'Assign Task', module: 'tasks' },
  
  // Branches Module
  { name: 'branches.view', nameAr: 'عرض الفروع', nameEn: 'View Branches', module: 'branches' },
  { name: 'branches.create', nameAr: 'إضافة فرع', nameEn: 'Create Branch', module: 'branches' },
  { name: 'branches.edit', nameAr: 'تعديل فرع', nameEn: 'Edit Branch', module: 'branches' },
  { name: 'branches.delete', nameAr: 'حذف فرع', nameEn: 'Delete Branch', module: 'branches' },
];

// ==================== ROLES ====================
const roles = [
  {
    name: 'SUPER_ADMIN',
    nameAr: 'المدير العام',
    nameEn: 'Super Admin',
    description: 'كل الصلاحيات',
    isSystem: true,
    sortOrder: 1,
    permissions: permissions.map(p => p.name) // All permissions
  },
  {
    name: 'HR_MANAGER',
    nameAr: 'مدير الموارد البشرية',
    nameEn: 'HR Manager',
    description: 'إدارة كاملة للموارد البشرية',
    isSystem: true,
    sortOrder: 2,
    permissions: [
      'employees.view', 'employees.create', 'employees.edit', 'employees.delete', 'employees.export',
      'hr_requests.view', 'hr_requests.view_all', 'hr_requests.review', 'hr_requests.approve', 'hr_requests.reject',
      'attendance.view', 'attendance.view_all', 'attendance.approve', 'attendance.export',
      'positions.view', 'positions.create', 'positions.edit', 'positions.delete', 'positions.open',
      'reports.view', 'reports.export', 'reports.financial',
      'tasks.view_all', 'tasks.create', 'tasks.edit', 'tasks.assign',
      'branches.view',
    ]
  },
  {
    name: 'HR_EMPLOYEE',
    nameAr: 'موظف موارد بشرية',
    nameEn: 'HR Employee',
    description: 'مساعدة في إدارة الموارد البشرية',
    isSystem: true,
    sortOrder: 3,
    permissions: [
      'employees.view', 'employees.create', 'employees.edit', 'employees.export',
      'hr_requests.view', 'hr_requests.view_all', 'hr_requests.review',
      'attendance.view', 'attendance.view_all',
      'positions.view',
      'reports.view',
      'tasks.view_all',
      'branches.view',
    ]
  },
  {
    name: 'BRANCH_MANAGER',
    nameAr: 'مدير فرع',
    nameEn: 'Branch Manager',
    description: 'إدارة الفرع والموظفين',
    isSystem: true,
    sortOrder: 4,
    permissions: [
      'employees.view',
      'hr_requests.view', 'hr_requests.view_all',
      'attendance.view', 'attendance.view_all', 'attendance.edit_all', 'attendance.approve',
      'reports.view',
      'tasks.view_all', 'tasks.create', 'tasks.assign',
      'branches.view',
      'maintenance.view', 'maintenance.create', 'maintenance.assign',
    ]
  },
  {
    name: 'ACCOUNTANT',
    nameAr: 'محاسب',
    nameEn: 'Accountant',
    description: 'إدارة الشؤون المالية',
    isSystem: true,
    sortOrder: 5,
    permissions: [
      'employees.view',
      'reports.view', 'reports.export', 'reports.financial',
      'procurement.view', 'procurement.approve',
      'tasks.view_own',
    ]
  },
  {
    name: 'TEACHER',
    nameAr: 'معلم',
    nameEn: 'Teacher',
    description: 'موظف تدريسي',
    isSystem: true,
    sortOrder: 6,
    permissions: [
      'attendance.view', 'attendance.checkin',
      'hr_requests.view', 'hr_requests.create',
      'tasks.view_own',
    ]
  },
  {
    name: 'EMPLOYEE',
    nameAr: 'موظف',
    nameEn: 'Employee',
    description: 'موظف عادي',
    isSystem: true,
    sortOrder: 7,
    permissions: [
      'attendance.view', 'attendance.checkin',
      'hr_requests.view', 'hr_requests.create',
      'tasks.view_own',
    ]
  },
];

async function main() {
  console.log('🚀 بدء إنشاء الصلاحيات والأدوار...\n');
  
  // 1. إنشاء الصلاحيات
  console.log('📋 إنشاء الصلاحيات...');
  const createdPermissions = {};
  
  for (const perm of permissions) {
    const created = await prisma.permission.upsert({
      where: { name: perm.name },
      update: perm,
      create: perm,
    });
    createdPermissions[perm.name] = created.id;
    console.log(`   ✅ ${perm.nameAr} (${perm.name})`);
  }
  
  console.log(`\n✅ تم إنشاء ${permissions.length} صلاحية\n`);
  
  // 2. إنشاء الأدوار وربطها بالصلاحيات
  console.log('👥 إنشاء الأدوار...');
  
  for (const roleData of roles) {
    const { permissions: rolePermissions, ...roleInfo } = roleData;
    
    // Create or update role
    const role = await prisma.systemRole.upsert({
      where: { name: roleData.name },
      update: roleInfo,
      create: roleInfo,
    });
    
    console.log(`   ✅ ${roleInfo.nameAr} (${roleInfo.name})`);
    
    // Delete existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });
    
    // Add permissions to role
    for (const permName of rolePermissions) {
      if (createdPermissions[permName]) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: createdPermissions[permName],
          }
        });
      }
    }
    
    console.log(`      └─ ${rolePermissions.length} صلاحية`);
  }
  
  console.log(`\n✅ تم إنشاء ${roles.length} دور\n`);
  
  // 3. تعيين الأدوار للمستخدمين الحاليين
  console.log('🔗 تعيين الأدوار للمستخدمين الحاليين...');
  
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true }
  });
  
  const superAdminRole = await prisma.systemRole.findUnique({
    where: { name: 'SUPER_ADMIN' }
  });
  
  const hrEmployeeRole = await prisma.systemRole.findUnique({
    where: { name: 'HR_EMPLOYEE' }
  });
  
  const employeeRole = await prisma.systemRole.findUnique({
    where: { name: 'EMPLOYEE' }
  });
  
  for (const user of users) {
    let newRoleId = employeeRole.id; // Default
    
    if (user.role === 'ADMIN') {
      newRoleId = superAdminRole.id;
    } else if (user.role === 'HR_EMPLOYEE') {
      newRoleId = hrEmployeeRole.id;
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: newRoleId }
    });
    
    console.log(`   ✅ ${user.username} → ${user.role === 'ADMIN' ? 'SUPER_ADMIN' : user.role === 'HR_EMPLOYEE' ? 'HR_EMPLOYEE' : 'EMPLOYEE'}`);
  }
  
  console.log(`\n✅ تم تعيين الأدوار لـ ${users.length} مستخدم\n`);
  
  // 4. إحصائيات نهائية
  console.log('📊 الإحصائيات النهائية:');
  console.log(`   - الصلاحيات: ${permissions.length}`);
  console.log(`   - الأدوار: ${roles.length}`);
  console.log(`   - المستخدمون: ${users.length}`);
  console.log('\n🎉 تم إنشاء نظام الصلاحيات بنجاح!\n');
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
