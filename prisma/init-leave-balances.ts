import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Initializing leave balances for all employees...');

  const currentYear = new Date().getFullYear();

  // Get all employees
  const employees = await prisma.employee.findMany({
    include: {
      leaveBalance: true
    }
  });

  let created = 0;
  let existing = 0;

  for (const employee of employees) {
    // Check if employee has a balance for current year
    const hasBalance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: employee.id,
        year: currentYear
      }
    });

    if (!hasBalance) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          year: currentYear,
          annualTotal: 30,
          annualUsed: 0,
          annualRemaining: 30,
          casualTotal: 5,
          casualUsed: 0,
          casualRemaining: 5
        }
      });
      console.log(`✅ Created balance for: ${employee.fullNameAr}`);
      created++;
    } else {
      console.log(`⏭️  Balance exists for: ${employee.fullNameAr}`);
      existing++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Existing: ${existing}`);
  console.log(`   Total employees: ${employees.length}`);
  console.log('\n✅ Done!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
