const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding payroll.manage permission...\n');

  try {
    // 1. Create permission
    await prisma.$executeRaw`
      INSERT INTO "Permission" (id, name, "nameAr", "nameEn", description, module, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'payroll.manage', 'إدارة الرواتب', 'Manage Payroll', 'إدارة الرواتب', 'PAYROLL', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
    `;
    console.log('✅ Permission created');

    // 2. Add to all admin roles
    const result = await prisma.$executeRaw`
      INSERT INTO "RolePermission" ("roleId", "permissionId")
      SELECT 
        sr.id,
        p.id
      FROM "SystemRole" sr, "Permission" p
      WHERE (sr.name LIKE '%ADMIN%' OR sr."nameAr" LIKE '%مدير%' OR sr.name LIKE '%HR%')
        AND p.name = 'payroll.manage'
        AND NOT EXISTS (
          SELECT 1 FROM "RolePermission" rp
          WHERE rp."roleId" = sr.id
            AND rp."permissionId" = p.id
        )
    `;

    console.log(`✅ Added to ${result} admin role(s)`);

    // 3. Verify
    const verify = await prisma.$queryRaw`
      SELECT 
        sr."nameAr" as role_name,
        BOOL_OR(p.name = 'payroll.manage') as has_payroll
      FROM "SystemRole" sr
      LEFT JOIN "RolePermission" rp ON sr.id = rp."roleId"
      LEFT JOIN "Permission" p ON rp."permissionId" = p.id
      WHERE sr.name IN ('SUPER_ADMIN', 'HR_MANAGER', 'ADMIN')
      GROUP BY sr.id, sr."nameAr"
      ORDER BY sr."nameAr"
    `;

    console.log('\n📋 Verification:');
    verify.forEach(r => {
      console.log(`  ${r.has_payroll ? '✅' : '❌'} ${r.role_name}`);
    });

    console.log('\n✅ Done! Now logout and login again to refresh permissions.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
