const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 إنشاء طلبات اختبار متنوعة...\n');

  // Get users
  const mohammed = await prisma.user.findUnique({ where: { username: 'mohammed' } });
  const user1 = await prisma.user.findUnique({ where: { username: 'user1' } });
  const user2 = await prisma.user.findUnique({ where: { username: 'user2' } });
  const user3 = await prisma.user.findUnique({ where: { username: 'user3' } });

  if (!mohammed || !user1 || !user2 || !user3) {
    throw new Error('Users not found');
  }

  console.log('📋 تم العثور على المستخدمين\n');

  // ========================================
  // SCENARIO 1: Requests pending at Mohammed (ADMIN)
  // ========================================
  console.log('📝 السيناريو 1: طلبات معلقة عند محمد (ADMIN)\n');

  // HR Request 1: من user2 → معلق عند mohammed
  const hrReq1 = await prisma.hRRequest.create({
    data: {
      type: 'LEAVE',
      leaveType: 'ANNUAL',
      startDate: new Date('2026-02-20'),
      endDate: new Date('2026-02-25'),
      reason: 'إجازة سنوية للسفر',
      status: 'PENDING_REVIEW',
      employeeId: user2.id,
      currentWorkflowStep: 0,
    },
  });
  console.log(`✅ طلب HR #${hrReq1.id}: إجازة سنوية من ${user2.displayName} → معلق عند ADMIN`);

  // HR Request 2: من user3 → معلق عند mohammed
  const hrReq2 = await prisma.hRRequest.create({
    data: {
      type: 'TICKET_ALLOWANCE',
      destination: 'الرياض - جدة',
      travelDate: new Date('2026-03-01'),
      reason: 'سفر عمل رسمي',
      status: 'PENDING_REVIEW',
      employeeId: user3.id,
      currentWorkflowStep: 0,
    },
  });
  console.log(`✅ طلب HR #${hrReq2.id}: بدل تذاكر من ${user3.displayName} → معلق عند ADMIN`);

  // Attendance Request 1: من user2 → معلق عند mohammed
  const attReq1 = await prisma.attendanceRequest.create({
    data: {
      type: 'EXCUSE',
      userId: user2.id,
      requestDate: new Date('2026-02-10'),
      reason: 'ظروف طارئة - تأخر بسبب ازدحام',
      status: 'PENDING',
    },
  });
  console.log(`✅ طلب حضور #${attReq1.id}: تبرير تأخر من ${user2.displayName} → معلق عند ADMIN`);

  // Attendance Request 2: من user3 → معلق عند mohammed
  const attReq2 = await prisma.attendanceRequest.create({
    data: {
      type: 'PERMISSION',
      userId: user3.id,
      requestDate: new Date('2026-02-14'),
      reason: 'موعد طبي - مستشفى',
      status: 'PENDING',
    },
  });
  console.log(`✅ طلب حضور #${attReq2.id}: استئذان من ${user3.displayName} → معلق عند ADMIN\n`);

  // ========================================
  // SCENARIO 2: Requests pending at user1 (HR_EMPLOYEE)
  // ========================================
  console.log('📝 السيناريو 2: طلبات معلقة عند user1 (HR Employee)\n');

  // Create a workflow step where user1 is responsible
  // First create workflow for LEAVE type
  const leaveWorkflow = await prisma.hRRequestTypeWorkflow.upsert({
    where: { requestType: 'LEAVE' },
    update: {},
    create: {
      requestType: 'LEAVE',
      requireReview: true,
      requireApproval: true,
      autoApprove: false,
      reviewTimeoutDays: 3,
      approvalTimeoutDays: 3,
    },
  });

  // Create workflow step for user1
  await prisma.hRWorkflowStep.create({
    data: {
      workflowId: leaveWorkflow.id,
      order: 0,
      userId: user1.id,
      statusName: 'مراجعة HR',
    },
  });

  // Create workflow step for mohammed (second step)
  await prisma.hRWorkflowStep.create({
    data: {
      workflowId: leaveWorkflow.id,
      order: 1,
      userId: mohammed.id,
      statusName: 'موافقة الإدارة',
    },
  });

  console.log(`✅ تم إنشاء workflow: LEAVE → المرحلة 0: ${user1.displayName}, المرحلة 1: ${mohammed.displayName}`);

  // HR Request 3: من user2 → معلق عند user1
  const hrReq3 = await prisma.hRRequest.create({
    data: {
      type: 'LEAVE',
      leaveType: 'SICK',
      startDate: new Date('2026-02-17'),
      endDate: new Date('2026-02-18'),
      reason: 'إجازة مرضية',
      status: 'PENDING_REVIEW',
      employeeId: user2.id,
      currentWorkflowStep: 0, // At user1's step
    },
  });
  console.log(`✅ طلب HR #${hrReq3.id}: إجازة مرضية من ${user2.displayName} → معلق عند ${user1.displayName}`);

  // HR Request 4: من user3 → معلق عند user1
  const hrReq4 = await prisma.hRRequest.create({
    data: {
      type: 'LEAVE',
      leaveType: 'CASUAL',
      startDate: new Date('2026-02-22'),
      endDate: new Date('2026-02-22'),
      reason: 'أمور شخصية',
      status: 'PENDING_REVIEW',
      employeeId: user3.id,
      currentWorkflowStep: 0, // At user1's step
    },
  });
  console.log(`✅ طلب HR #${hrReq4.id}: إجازة عارضة من ${user3.displayName} → معلق عند ${user1.displayName}\n`);

  // ========================================
  // SCENARIO 3: Requests that went through user1 and now at Mohammed
  // ========================================
  console.log('📝 السيناريو 3: طلبات مرّت من user1 ووصلت لمحمد\n');

  // HR Request 5: من user2 → وصل للمرحلة الثانية (mohammed)
  const hrReq5 = await prisma.hRRequest.create({
    data: {
      type: 'LEAVE',
      leaveType: 'EMERGENCY',
      startDate: new Date('2026-02-16'),
      endDate: new Date('2026-02-16'),
      reason: 'ظروف عائلية طارئة',
      status: 'PENDING_APPROVAL',
      employeeId: user2.id,
      currentWorkflowStep: 1, // At mohammed's step
      reviewedBy: user1.id,
      reviewComment: 'تمت المراجعة - موافقة مبدئية من HR',
      reviewedAt: new Date(),
    },
  });

  // Add audit log for the review
  await prisma.hRRequestAuditLog.create({
    data: {
      requestId: hrReq5.id,
      actorUserId: user1.id,
      action: 'STEP_APPROVED',
      message: 'تمت الموافقة على المرحلة 0 (مراجعة HR)',
    },
  });

  console.log(`✅ طلب HR #${hrReq5.id}: إجازة طارئة من ${user2.displayName} → مرّ من ${user1.displayName} → الآن عند ${mohammed.displayName}\n`);

  // ========================================
  // SUMMARY
  // ========================================
  console.log('═══════════════════════════════════════════════');
  console.log('📊 ملخص الطلبات المُنشأة:');
  console.log('═══════════════════════════════════════════════\n');

  console.log(`✅ طلبات معلقة عند محمد (ADMIN): 5 طلبات`);
  console.log(`   - ${hrReq1.id}: إجازة سنوية (PENDING_REVIEW)`);
  console.log(`   - ${hrReq2.id}: بدل تذاكر (PENDING_REVIEW)`);
  console.log(`   - ${attReq1.id}: تبرير تأخر (PENDING)`);
  console.log(`   - ${attReq2.id}: استئذان (PENDING)`);
  console.log(`   - ${hrReq5.id}: إجازة طارئة (PENDING_APPROVAL - المرحلة 2)\n`);

  console.log(`✅ طلبات معلقة عند user1 (HR Employee): 2 طلبات`);
  console.log(`   - ${hrReq3.id}: إجازة مرضية (PENDING_REVIEW)`);
  console.log(`   - ${hrReq4.id}: إجازة عارضة (PENDING_REVIEW)\n`);

  console.log('═══════════════════════════════════════════════');
  console.log('🎉 تم إنشاء جميع الطلبات بنجاح!');
  console.log('═══════════════════════════════════════════════\n');

  console.log('💡 الآن سجل دخول:');
  console.log('   - محمد: يشوف 5 طلبات معلقة');
  console.log('   - user1: يشوف 2 طلبات معلقة\n');
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
