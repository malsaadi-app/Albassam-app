const { PrismaClient } = require('@prisma/client');

async function checkMapping() {
  const prisma = new PrismaClient();
  
  console.log('\n📊 التحقق من ربط الموظفين بحسابات المستخدمين:\n');
  
  // Count employees
  const totalEmployees = await prisma.employee.count();
  console.log(`إجمالي الموظفين: ${totalEmployees}`);
  
  // Count users
  const totalUsers = await prisma.user.count();
  console.log(`إجمالي المستخدمين: ${totalUsers}`);
  
  // Employees with userId
  const employeesWithUser = await prisma.employee.count({
    where: { userId: { not: null } }
  });
  console.log(`\nموظفين لهم حساب مستخدم: ${employeesWithUser}`);
  console.log(`موظفين بدون حساب: ${totalEmployees - employeesWithUser}`);
  
  // Users with employee link
  const usersWithEmployee = await prisma.user.count({
    where: {
      employees: {
        some: {}
      }
    }
  });
  console.log(`\nمستخدمين لهم ملف موظف: ${usersWithEmployee}`);
  console.log(`مستخدمين بدون ملف موظف: ${totalUsers - usersWithEmployee}`);
  
  // Check systemRole distribution
  console.log('\n🎭 توزيع الأدوار:\n');
  
  // Employees with systemRole
  const employeesWithRole = await prisma.employee.count({
    where: { systemRoleId: { not: null } }
  });
  console.log(`موظفين لهم systemRole: ${employeesWithRole}`);
  
  // Users with systemRole
  const usersWithRole = await prisma.user.count({
    where: { roleId: { not: null } }
  });
  console.log(`مستخدمين لهم role: ${usersWithRole}`);
  
  console.log('\n');
  
  await prisma.$disconnect();
}

checkMapping().catch(console.error);
