const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n⏳ جاري حذف جميع البيانات المرتبطة بالموظفين...\n');
    
    // 1. Delete OrgUnitAssignments
    console.log('1. حذف OrgUnitAssignments...');
    const assignments = await prisma.orgUnitAssignment.deleteMany({});
    console.log(`   ✅ تم حذف ${assignments.count} assignment\n`);
    
    // 2. Delete AttendanceRecords
    console.log('2. حذف AttendanceRecords...');
    const attendance = await prisma.attendanceRecord.deleteMany({});
    console.log(`   ✅ تم حذف ${attendance.count} سجل حضور\n`);
    
    // 3. Delete OrganizationalPositions (that reference employees)
    console.log('3. حذف OrganizationalPositions...');
    const positions = await prisma.organizationalPosition.deleteMany({});
    console.log(`   ✅ تم حذف ${positions.count} منصب تنظيمي\n`);
    
    // 4. Delete Employees
    console.log('4. حذف Employees...');
    const employees = await prisma.employee.deleteMany({});
    console.log(`   ✅ تم حذف ${employees.count} موظف\n`);
    
    console.log('='.repeat(80));
    console.log('\n🎉 تم حذف جميع البيانات بنجاح!\n');
    console.log('📊 الملخص:');
    console.log(`   • Assignments: ${assignments.count}`);
    console.log(`   • سجلات الحضور: ${attendance.count}`);
    console.log(`   • المناصب التنظيمية: ${positions.count}`);
    console.log(`   • الموظفين: ${employees.count}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
