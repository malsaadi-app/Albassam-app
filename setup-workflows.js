const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 إعداد workflows لجميع أنواع الطلبات...\n');

  // Get users
  const mohammed = await prisma.user.findUnique({ where: { username: 'mohammed' } });
  const user1 = await prisma.user.findUnique({ where: { username: 'user1' } });
  const user2 = await prisma.user.findUnique({ where: { username: 'user2' } });

  if (!mohammed || !user1 || !user2) {
    console.log('❌ المستخدمون غير موجودين!');
    console.log(`Mohammed: ${mohammed?.id || 'NOT FOUND'}`);
    console.log(`User1: ${user1?.id || 'NOT FOUND'}`);
    console.log(`User2: ${user2?.id || 'NOT FOUND'}`);
    return;
  }

  console.log('✅ تم العثور على المستخدمين\n');

  // Request types to configure
  const requestTypes = [
    'LEAVE',
    'TICKET_ALLOWANCE',
    'FLIGHT_BOOKING',
    'SALARY_CERTIFICATE',
    'HOUSING_ALLOWANCE'
  ];

  for (const requestType of requestTypes) {
    console.log(`📋 إعداد workflow لنوع: ${requestType}`);

    // Create or update workflow
    const workflow = await prisma.hRRequestTypeWorkflow.upsert({
      where: { requestType },
      update: {
        requireReview: true,
        requireApproval: true,
        autoApprove: false,
        reviewTimeoutDays: 3,
        approvalTimeoutDays: 3,
      },
      create: {
        requestType,
        requireReview: true,
        requireApproval: true,
        autoApprove: false,
        reviewTimeoutDays: 3,
        approvalTimeoutDays: 3,
      },
    });

    // Delete existing steps
    await prisma.hRWorkflowStep.deleteMany({
      where: { workflowId: workflow.id }
    });

    // Create 3 steps
    // Step 0: user1 - التحقق من الطلب
    await prisma.hRWorkflowStep.create({
      data: {
        workflowId: workflow.id,
        order: 0,
        userId: user1.id,
        statusName: 'التحقق من الطلب',
      },
    });

    // Step 1: user2 - مراجعة الطلب
    await prisma.hRWorkflowStep.create({
      data: {
        workflowId: workflow.id,
        order: 1,
        userId: user2.id,
        statusName: 'مراجعة الطلب',
      },
    });

    // Step 2: mohammed - اعتماد الطلب
    await prisma.hRWorkflowStep.create({
      data: {
        workflowId: workflow.id,
        order: 2,
        userId: mohammed.id,
        statusName: 'اعتماد الطلب',
      },
    });

    console.log(`   ✅ تم إنشاء 3 مراحل:`);
    console.log(`      المرحلة 0: ${user1.displayName} (التحقق من الطلب)`);
    console.log(`      المرحلة 1: ${user2.displayName} (مراجعة الطلب)`);
    console.log(`      المرحلة 2: ${mohammed.displayName} (اعتماد الطلب)\n`);
  }

  console.log('═══════════════════════════════════════════════');
  console.log('🎉 تم إعداد workflows لجميع أنواع الطلبات!');
  console.log('═══════════════════════════════════════════════\n');

  console.log('📊 الأنواع المكوّنة:');
  requestTypes.forEach(type => console.log(`   ✅ ${type}`));
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
