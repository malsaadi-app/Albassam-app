const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 إنشاء طلبات اختبار مع workflows...\n');

  const users = await prisma.user.findMany({
    where: { username: { in: ['mohammed', 'user1', 'user2', 'user3'] } }
  });
  
  const mohammed = users.find(u => u.username === 'mohammed');
  const user1 = users.find(u => u.username === 'user1');
  const user2 = users.find(u => u.username === 'user2');
  const user3 = users.find(u => u.username === 'user3');

  console.log('📋 إنشاء طلبات في مراحل مختلفة...\n');

  // طلب 1: في المرحلة 0 (عند user1)
  const req1 = await prisma.hRRequest.create({
    data: {
      type: 'LEAVE',
      leaveType: 'ANNUAL',
      startDate: new Date('2026-02-20'),
      endDate: new Date('2026-02-25'),
      reason: 'إجازة سنوية',
      status: 'PENDING_REVIEW',
      employeeId: user3.id,
      currentWorkflowStep: 0, // عند user1
    },
  });
  console.log(`✅ طلب #${req1.id}: إجازة سنوية - المرحلة 0 (عند user1)`);

  // طلب 2: في المرحلة 1 (عند user2)
  const req2 = await prisma.hRRequest.create({
    data: {
      type: 'TICKET_ALLOWANCE',
      destination: 'الرياض - جدة',
      travelDate: new Date('2026-03-01'),
      reason: 'سفر عمل',
      status: 'PENDING_REVIEW',
      employeeId: user3.id,
      currentWorkflowStep: 1, // عند user2
    },
  });
  console.log(`✅ طلب #${req2.id}: بدل تذاكر - المرحلة 1 (عند user2)`);

  // طلب 3: في المرحلة 2 (عند mohammed)
  const req3 = await prisma.hRRequest.create({
    data: {
      type: 'LEAVE',
      leaveType: 'SICK',
      startDate: new Date('2026-02-17'),
      endDate: new Date('2026-02-18'),
      reason: 'إجازة مرضية',
      status: 'PENDING_APPROVAL',
      employeeId: user2.id,
      currentWorkflowStep: 2, // عند mohammed
    },
  });
  console.log(`✅ طلب #${req3.id}: إجازة مرضية - المرحلة 2 (عند mohammed)`);

  // طلب 4: في المرحلة 0 (عند user1)
  const req4 = await prisma.hRRequest.create({
    data: {
      type: 'HOUSING_ALLOWANCE',
      amount: 3000,
      period: 'شهرياً',
      reason: 'طلب بدل سكن',
      status: 'PENDING_REVIEW',
      employeeId: user2.id,
      currentWorkflowStep: 0, // عند user1
    },
  });
  console.log(`✅ طلب #${req4.id}: بدل سكن - المرحلة 0 (عند user1)`);

  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 ملخص الطلبات:');
  console.log('═══════════════════════════════════════════════\n');
  
  console.log('عند user1 (المرحلة 0): طلبان');
  console.log(`   - ${req1.id}: إجازة سنوية`);
  console.log(`   - ${req4.id}: بدل سكن\n`);
  
  console.log('عند user2 (المرحلة 1): طلب واحد');
  console.log(`   - ${req2.id}: بدل تذاكر\n`);
  
  console.log('عند mohammed (المرحلة 2): طلب واحد');
  console.log(`   - ${req3.id}: إجازة مرضية\n`);

  console.log('🎉 تم إنشاء جميع الطلبات بنجاح!');
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
