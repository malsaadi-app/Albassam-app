const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAttendanceTest() {
  console.log('🌱 بدء إضافة سجلات حضور اختبارية...');

  // Get all employees with userId
  const employees = await prisma.employee.findMany({
    where: {
      userId: { not: null },
      status: 'ACTIVE'
    },
    select: {
      id: true,
      userId: true,
      fullNameAr: true,
      employeeNumber: true
    }
  });

  console.log(`📋 عدد الموظفين: ${employees.length}`);

  if (employees.length === 0) {
    console.log('❌ لا يوجد موظفين نشطين مع userId');
    return;
  }

  // Delete existing attendance for February 2026
  const deleted = await prisma.attendanceRecord.deleteMany({
    where: {
      date: {
        gte: new Date('2026-02-01'),
        lt: new Date('2026-03-01')
      }
    }
  });
  console.log(`🗑️ حذف ${deleted.count} سجل حضور قديم`);

  // Scenarios for different employees
  const scenarios = [
    { 
      name: 'ملتزم جداً',
      lateChance: 0,
      earlyLeaveChance: 0,
      absentChance: 0
    },
    { 
      name: 'متأخر أحياناً',
      lateChance: 0.3,
      lateMinutes: [20, 30, 45, 60],
      earlyLeaveChance: 0.1,
      earlyMinutes: [20, 30],
      absentChance: 0
    },
    { 
      name: 'متأخر كثير',
      lateChance: 0.6,
      lateMinutes: [25, 40, 55, 70, 90],
      earlyLeaveChance: 0.4,
      earlyMinutes: [25, 40, 50],
      absentChance: 0.1
    },
    { 
      name: 'متأخر جداً',
      lateChance: 0.8,
      lateMinutes: [30, 60, 90, 120],
      earlyLeaveChance: 0.5,
      earlyMinutes: [30, 45, 60],
      absentChance: 0.2
    }
  ];

  const records = [];
  let totalCount = 0;

  // February 2026: 1-28
  for (let day = 1; day <= 14; day++) { // First 14 days only for testing
    const date = new Date(2026, 1, day); // Month 1 = February
    const dayOfWeek = date.getDay();

    // Skip weekends (Friday=5, Saturday=6)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      continue;
    }

    // Assign scenario to each employee (rotating)
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const scenario = scenarios[i % scenarios.length];

      // Check if absent
      if (Math.random() < (scenario.absentChance || 0)) {
        console.log(`  ⚠️ ${employee.fullNameAr} غائب يوم ${day}/02`);
        continue; // No attendance record
      }

      // Base times
      let checkInTime = new Date(date);
      checkInTime.setHours(8, 0, 0, 0);

      let checkOutTime = new Date(date);
      checkOutTime.setHours(16, 0, 0, 0);

      // Apply late arrival
      if (Math.random() < (scenario.lateChance || 0)) {
        const lateMinutes = scenario.lateMinutes[Math.floor(Math.random() * scenario.lateMinutes.length)];
        checkInTime.setMinutes(checkInTime.getMinutes() + lateMinutes);
      }

      // Apply early leave
      if (Math.random() < (scenario.earlyLeaveChance || 0)) {
        const earlyMinutes = scenario.earlyMinutes[Math.floor(Math.random() * scenario.earlyMinutes.length)];
        checkOutTime.setMinutes(checkOutTime.getMinutes() - earlyMinutes);
      }

      // Calculate work hours
      const workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

      // Determine status
      const lateMinutes = (checkInTime.getHours() * 60 + checkInTime.getMinutes()) - (8 * 60);
      let status = 'PRESENT';
      if (lateMinutes > 15) {
        status = 'LATE';
      }

      records.push({
        userId: employee.userId,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        workHours,
        date: new Date(date.setHours(0, 0, 0, 0)),
        status,
        notes: `سيناريو: ${scenario.name}`
      });

      totalCount++;
    }
  }

  // Bulk create
  console.log(`📊 إنشاء ${records.length} سجل حضور...`);
  await prisma.attendanceRecord.createMany({
    data: records
  });

  console.log('✅ تم إضافة السجلات بنجاح!');
  console.log(`\n📈 الإحصائيات:`);
  console.log(`   - إجمالي السجلات: ${records.length}`);
  console.log(`   - الأيام: 14 يوم (من 1 إلى 14 فبراير)`);
  console.log(`   - الموظفين: ${employees.length}`);
  
  // Show summary per employee
  console.log(`\n👥 ملخص لكل موظف:`);
  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i];
    const scenario = scenarios[i % scenarios.length];
    const empRecords = records.filter(r => r.userId === employee.userId);
    const lateCount = empRecords.filter(r => r.status === 'LATE').length;
    
    console.log(`   ${employee.fullNameAr} (${employee.employeeNumber}): ${empRecords.length} أيام، ${lateCount} تأخير - ${scenario.name}`);
  }
}

seedAttendanceTest()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
