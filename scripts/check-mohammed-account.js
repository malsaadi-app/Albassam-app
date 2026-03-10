const { PrismaClient } = require('@prisma/client');

async function checkMohammedAccount() {
  const prisma = new PrismaClient();
  
  console.log('\n🔍 التحقق من حساب mohammed:\n');
  console.log('─'.repeat(60));
  
  try {
    // Find mohammed user
    const user = await prisma.user.findUnique({
      where: { username: 'mohammed' },
      include: {
        systemRole: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        employee: {
          select: {
            id: true,
            fullNameAr: true,
            fullNameEn: true,
            employeeNumber: true,
            position: true,
            department: true,
            email: true,
            phone: true,
            status: true
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ المستخدم mohammed غير موجود!\n');
      await prisma.$disconnect();
      return;
    }
    
    console.log('✅ المستخدم موجود:\n');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Display Name: ${user.displayName}`);
    console.log('');
    
    // Check employee link
    console.log('👤 ربط الموظف:\n');
    if (user.employee) {
      console.log(`   ✅ مربوط بموظف:`);
      console.log(`      الاسم: ${user.employee.fullNameAr || user.employee.fullNameEn}`);
      console.log(`      رقم الموظف: ${user.employee.employeeNumber}`);
      console.log(`      الوظيفة: ${user.employee.position || 'غير محدد'}`);
      console.log(`      القسم: ${user.employee.department || 'غير محدد'}`);
      console.log(`      الحالة: ${user.employee.status}`);
      console.log('');
      
      // Check if it's the correct employee
      if (user.employee.employeeNumber === '1075380111') {
        console.log('   ✅ مربوط برقم الموظف الصحيح: 1075380111\n');
      } else {
        console.log(`   ⚠️  مربوط برقم موظف مختلف: ${user.employee.employeeNumber}`);
        console.log(`   المطلوب: 1075380111\n`);
        
        // Find correct employee
        const correctEmployee = await prisma.employee.findFirst({
          where: { employeeNumber: '1075380111' },
          select: {
            id: true,
            fullNameAr: true,
            employeeNumber: true,
            userId: true
          }
        });
        
        if (correctEmployee) {
          console.log('   📋 الموظف الصحيح (1075380111):');
          console.log(`      الاسم: ${correctEmployee.fullNameAr}`);
          console.log(`      مربوط بمستخدم: ${correctEmployee.userId || 'لا يوجد'}`);
          console.log('');
        }
      }
    } else {
      console.log('   ❌ غير مربوط بأي موظف!\n');
      
      // Find employee 1075380111
      const employee = await prisma.employee.findFirst({
        where: { employeeNumber: '1075380111' },
        select: {
          id: true,
          fullNameAr: true,
          employeeNumber: true,
          userId: true
        }
      });
      
      if (employee) {
        console.log('   📋 الموظف 1075380111 موجود:');
        console.log(`      الاسم: ${employee.fullNameAr}`);
        console.log(`      مربوط بمستخدم: ${employee.userId || 'لا يوجد'}`);
        console.log('');
      } else {
        console.log('   ⚠️  الموظف 1075380111 غير موجود في النظام!\n');
      }
    }
    
    // Check role and permissions
    console.log('🎭 الدور والصلاحيات:\n');
    if (user.systemRole) {
      console.log(`   الدور: ${user.systemRole.nameAr || user.systemRole.name}`);
      console.log(`   الكود: ${user.systemRole.name}`);
      console.log(`   عدد الصلاحيات: ${user.systemRole.permissions.length}`);
      console.log('');
      
      // Check if SUPER_ADMIN
      if (user.systemRole.name === 'SUPER_ADMIN') {
        console.log('   ✅ صلاحيات SUPER ADMIN كاملة!\n');
      } else {
        console.log(`   ⚠️  الدور الحالي: ${user.systemRole.name}`);
        console.log('   المطلوب: SUPER_ADMIN\n');
        
        // Find SUPER_ADMIN role
        const superAdminRole = await prisma.systemRole.findFirst({
          where: { name: 'SUPER_ADMIN' },
          select: { id: true, name: true, nameAr: true }
        });
        
        if (superAdminRole) {
          console.log('   📋 دور SUPER_ADMIN موجود:');
          console.log(`      ID: ${superAdminRole.id}`);
          console.log(`      الاسم: ${superAdminRole.nameAr}`);
          console.log('');
        }
      }
      
      // List permissions
      console.log('   📜 الصلاحيات الحالية:');
      const permsByModule = {};
      user.systemRole.permissions.forEach(rp => {
        const module = rp.permission.module;
        if (!permsByModule[module]) {
          permsByModule[module] = [];
        }
        permsByModule[module].push(rp.permission.nameAr || rp.permission.name);
      });
      
      Object.entries(permsByModule).forEach(([module, perms]) => {
        console.log(`      ${module}: ${perms.length} صلاحية`);
      });
      console.log('');
      
    } else {
      console.log('   ❌ لا يوجد دور مربوط!\n');
      
      // Find SUPER_ADMIN role
      const superAdminRole = await prisma.systemRole.findFirst({
        where: { name: 'SUPER_ADMIN' },
        select: { id: true, name: true, nameAr: true }
      });
      
      if (superAdminRole) {
        console.log('   📋 دور SUPER_ADMIN موجود:');
        console.log(`      ID: ${superAdminRole.id}`);
        console.log(`      الاسم: ${superAdminRole.nameAr}`);
        console.log('');
      }
    }
    
    console.log('─'.repeat(60));
    console.log('\n');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMohammedAccount().catch(console.error);
