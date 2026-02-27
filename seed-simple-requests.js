const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 بدء إنشاء طلبات اختبار...\n');
  
  // Get users
  const users = await prisma.user.findMany({
    where: { username: { in: ['user1', 'user2', 'user3'] } }
  });
  
  if (users.length === 0) {
    throw new Error('No users found');
  }
  
  const [user1, user2, user3] = users;
  console.log(`📋 تم العثور على ${users.length} مستخدمين\n`);
  
  // Get employees
  const employees = await prisma.employee.findMany({
    take: 3
  });
  
  if (employees.length === 0) {
    throw new Error('No employees found');
  }
  
  const [emp1, emp2, emp3] = employees;
  
  // ========================================
  // HR REQUESTS
  // ========================================
  console.log('📝 === طلبات الموارد البشرية ===\n');
  
  // 1. Annual Leave - في المرحلة الأولى (PENDING_REVIEW)
  console.log('1️⃣  إنشاء طلب إجازة سنوية (PENDING_REVIEW)...');
  const leave1 = await prisma.hRRequest.create({
    data: {
      type: 'LEAVE',
      leaveType: 'ANNUAL',
      startDate: new Date('2026-02-20'),
      endDate: new Date('2026-02-24'),
      reason: 'إجازة عائلية',
      status: 'PENDING_REVIEW',
      employeeId: user1.id,
      currentWorkflowStep: 0,
    },
  });
  console.log(`   ✅ تم إنشاء الطلب #${leave1.id} - الحالة: ${leave1.status}\n`);
  
  // 2. Sick Leave - في المرحلة الثانية (PENDING_APPROVAL)
  console.log('2️⃣  إنشاء طلب إجازة مرضية (PENDING_APPROVAL)...');
  const leave2 = await prisma.hRRequest.create({
    data: {
      type: 'LEAVE',
      leaveType: 'SICK',
      startDate: new Date('2026-02-15'),
      endDate: new Date('2026-02-16'),
      reason: 'إصابة بالإنفلونزا',
      status: 'PENDING_APPROVAL',
      employeeId: user2.id,
      currentWorkflowStep: 1,
      reviewComment: 'تمت المراجعة - ينتظر الموافقة',
    },
  });
  console.log(`   ✅ تم إنشاء الطلب #${leave2.id} - الحالة: ${leave2.status}\n`);
  
  // 3. Emergency Leave - مكتمل (APPROVED)
  console.log('3️⃣  إنشاء طلب إجازة طارئة (APPROVED)...');
  const leave3 = await prisma.hRRequest.create({
    data: {
      type: 'LEAVE',
      leaveType: 'EMERGENCY',
      startDate: new Date('2026-02-14'),
      endDate: new Date('2026-02-14'),
      reason: 'ظروف عائلية طارئة',
      status: 'APPROVED',
      employeeId: user3.id,
      currentWorkflowStep: 99,
      approvalComment: 'تمت الموافقة',
    },
  });
  console.log(`   ✅ تم إنشاء الطلب #${leave3.id} - الحالة: ${leave3.status}\n`);
  
  // 4. Casual Leave - مرفوض (REJECTED)
  console.log('4️⃣  إنشاء طلب إجازة عارضة (REJECTED)...');
  const leave4 = await prisma.hRRequest.create({
    data: {
      type: 'LEAVE',
      leaveType: 'CASUAL',
      startDate: new Date('2026-02-25'),
      endDate: new Date('2026-02-25'),
      reason: 'أمور شخصية',
      status: 'REJECTED',
      employeeId: user1.id,
      currentWorkflowStep: 0,
      reviewComment: 'لا يمكن الموافقة في هذا التوقيت',
    },
  });
  console.log(`   ✅ تم إنشاء الطلب #${leave4.id} - الحالة: ${leave4.status}\n`);
  
  // 5. Ticket Allowance - PENDING_REVIEW
  console.log('5️⃣  إنشاء طلب بدل تذاكر (PENDING_REVIEW)...');
  const ticket1 = await prisma.hRRequest.create({
    data: {
      type: 'TICKET_ALLOWANCE',
      destination: 'الرياض - جدة',
      travelDate: new Date('2026-03-01'),
      reason: 'سفر عمل',
      status: 'PENDING_REVIEW',
      employeeId: user2.id,
      currentWorkflowStep: 0,
    },
  });
  console.log(`   ✅ تم إنشاء الطلب #${ticket1.id} - الحالة: ${ticket1.status}\n`);
  
  // 6. Housing Allowance - RETURNED (إعادة للموظف)
  console.log('6️⃣  إنشاء طلب بدل سكن (RETURNED)...');
  const housing1 = await prisma.hRRequest.create({
    data: {
      type: 'HOUSING_ALLOWANCE',
      amount: 3000,
      period: 'شهرياً',
      reason: 'طلب بدل سكن',
      status: 'RETURNED',
      employeeId: user3.id,
      currentWorkflowStep: 0,
      reviewComment: 'يرجى تعديل المبلغ المطلوب وإعادة التقديم',
    },
  });
  console.log(`   ✅ تم إنشاء الطلب #${housing1.id} - الحالة: ${housing1.status}\n`);
  
  // ========================================
  // ATTENDANCE REQUESTS
  // ========================================
  console.log('⏰ === طلبات الحضور ===\n');
  
  // 7. Excuse - معلق (PENDING)
  console.log('7️⃣  إنشاء طلب تبرير غياب (PENDING)...');
  const attendance1 = await prisma.attendanceRequest.create({
    data: {
      type: 'EXCUSE',
      userId: user1.id,
      requestDate: new Date('2026-02-10'),
      reason: 'ظروف طارئة - تعطل السيارة في الطريق',
      status: 'PENDING',
    },
  });
  console.log(`   ✅ تم إنشاء الطلب #${attendance1.id} - الحالة: ${attendance1.status}\n`);
  
  // 8. Permission - موافق عليه (APPROVED)
  console.log('8️⃣  إنشاء طلب استئذان (APPROVED)...');
  const attendance2 = await prisma.attendanceRequest.create({
    data: {
      type: 'PERMISSION',
      userId: user2.id,
      requestDate: new Date('2026-02-14'),
      reason: 'موعد طبي في المستشفى',
      status: 'APPROVED',
      reviewComment: 'موافقة',
    },
  });
  console.log(`   ✅ تم إنشاء الطلب #${attendance2.id} - الحالة: ${attendance2.status}\n`);
  
  // 9. Correction - معلق (PENDING)
  console.log('9️⃣  إنشاء طلب تصحيح سجل (PENDING)...');
  const attendance3 = await prisma.attendanceRequest.create({
    data: {
      type: 'CORRECTION',
      userId: user3.id,
      requestDate: new Date('2026-02-12'),
      reason: 'البصمة لم تسجل',
      correctionType: 'forgot_checkin',
      requestedCheckIn: new Date('2026-02-12T08:00:00'),
      requestedCheckOut: new Date('2026-02-12T16:00:00'),
      status: 'PENDING',
    },
  });
  console.log(`   ✅ تم إنشاء الطلب #${attendance3.id} - الحالة: ${attendance3.status}\n`);
  
  // 10. Another Excuse - مرفوض (REJECTED)
  console.log('🔟 إنشاء طلب تبرير آخر (REJECTED)...');
  const attendance4 = await prisma.attendanceRequest.create({
    data: {
      type: 'EXCUSE',
      userId: user1.id,
      requestDate: new Date('2026-02-08'),
      reason: 'نسيت البصمة',
      status: 'REJECTED',
      reviewComment: 'لا يوجد ما يبرر الغياب',
    },
  });
  console.log(`   ✅ تم إنشاء الطلب #${attendance4.id} - الحالة: ${attendance4.status}\n`);
  
  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 ملخص الطلبات المُنشأة:');
  console.log('═══════════════════════════════════════════════\n');
  
  console.log('✅ طلبات الموارد البشرية (6 طلبات):');
  console.log(`   - طلب #${leave1.id}: إجازة سنوية - ${leave1.status}`);
  console.log(`   - طلب #${leave2.id}: إجازة مرضية - ${leave2.status}`);
  console.log(`   - طلب #${leave3.id}: إجازة طارئة - ${leave3.status} ✓`);
  console.log(`   - طلب #${leave4.id}: إجازة عارضة - ${leave4.status} ✗`);
  console.log(`   - طلب #${ticket1.id}: بدل تذاكر - ${ticket1.status}`);
  console.log(`   - طلب #${housing1.id}: بدل سكن - ${housing1.status} ↩️\n`);
  
  console.log('✅ طلبات الحضور (4 طلبات):');
  console.log(`   - طلب #${attendance1.id}: تبرير غياب - ${attendance1.status}`);
  console.log(`   - طلب #${attendance2.id}: استئذان - ${attendance2.status} ✓`);
  console.log(`   - طلب #${attendance3.id}: تصحيح سجل - ${attendance3.status}`);
  console.log(`   - طلب #${attendance4.id}: تبرير غياب - ${attendance4.status} ✗\n`);
  
  console.log('═══════════════════════════════════════════════');
  console.log('🎉 تم إنشاء جميع الطلبات بنجاح!');
  console.log('═══════════════════════════════════════════════\n');
  
  console.log('💡 الآن افتح التطبيق وراجع:');
  console.log('   1. صفحة طلبات الموارد البشرية: /hr/requests');
  console.log('   2. صفحة طلبات الحضور: /attendance/requests');
  console.log('   3. صفحة Dashboard لرؤية الإحصائيات\n');
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
