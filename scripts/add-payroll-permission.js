const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addPayrollPermission() {
  console.log('Adding payroll.manage permission...\n');

  // 1. Create or get the permission
  const permission = await prisma.permission.upsert({
    where: { name: 'payroll.manage' },
    create: {
      name: 'payroll.manage',
      nameAr: 'إدارة الرواتب',
      nameEn: 'Manage Payroll',
      description: 'إدارة الرواتب',
      module: 'PAYROLL',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    update: {}
  });

  console.log('✅ Permission created/found:', permission.name);

  // 2. Get SUPER_ADMIN role
  const superAdminRole = await prisma.systemRole.findFirst({
    where: {
      OR: [
        { name: 'SUPER_ADMIN' },
        { nameAr: 'مدير النظام' }
      ]
    }
  });

  if (!superAdminRole) {
    console.log('❌ SUPER_ADMIN role not found!');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ SUPER_ADMIN role found:', superAdminRole.nameAr);

  // 3. Add permission to SUPER_ADMIN role
  const existing = await prisma.rolePermission.findFirst({
    where: {
      systemRoleId: superAdminRole.id,
      permissionId: permission.id
    }
  });

  if (existing) {
    console.log('ℹ️  Permission already assigned to SUPER_ADMIN');
  } else {
    await prisma.rolePermission.create({
      data: {
        systemRoleId: superAdminRole.id,
        permissionId: permission.id
      }
    });
    console.log('✅ Permission added to SUPER_ADMIN role');
  }

  // 4. Get other admin roles and add permission
  const adminRoles = await prisma.systemRole.findMany({
    where: {
      OR: [
        { name: { contains: 'ADMIN' } },
        { name: { contains: 'HR' } },
        { nameAr: { contains: 'مدير' } },
        { nameAr: { contains: 'موارد' } }
      ]
    }
  });

  console.log(`\n✅ Found ${adminRoles.length} admin roles`);

  for (const role of adminRoles) {
    const existing = await prisma.rolePermission.findFirst({
      where: {
        systemRoleId: role.id,
        permissionId: permission.id
      }
    });

    if (!existing) {
      await prisma.rolePermission.create({
        data: {
          systemRoleId: role.id,
          permissionId: permission.id
        }
      });
      console.log(`✅ Added to: ${role.nameAr}`);
    } else {
      console.log(`ℹ️  Already has: ${role.nameAr}`);
    }
  }

  console.log('\n✅ Done! Payroll permission added successfully.');

  await prisma.$disconnect();
}

addPayrollPermission().catch(console.error);
