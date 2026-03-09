const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// تعريف الأدوار الأساسية
const ROLES = [
  {
    name: 'SUPER_ADMIN',
    nameAr: 'مدير النظام',
    nameEn: 'Super Admin',
    description: 'صلاحيات كاملة على كل النظام',
    isSystem: true,
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'HR_MANAGER',
    nameAr: 'مدير الموارد البشرية',
    nameEn: 'HR Manager',
    description: 'إدارة شؤون الموظفين والطلبات',
    isSystem: true,
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'BRANCH_MANAGER',
    nameAr: 'مدير الفرع',
    nameEn: 'Branch Manager',
    description: 'إدارة فرع كامل',
    isSystem: true,
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'DEPT_HEAD',
    nameAr: 'مدير القسم',
    nameEn: 'Department Head',
    description: 'إدارة قسم تنظيمي',
    isSystem: true,
    isActive: true,
    sortOrder: 4
  },
  {
    name: 'SUPERVISOR',
    nameAr: 'مشرف القسم',
    nameEn: 'Supervisor',
    description: 'الإشراف على قسم أو مرحلة',
    isSystem: true,
    isActive: true,
    sortOrder: 5
  },
  {
    name: 'STAGE_SECRETARY',
    nameAr: 'سكرتير المرحلة',
    nameEn: 'Stage Secretary',
    description: 'سكرتير مرحلة دراسية - إدارة الحضور وبيانات الموظفين',
    isSystem: true,
    isActive: true,
    sortOrder: 6
  },
  {
    name: 'TEACHER',
    nameAr: 'معلم',
    nameEn: 'Teacher',
    description: 'معلم في مرحلة دراسية',
    isSystem: true,
    isActive: true,
    sortOrder: 7
  },
  {
    name: 'EMPLOYEE',
    nameAr: 'موظف',
    nameEn: 'Employee',
    description: 'موظف عادي',
    isSystem: true,
    isActive: true,
    sortOrder: 8
  }
];

// تعريف الصلاحيات
const PERMISSIONS = [
  // صلاحيات الموظفين
  { name: 'employees.view', nameAr: 'عرض الموظفين', nameEn: 'View Employees', module: 'employees', description: 'عرض قائمة وتفاصيل الموظفين' },
  { name: 'employees.view_team', nameAr: 'عرض بيانات الفريق', nameEn: 'View Team Data', module: 'employees', description: 'عرض بيانات أساسية لموظفي المرحلة/القسم فقط' },
  { name: 'employees.create', nameAr: 'إضافة موظف', nameEn: 'Create Employee', module: 'employees', description: 'إضافة موظف جديد' },
  { name: 'employees.edit', nameAr: 'تعديل موظف', nameEn: 'Edit Employee', module: 'employees', description: 'تعديل بيانات موظف' },
  { name: 'employees.delete', nameAr: 'حذف موظف', nameEn: 'Delete Employee', module: 'employees', description: 'حذف موظف' },
  { name: 'employees.view_salary', nameAr: 'عرض الرواتب', nameEn: 'View Salary', module: 'employees', description: 'عرض معلومات الرواتب' },
  
  // صلاحيات الهيكل التنظيمي
  { name: 'org.view', nameAr: 'عرض الهيكل التنظيمي', nameEn: 'View Org Structure', module: 'org', description: 'عرض الهيكل التنظيمي' },
  { name: 'org.manage', nameAr: 'إدارة الهيكل التنظيمي', nameEn: 'Manage Org Structure', module: 'org', description: 'تعديل وإدارة الهيكل التنظيمي' },
  { name: 'org.assign', nameAr: 'تعيين الموظفين', nameEn: 'Assign Employees', module: 'org', description: 'تعيين موظفين للأقسام والمراحل' },
  { name: 'org.view_team', nameAr: 'عرض الفريق', nameEn: 'View Team', module: 'org', description: 'عرض موظفين القسم/المرحلة' },
  
  // صلاحيات الموارد البشرية
  { name: 'hr.view_requests', nameAr: 'عرض الطلبات', nameEn: 'View HR Requests', module: 'hr', description: 'عرض طلبات الموظفين' },
  { name: 'hr.approve_requests', nameAr: 'الموافقة على الطلبات', nameEn: 'Approve Requests', module: 'hr', description: 'الموافقة/رفض الطلبات' },
  { name: 'hr.manage_leaves', nameAr: 'إدارة الإجازات', nameEn: 'Manage Leaves', module: 'hr', description: 'إدارة رصيد الإجازات' },
  { name: 'hr.submit_request', nameAr: 'تقديم طلب', nameEn: 'Submit Request', module: 'hr', description: 'تقديم طلبات شخصية' },
  
  // صلاحيات الحضور
  { name: 'attendance.view', nameAr: 'عرض الحضور', nameEn: 'View Attendance', module: 'attendance', description: 'عرض سجلات الحضور' },
  { name: 'attendance.view_own', nameAr: 'عرض حضوري', nameEn: 'View Own Attendance', module: 'attendance', description: 'عرض سجل الحضور الشخصي والغيابات' },
  { name: 'attendance.view_team', nameAr: 'عرض حضور الفريق', nameEn: 'View Team Attendance', module: 'attendance', description: 'عرض حضور موظفي المرحلة/القسم فقط' },
  { name: 'attendance.submit', nameAr: 'تسجيل الحضور', nameEn: 'Submit Attendance', module: 'attendance', description: 'تسجيل دخول وخروج شخصي' },
  { name: 'attendance.manage', nameAr: 'إدارة الحضور', nameEn: 'Manage Attendance', module: 'attendance', description: 'تعديل سجلات الحضور' },
  { name: 'attendance.export', nameAr: 'تصدير تقرير الحضور', nameEn: 'Export Attendance Report', module: 'attendance', description: 'تصدير تقارير الحضور' },
  
  // صلاحيات المهام
  { name: 'tasks.view', nameAr: 'عرض المهام', nameEn: 'View Tasks', module: 'tasks', description: 'عرض المهام المسندة' },
  { name: 'tasks.create', nameAr: 'إنشاء مهمة', nameEn: 'Create Task', module: 'tasks', description: 'إنشاء مهمة جديدة' },
  { name: 'tasks.assign', nameAr: 'تعيين مهام', nameEn: 'Assign Tasks', module: 'tasks', description: 'تعيين مهام لموظفي المرحلة/القسم' },
  { name: 'tasks.manage', nameAr: 'إدارة المهام', nameEn: 'Manage Tasks', module: 'tasks', description: 'تعديل وحذف المهام' },
  
  // صلاحيات المشتريات
  { name: 'procurement.view', nameAr: 'عرض المشتريات', nameEn: 'View Procurement', module: 'procurement', description: 'عرض طلبات الشراء' },
  { name: 'procurement.create', nameAr: 'إنشاء طلب شراء', nameEn: 'Create Purchase Request', module: 'procurement', description: 'إنشاء طلب شراء جديد' },
  { name: 'procurement.approve', nameAr: 'اعتماد المشتريات', nameEn: 'Approve Procurement', module: 'procurement', description: 'اعتماد طلبات الشراء' },
  
  // صلاحيات الإعدادات
  { name: 'settings.view', nameAr: 'عرض الإعدادات', nameEn: 'View Settings', module: 'settings', description: 'عرض إعدادات النظام' },
  { name: 'settings.manage', nameAr: 'إدارة الإعدادات', nameEn: 'Manage Settings', module: 'settings', description: 'تعديل إعدادات النظام' },
  { name: 'settings.manage_roles', nameAr: 'إدارة الأدوار', nameEn: 'Manage Roles', module: 'settings', description: 'إدارة الأدوار والصلاحيات' }
];

// ربط الأدوار بالصلاحيات
const ROLE_PERMISSIONS = {
  'SUPER_ADMIN': '*', // كل الصلاحيات
  'HR_MANAGER': [
    'employees.view', 'employees.create', 'employees.edit', 'employees.view_salary',
    'hr.view_requests', 'hr.approve_requests', 'hr.manage_leaves', 'hr.submit_request',
    'attendance.view', 'attendance.view_own', 'attendance.view_team', 'attendance.submit', 'attendance.manage', 'attendance.export',
    'org.view', 'org.assign',
    'tasks.view', 'tasks.create', 'tasks.assign', 'tasks.manage'
  ],
  'BRANCH_MANAGER': [
    'employees.view', 'employees.create', 'employees.edit',
    'hr.view_requests', 'hr.approve_requests', 'hr.submit_request',
    'attendance.view', 'attendance.view_own', 'attendance.view_team', 'attendance.submit', 'attendance.export',
    'org.view', 'org.assign',
    'tasks.view', 'tasks.assign', 'tasks.manage',
    'procurement.view', 'procurement.approve'
  ],
  'DEPT_HEAD': [
    'employees.view', 'employees.view_team',
    'hr.view_requests', 'hr.submit_request',
    'attendance.view', 'attendance.view_own', 'attendance.view_team', 'attendance.submit', 'attendance.export',
    'org.view', 'org.view_team',
    'tasks.view', 'tasks.create', 'tasks.assign', 'tasks.manage',
    'procurement.view', 'procurement.create'
  ],
  'SUPERVISOR': [
    'employees.view', 'employees.view_team',
    'hr.view_requests', 'hr.submit_request',
    'attendance.view', 'attendance.view_own', 'attendance.view_team', 'attendance.submit',
    'org.view_team',
    'tasks.view', 'tasks.assign',
    'procurement.create'
  ],
  'STAGE_SECRETARY': [
    'employees.view_team',
    'attendance.view_own', 'attendance.view_team', 'attendance.submit', 'attendance.export',
    'tasks.view',
    'hr.submit_request'
  ],
  'TEACHER': [
    'attendance.view_own', 'attendance.submit',
    'tasks.view',
    'hr.submit_request',
    'procurement.create'
  ],
  'EMPLOYEE': [
    'attendance.view_own', 'attendance.submit',
    'tasks.view',
    'hr.submit_request',
    'procurement.create'
  ]
};

async function seed() {
  console.log('🌱 بدء عملية إنشاء الأدوار والصلاحيات...\n');
  
  try {
    // 1. إنشاء الأدوار
    console.log('📊 إنشاء الأدوار...');
    const createdRoles = {};
    
    for (const roleData of ROLES) {
      const role = await prisma.systemRole.upsert({
        where: { name: roleData.name },
        update: roleData,
        create: roleData
      });
      createdRoles[role.name] = role;
      console.log(`   ✅ ${roleData.nameAr} (${roleData.name})`);
    }
    
    console.log(`\n✅ تم إنشاء ${Object.keys(createdRoles).length} أدوار\n`);
    
    // 2. إنشاء الصلاحيات
    console.log('🔐 إنشاء الصلاحيات...');
    const createdPermissions = {};
    
    for (const permData of PERMISSIONS) {
      const perm = await prisma.permission.upsert({
        where: { name: permData.name },
        update: permData,
        create: permData
      });
      createdPermissions[perm.name] = perm;
      console.log(`   ✅ ${permData.nameAr} (${permData.name})`);
    }
    
    console.log(`\n✅ تم إنشاء ${Object.keys(createdPermissions).length} صلاحية\n`);
    
    // 3. ربط الأدوار بالصلاحيات
    console.log('🔗 ربط الأدوار بالصلاحيات...');
    
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = createdRoles[roleName];
      if (!role) continue;
      
      // حذف الروابط القديمة
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });
      
      if (permissions === '*') {
        // SUPER_ADMIN: كل الصلاحيات
        for (const perm of Object.values(createdPermissions)) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: perm.id
            }
          });
        }
        console.log(`   ✅ ${role.nameAr}: كل الصلاحيات (${Object.keys(createdPermissions).length})`);
      } else {
        // أدوار أخرى: صلاحيات محددة
        let count = 0;
        for (const permName of permissions) {
          const perm = createdPermissions[permName];
          if (perm) {
            await prisma.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: perm.id
              }
            });
            count++;
          }
        }
        console.log(`   ✅ ${role.nameAr}: ${count} صلاحية`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ تمت عملية الإنشاء بنجاح!\n');
    
    // إحصائيات نهائية
    const rolesCount = await prisma.systemRole.count();
    const permsCount = await prisma.permission.count();
    const rolePermsCount = await prisma.rolePermission.count();
    
    console.log('📊 الإحصائيات النهائية:');
    console.log(`   - الأدوار: ${rolesCount}`);
    console.log(`   - الصلاحيات: ${permsCount}`);
    console.log(`   - الروابط: ${rolePermsCount}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل
seed()
  .then(() => {
    console.log('✅ انتهت العملية بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشلت العملية:', error);
    process.exit(1);
  });
