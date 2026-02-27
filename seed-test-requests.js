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
  
  // Get workflow for LEAVE requests
  const leaveWorkflow = await prisma.hRRequestTypeWorkflow.findUnique({
    where: { requestType: 'LEAVE' },
    include: { steps: { orderBy: { order: 'asc' } } }
  });
  
  const hrSteps = leaveWorkflow?.steps || [];
  
  // Get workflow for TECHNOLOGY procurement
  const techWorkflow = await prisma.procurementCategoryWorkflow.findUnique({
    where: { category: 'TECHNOLOGY' },
    include: { steps: { orderBy: { order: 'asc' } } }
  });
  
  const procSteps = techWorkflow?.steps || [];
  
  console.log(`📊 تم العثور على ${hrSteps.length} خطوات HR و ${procSteps.length} خطوات مشتريات\n`);
  
  // ========================================
  // HR REQUESTS
  // ========================================
  console.log('📝 === طلبات الموارد البشرية ===\n');
  
  // 1. Annual Leave - في المرحلة الأولى
  console.log('1️⃣  إنشاء طلب إجازة سنوية (المرحلة الأولى)...');
  const leave1 = await prisma.hRRequest.create({
    data: {
      type: 'LEAVE',
      leaveType: 'ANNUAL',
      startDate: new Date('2026-02-20'),
      endDate: new Date('2026-02-24'),
      reason: 'إجازة عائلية',
      status: hrSteps[0]?.statusName || 'PENDING_REVIEW',
      employeeId: user1.id,
      currentWorkflowStep: 0,
    },
  });
  
  await prisma.auditLog.create({
    data: {
      employeeId: user1.id,
      action: 'REQUEST_CREATED',
      entity: 'HRRequest',
      entityId: leave1.id,
      details: `طلب إجازة سنوية من ${leave1.startDate.toLocaleDateString('ar-SA')} إلى ${leave1.endDate.toLocaleDateString('ar-SA')}`,
    },
  });
  
  console.log(`   ✅ تم إنشاء الطلب #${leave1.id} - الحالة: ${leave1.status}\n`);
  
  // 2. Sick Leave - في المرحلة الثانية
  console.log('2️⃣  إنشاء طلب إجازة مرضية (المرحلة الثانية)...');
  const leave2 = await prisma.hRRequest.create({
    data: {
      type: 'LEAVE',
      leaveType: 'SICK',
      startDate: new Date('2026-02-15'),
      endDate: new Date('2026-02-16'),
      reason: 'إصابة بالإنفلونزا',
      status: hrSteps[1]?.statusName || 'PENDING_APPROVAL',
      employeeId: user2.id,
      currentWorkflowStep: 1,
    },
  });
  
  await prisma.auditLog.createMany({
    data: [
      {
        employeeId: user2.id,
        action: 'REQUEST_CREATED',
        entity: 'HRRequest',
        entityId: leave2.id,
        details: `طلب إجازة مرضية`,
      },
      {
        employeeId: user2.id,
        action: 'STEP_APPROVED',
        entity: 'HRRequest',
        entityId: leave2.id,
        details: `تمت الموافقة على المرحلة 0 - انتقل إلى المرحلة 1`,
      },
    ],
  });
  
  console.log(`   ✅ تم إنشاء الطلب #${leave2.id} - الحالة: ${leave2.status}\n`);
  
  // 3. Emergency Leave - مكتمل
  console.log('3️⃣  إنشاء طلب إجازة طارئة (مكتمل)...');
  const leave3 = await prisma.hRRequest.create({
    data: {
      type: 'LEAVE',
      leaveType: 'EMERGENCY',
      startDate: new Date('2026-02-14'),
      endDate: new Date('2026-02-14'),
      reason: 'ظروف عائلية طارئة',
      status: 'APPROVED',
      employeeId: user3.id,
      currentWorkflowStep: hrSteps.length,
    },
  });
  
  await prisma.auditLog.createMany({
    data: [
      {
        employeeId: user3.id,
        action: 'REQUEST_CREATED',
        entity: 'HRRequest',
        entityId: leave3.id,
        details: `طلب إجازة طارئة`,
      },
      {
        employeeId: user3.id,
        action: 'APPROVED',
        entity: 'HRRequest',
        entityId: leave3.id,
        details: `تمت الموافقة النهائية على الطلب`,
      },
    ],
  });
  
  console.log(`   ✅ تم إنشاء الطلب #${leave3.id} - الحالة: ${leave3.status}\n`);
  
  // 4. Casual Leave - مرفوض
  console.log('4️⃣  إنشاء طلب إجازة عارضة (مرفوض)...');
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
    },
  });
  
  await prisma.auditLog.createMany({
    data: [
      {
        employeeId: user1.id,
        action: 'REQUEST_CREATED',
        entity: 'HRRequest',
        entityId: leave4.id,
        details: `طلب إجازة عارضة`,
      },
      {
        employeeId: user1.id,
        action: 'REJECTED',
        entity: 'HRRequest',
        entityId: leave4.id,
        details: `تم رفض الطلب: لا يمكن الموافقة في هذا التوقيت`,
      },
    ],
  });
  
  console.log(`   ✅ تم إنشاء الطلب #${leave4.id} - الحالة: ${leave4.status}\n`);
  
  // ========================================
  // ATTENDANCE REQUESTS
  // ========================================
  console.log('⏰ === طلبات الحضور ===\n');
  
  // 5. Excuse - معلق
  console.log('5️⃣  إنشاء طلب تبرير غياب (معلق)...');
  const attendance1 = await prisma.attendanceRequest.create({
    data: {
      type: 'EXCUSE',
      date: new Date('2026-02-10'),
      reason: 'ظروف طارئة',
      details: 'تعطل السيارة في الطريق',
      status: 'PENDING',
      employeeId: emp1.id,
    },
  });
  
  console.log(`   ✅ تم إنشاء الطلب #${attendance1.id} - الحالة: ${attendance1.status}\n`);
  
  // 6. Permission - موافق عليه
  console.log('6️⃣  إنشاء طلب استئذان (موافق عليه)...');
  const attendance2 = await prisma.attendanceRequest.create({
    data: {
      type: 'PERMISSION',
      date: new Date('2026-02-14'),
      reason: 'موعد طبي',
      details: 'موعد في المستشفى',
      status: 'APPROVED',
      employeeId: emp2.id,
      reviewComment: 'تمت الموافقة',
    },
  });
  
  console.log(`   ✅ تم إنشاء الطلب #${attendance2.id} - الحالة: ${attendance2.status}\n`);
  
  // 7. Correction - مرفوض
  console.log('7️⃣  إنشاء طلب تصحيح سجل (مرفوض)...');
  const attendance3 = await prisma.attendanceRequest.create({
    data: {
      type: 'CORRECTION',
      date: new Date('2026-02-12'),
      reason: 'خطأ في السجل',
      details: 'البصمة لم تسجل',
      actualCheckIn: '08:00',
      actualCheckOut: '16:00',
      status: 'REJECTED',
      employeeId: emp3.id,
      reviewComment: 'البيانات غير مطابقة للسجلات',
    },
  });
  
  console.log(`   ✅ تم إنشاء الطلب #${attendance3.id} - الحالة: ${attendance3.status}\n`);
  
  // ========================================
  // PROCUREMENT REQUESTS
  // ========================================
  console.log('🛒 === طلبات الشراء ===\n');
  
  // 8. Technology Equipment - المرحلة الأولى
  console.log('8️⃣  إنشاء طلب شراء معدات تقنية (المرحلة الأولى)...');
  const procurement1 = await prisma.purchaseRequest.create({
    data: {
      category: 'TECHNOLOGY',
      title: 'أجهزة كمبيوتر محمولة',
      description: 'شراء 5 أجهزة لاب توب للموظفين الجدد',
      estimatedCost: 25000,
      urgency: 'HIGH',
      status: procSteps[0]?.statusName || 'PENDING',
      employeeId: user1.id,
      currentWorkflowStep: 0,
    },
  });
  
  await prisma.auditLog.create({
    data: {
      employeeId: user1.id,
      action: 'REQUEST_CREATED',
      entity: 'PurchaseRequest',
      entityId: procurement1.id,
      details: `طلب شراء: ${procurement1.title}`,
    },
  });
  
  console.log(`   ✅ تم إنشاء الطلب #${procurement1.id} - الحالة: ${procurement1.status}\n`);
  
  // 9. Stationery - المرحلة الثانية
  console.log('9️⃣  إنشاء طلب شراء قرطاسية (المرحلة الثانية)...');
  const stationeryWorkflow = await prisma.procurementCategoryWorkflow.findUnique({
    where: { category: 'STATIONERY' },
    include: { steps: { orderBy: { order: 'asc' } } }
  });
  const procSteps2 = stationeryWorkflow?.steps || [];
  
  const procurement2 = await prisma.purchaseRequest.create({
    data: {
      category: 'STATIONERY',
      title: 'أدوات كتابة ولوازم مكتبية',
      description: 'طلب ربع سنوي للوازم المكتبية',
      estimatedCost: 3500,
      urgency: 'MEDIUM',
      status: procSteps2[1]?.statusName || 'IN_PROGRESS',
      employeeId: user2.id,
      currentWorkflowStep: 1,
    },
  });
  
  await prisma.auditLog.createMany({
    data: [
      {
        employeeId: user2.id,
        action: 'REQUEST_CREATED',
        entity: 'PurchaseRequest',
        entityId: procurement2.id,
        details: `طلب شراء: ${procurement2.title}`,
      },
      {
        employeeId: user2.id,
        action: 'STEP_APPROVED',
        entity: 'PurchaseRequest',
        entityId: procurement2.id,
        details: `تمت الموافقة على المرحلة 0`,
      },
    ],
  });
  
  console.log(`   ✅ تم إنشاء الطلب #${procurement2.id} - الحالة: ${procurement2.status}\n`);
  
  // 10. Furniture - مكتمل
  console.log('🔟 إنشاء طلب شراء أثاث (مكتمل)...');
  const procurement3 = await prisma.purchaseRequest.create({
    data: {
      category: 'FURNITURE',
      title: 'مكاتب وكراسي',
      description: 'تجهيز المكاتب الجديدة',
      estimatedCost: 15000,
      urgency: 'MEDIUM',
      status: 'APPROVED',
      employeeId: user3.id,
      currentWorkflowStep: 99, // high number to indicate completed
    },
  });
  
  await prisma.auditLog.createMany({
    data: [
      {
        employeeId: user3.id,
        action: 'REQUEST_CREATED',
        entity: 'PurchaseRequest',
        entityId: procurement3.id,
        details: `طلب شراء: ${procurement3.title}`,
      },
      {
        employeeId: user3.id,
        action: 'APPROVED',
        entity: 'PurchaseRequest',
        entityId: procurement3.id,
        details: `تمت الموافقة النهائية`,
      },
    ],
  });
  
  console.log(`   ✅ تم إنشاء الطلب #${procurement3.id} - الحالة: ${procurement3.status}\n`);
  
  // 11. Maintenance - مرفوض
  console.log('1️⃣1️⃣ إنشاء طلب شراء صيانة (مرفوض)...');
  const procurement4 = await prisma.purchaseRequest.create({
    data: {
      category: 'MAINTENANCE',
      title: 'صيانة أجهزة التكييف',
      description: 'عقد صيانة سنوي',
      estimatedCost: 8000,
      urgency: 'LOW',
      status: 'REJECTED',
      employeeId: user1.id,
      currentWorkflowStep: 0,
    },
  });
  
  await prisma.auditLog.createMany({
    data: [
      {
        employeeId: user1.id,
        action: 'REQUEST_CREATED',
        entity: 'PurchaseRequest',
        entityId: procurement4.id,
        details: `طلب شراء: ${procurement4.title}`,
      },
      {
        employeeId: user1.id,
        action: 'REJECTED',
        entity: 'PurchaseRequest',
        entityId: procurement4.id,
        details: `تم الرفض: الميزانية غير متوفرة حالياً`,
      },
    ],
  });
  
  console.log(`   ✅ تم إنشاء الطلب #${procurement4.id} - الحالة: ${procurement4.status}\n`);
  
  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 ملخص الطلبات المُنشأة:');
  console.log('═══════════════════════════════════════════════\n');
  
  console.log('✅ طلبات الموارد البشرية (4 طلبات):');
  console.log(`   - طلب #${leave1.id}: إجازة سنوية - المرحلة ${leave1.currentWorkflowStep} (${leave1.status})`);
  console.log(`   - طلب #${leave2.id}: إجازة مرضية - المرحلة ${leave2.currentWorkflowStep} (${leave2.status})`);
  console.log(`   - طلب #${leave3.id}: إجازة طارئة - مكتمل ✓ (${leave3.status})`);
  console.log(`   - طلب #${leave4.id}: إجازة عارضة - مرفوض ✗ (${leave4.status})\n`);
  
  console.log('✅ طلبات الحضور (3 طلبات):');
  console.log(`   - طلب #${attendance1.id}: تبرير غياب - ${attendance1.status}`);
  console.log(`   - طلب #${attendance2.id}: استئذان - موافق عليه ✓ (${attendance2.status})`);
  console.log(`   - طلب #${attendance3.id}: تصحيح سجل - مرفوض ✗ (${attendance3.status})\n`);
  
  console.log('✅ طلبات الشراء (4 طلبات):');
  console.log(`   - طلب #${procurement1.id}: معدات IT - المرحلة ${procurement1.currentWorkflowStep} (${procurement1.status})`);
  console.log(`   - طلب #${procurement2.id}: لوازم مكتبية - المرحلة ${procurement2.currentWorkflowStep} (${procurement2.status})`);
  console.log(`   - طلب #${procurement3.id}: أثاث - مكتمل ✓ (${procurement3.status})`);
  console.log(`   - طلب #${procurement4.id}: صيانة - مرفوض ✗ (${procurement4.status})\n`);
  
  console.log('═══════════════════════════════════════════════');
  console.log('🎉 تم إنشاء جميع الطلبات بنجاح!');
  console.log('═══════════════════════════════════════════════\n');
  
  console.log('💡 الآن افتح التطبيق وراجع:');
  console.log('   1. صفحة طلبات الموارد البشرية: /hr/requests');
  console.log('   2. صفحة طلبات الحضور: /attendance/requests');
  console.log('   3. صفحة طلبات الشراء: /procurement/requests');
  console.log('   4. صفحة Dashboard لرؤية الإحصائيات\n');
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
