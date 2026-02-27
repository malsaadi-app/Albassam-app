import {
  PrismaClient,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  EmployeeRole,
  Gender,
  MaritalStatus,
  EmploymentType,
  EmployeeStatus,
  RequestType,
  RequestStatus,
  PurchaseCategory,
  PurchasePriority,
  PurchaseRequestStatus,
  PurchaseOrderStatus,
  AttendanceStatus,
  QuotationStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function addHours(d: Date, hours: number) {
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}

async function ensureBranchesAndStages() {
  console.log('🏢 Seeding branches & stages...');

  const branchesData: Array<{
    name: string;
    type: 'SCHOOL' | 'INSTITUTE' | 'COMPANY';
    commercialRegNo?: string;
    city?: string;
    address?: string;
    workStartTime?: string;
    workEndTime?: string;
    stages: Array<{ name: string; code?: string }>;
  }> = [
    {
      name: 'مجمع البسام الأهلية بنين',
      type: 'SCHOOL',
      commercialRegNo: '2050040241',
      city: 'الرياض',
      workStartTime: '07:00',
      workEndTime: '14:00',
      stages: [
        { name: 'ابتدائية', code: 'PRI' },
        { name: 'متوسطة', code: 'MID' },
        { name: 'ثانوية', code: 'SEC' },
      ],
    },
    {
      name: 'مجمع البسام الأهلية بنات',
      type: 'SCHOOL',
      commercialRegNo: '2050040241',
      city: 'الرياض',
      workStartTime: '07:00',
      workEndTime: '14:00',
      stages: [
        { name: 'رياض أطفال', code: 'KG' },
        { name: 'ابتدائية', code: 'PRI' },
        { name: 'متوسطة', code: 'MID' },
        { name: 'ثانوية', code: 'SEC' },
      ],
    },
    {
      name: 'مجمع البسام العالمية بنات',
      type: 'SCHOOL',
      commercialRegNo: '2050110165',
      city: 'الرياض',
      workStartTime: '07:00',
      workEndTime: '14:00',
      stages: [
        { name: 'رياض أطفال', code: 'KG' },
        { name: 'ابتدائية', code: 'PRI' },
        { name: 'متوسطة', code: 'MID' },
        { name: 'ثانوية', code: 'SEC' },
      ],
    },
    {
      name: 'معهد البسام العالي للتدريب (رجالي)',
      type: 'INSTITUTE',
      commercialRegNo: '2050089277',
      city: 'الرياض',
      workStartTime: '08:00',
      workEndTime: '16:00',
      stages: [],
    },
    {
      name: 'معهد البسام العالي للتدريب (النسائي)',
      type: 'INSTITUTE',
      commercialRegNo: '2050089294',
      city: 'الرياض',
      workStartTime: '08:00',
      workEndTime: '16:00',
      stages: [],
    },
    {
      name: 'شركة الصفر التجارية',
      type: 'COMPANY',
      commercialRegNo: '2050015622',
      city: 'الرياض',
      workStartTime: '08:00',
      workEndTime: '16:00',
      stages: [],
    },
    {
      name: 'شركة يوسف حمد البسام وشركاه',
      type: 'COMPANY',
      commercialRegNo: '2050034348',
      city: 'الرياض',
      workStartTime: '08:00',
      workEndTime: '16:00',
      stages: [],
    },
    {
      name: 'فرع شركة يوسف حمد البسام وشركاه',
      type: 'COMPANY',
      commercialRegNo: '2050084516',
      city: 'الرياض',
      workStartTime: '08:00',
      workEndTime: '16:00',
      stages: [],
    },
  ];

  const branches: Array<{ id: string; name: string }> = [];

  for (const b of branchesData) {
    const existing = await prisma.branch.findFirst({ where: { name: b.name } });
    const branch =
      existing ??
      (await prisma.branch.create({
        data: {
          name: b.name,
          type: b.type,
          commercialRegNo: b.commercialRegNo ?? null,
          city: b.city ?? null,
          address: b.address ?? null,
          workStartTime: b.workStartTime ?? '07:00',
          workEndTime: b.workEndTime ?? '14:00',
        },
      }));

    branches.push({ id: branch.id, name: branch.name });

    for (const s of b.stages) {
      await prisma.stage.upsert({
        where: {
          branchId_name: {
            branchId: branch.id,
            name: s.name,
          },
        },
        update: {
          code: s.code ?? undefined,
          status: 'ACTIVE',
        },
        create: {
          branchId: branch.id,
          name: s.name,
          code: s.code ?? null,
          status: 'ACTIVE',
        },
      });
    }
  }

  // ---- Cleanup: deactivate duplicate branches by name (keeps one ACTIVE per name) ----
  // Older runs may have created duplicate branches because Branch.name is not unique in schema.
  // This cleanup keeps the oldest branch (by createdAt) ACTIVE and migrates data from duplicates.
  const seedBranchNames = branchesData.map((x) => x.name);
  const allNamed = await prisma.branch.findMany({
    where: { name: { in: seedBranchNames } },
    orderBy: { createdAt: 'asc' }
  });

  const byName = new Map<string, typeof allNamed>();
  for (const b of allNamed) {
    byName.set(b.name, [...(byName.get(b.name) ?? []), b]);
  }

  for (const [name, list] of byName.entries()) {
    if (list.length <= 1) continue;

    const keep = list[0];
    const duplicates = list.slice(1);

    // Ensure keep is ACTIVE
    if (keep.status !== 'ACTIVE') {
      await prisma.branch.update({ where: { id: keep.id }, data: { status: 'ACTIVE' } });
    }

    for (const dup of duplicates) {
      // 1) Move employees + attendance records to kept branch
      await prisma.employee.updateMany({ where: { branchId: dup.id }, data: { branchId: keep.id } });
      await prisma.attendanceRecord.updateMany({ where: { branchId: dup.id }, data: { branchId: keep.id } });

      // 2) Merge stages: for each stage under duplicate branch
      const dupStages = await prisma.stage.findMany({ where: { branchId: dup.id } });
      for (const st of dupStages) {
        const primary = await prisma.stage.findUnique({
          where: {
            branchId_name: {
              branchId: keep.id,
              name: st.name
            }
          }
        });

        if (primary) {
          // Reassign employees/attendance from duplicate stage to primary stage
          await prisma.employee.updateMany({ where: { stageId: st.id }, data: { stageId: primary.id, branchId: keep.id } });
          await prisma.attendanceRecord.updateMany({ where: { stageId: st.id }, data: { stageId: primary.id, branchId: keep.id } });
          // Hide duplicate stage
          if (st.status !== 'INACTIVE') {
            await prisma.stage.update({ where: { id: st.id }, data: { status: 'INACTIVE' } });
          }
        } else {
          // Safe to move stage to kept branch
          await prisma.stage.update({ where: { id: st.id }, data: { branchId: keep.id } });
        }
      }

      // 3) Deactivate duplicate branch
      if (dup.status !== 'INACTIVE') {
        await prisma.branch.update({ where: { id: dup.id }, data: { status: 'INACTIVE' } });
      }
    }
  }

  const totalBranchCount = await prisma.branch.count();
  const totalStageCount = await prisma.stage.count();
  const activeBranchCount = await prisma.branch.count({ where: { status: 'ACTIVE' } });
  const activeStageCount = await prisma.stage.count({ where: { status: 'ACTIVE' } });

  console.log(
    `✅ Branches/stages ready: ${activeBranchCount} ACTIVE branches (${totalBranchCount} total), ` +
      `${activeStageCount} ACTIVE stages (${totalStageCount} total)`
  );

  // Return active branches for downstream assignment
  const activeBranches = await prisma.branch.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return activeBranches;
}

async function ensureUsers(commonPasswordHash: string) {
  console.log('👤 Seeding base users...');

  const mohammed = await prisma.user.upsert({
    where: { username: 'mohammed' },
    update: {
      role: 'ADMIN',
    },
    create: {
      username: 'mohammed',
      displayName: 'Mohammed',
      role: 'ADMIN',
      passwordHash: commonPasswordHash,
      notificationsEnabled: true,
      notifyOverdue: true,
      notifyDueSoon: true,
      notifyDailySummary: true,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { username: 'user1' },
    update: { role: 'HR_EMPLOYEE' },
    create: {
      username: 'user1',
      displayName: 'HR Employee',
      role: 'HR_EMPLOYEE',
      passwordHash: commonPasswordHash,
      notificationsEnabled: true,
      notifyOverdue: true,
      notifyDueSoon: true,
      notifyDailySummary: true,
    },
  });

  const others = [
    { username: 'user2', displayName: 'User 2' },
    { username: 'user3', displayName: 'User 3' },
    { username: 'user4', displayName: 'User 4' },
    { username: 'user5', displayName: 'User 5' },
    { username: 'user6', displayName: 'User 6' },
  ];

  const regularUsers = [] as Array<{ id: string; username: string; displayName: string }>;
  for (const u of others) {
    const created = await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        displayName: u.displayName,
        role: 'USER',
        passwordHash: commonPasswordHash,
        notificationsEnabled: true,
        notifyOverdue: true,
        notifyDueSoon: true,
        notifyDailySummary: true,
      },
    });
    regularUsers.push({ id: created.id, username: created.username, displayName: created.displayName });
  }

  console.log('✅ Users ready');
  return { mohammed, user1, regularUsers };
}

async function ensureTaskTemplates(adminId: string) {
  console.log('🧩 Seeding task templates...');

  const templates = [
    {
      name: 'توظيف موظف جديد',
      description: 'إجراءات توظيف موظف جديد في المدارس',
      category: TaskCategory.HR,
      priority: TaskPriority.HIGH,
      checklist: [
        { id: '1', text: 'استلام السيرة الذاتية والوثائق', completed: false },
        { id: '2', text: 'إجراء المقابلة الشخصية', completed: false },
        { id: '3', text: 'التحقق من الشهادات', completed: false },
        { id: '4', text: 'إعداد عقد العمل', completed: false },
        { id: '5', text: 'فتح ملف في نظام الموارد البشرية', completed: false },
        { id: '6', text: 'إضافة بصمة الحضور', completed: false },
        { id: '7', text: 'تسليم بطاقة الموظف', completed: false },
      ],
    },
    {
      name: 'تجديد رخصة نشاط',
      description: 'إجراءات تجديد رخصة النشاط السنوية',
      category: TaskCategory.TRANSACTIONS,
      priority: TaskPriority.HIGH,
      checklist: [
        { id: '1', text: 'جمع المستندات المطلوبة', completed: false },
        { id: '2', text: 'دفع الرسوم', completed: false },
        { id: '3', text: 'مراجعة البلدية', completed: false },
        { id: '4', text: 'استلام الرخصة المجددة', completed: false },
        { id: '5', text: 'حفظ نسخة في الأرشيف', completed: false },
      ],
    },
    {
      name: 'معاملة حكومية عامة',
      description: 'قالب عام للمعاملات الحكومية',
      category: TaskCategory.TRANSACTIONS,
      priority: TaskPriority.MEDIUM,
      checklist: [
        { id: '1', text: 'تحديد الجهة المختصة', completed: false },
        { id: '2', text: 'تجهيز المستندات', completed: false },
        { id: '3', text: 'رفع الطلب', completed: false },
        { id: '4', text: 'متابعة الطلب', completed: false },
        { id: '5', text: 'استلام المخرجات', completed: false },
      ],
    },
    {
      name: 'تقييم أداء موظف',
      description: 'إجراءات التقييم السنوي للموظفين',
      category: TaskCategory.HR,
      priority: TaskPriority.MEDIUM,
      checklist: [
        { id: '1', text: 'إعداد نموذج التقييم', completed: false },
        { id: '2', text: 'مراجعة أداء الموظف', completed: false },
        { id: '3', text: 'عقد جلسة التقييم', completed: false },
        { id: '4', text: 'توثيق النتائج', completed: false },
        { id: '5', text: 'وضع خطة التطوير', completed: false },
      ],
    },
  ];

  for (const t of templates) {
    const existing = await prisma.taskTemplate.findFirst({ where: { name: t.name } });
    if (existing) continue;

    await prisma.taskTemplate.create({
      data: {
        name: t.name,
        description: t.description,
        category: t.category,
        priority: t.priority,
        checklist: JSON.stringify(t.checklist),
        createdById: adminId,
      },
    });
  }

  console.log('✅ Task templates ready');
}

async function ensureEmployeesAndAssignments() {
  console.log('👥 Seeding employees (20-30) + assignments...');

  const branches = await prisma.branch.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } });
  const stages = await prisma.stage.findMany({ where: { status: 'ACTIVE' }, orderBy: [{ branchId: 'asc' }, { name: 'asc' }] });

  const stageByBranchName = new Map<string, string[]>();
  for (const s of stages) {
    const b = branches.find((x) => x.id === s.branchId);
    if (!b) continue;
    const key = b.name;
    stageByBranchName.set(key, [...(stageByBranchName.get(key) ?? []), s.id]);
  }

  // base employees (EMP001-EMP008) kept (expanded list to EMP030)
  const employees = [
    {
      employeeNumber: 'EMP001',
      fullNameAr: 'أحمد محمد العلي',
      fullNameEn: 'Ahmed Mohammed AlAli',
      gender: Gender.MALE,
      maritalStatus: MaritalStatus.MARRIED,
      department: 'الإدارة',
      position: 'مدير تنفيذي',
      employeeRole: EmployeeRole.ADMIN,
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP002',
      fullNameAr: 'فاطمة عبدالله السالم',
      fullNameEn: 'Fatima Abdullah AlSalem',
      gender: Gender.FEMALE,
      maritalStatus: MaritalStatus.SINGLE,
      department: 'الموارد البشرية',
      position: 'مدير موارد بشرية',
      employeeRole: EmployeeRole.ADMIN,
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP003',
      fullNameAr: 'خالد سعد المطيري',
      fullNameEn: 'Khaled Saad AlMutairi',
      gender: Gender.MALE,
      maritalStatus: MaritalStatus.MARRIED,
      department: 'الشؤون المالية',
      position: 'محاسب أول',
      employeeRole: EmployeeRole.SUPERVISOR,
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP004',
      fullNameAr: 'نورة ناصر القحطاني',
      fullNameEn: 'Noura Nasser AlQahtani',
      gender: Gender.FEMALE,
      maritalStatus: MaritalStatus.MARRIED,
      department: 'التعليم',
      position: 'معلمة لغة إنجليزية',
      employeeRole: EmployeeRole.TEACHER,
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP005',
      fullNameAr: 'سعد فهد الشمري',
      fullNameEn: 'Saad Fahad AlShammari',
      gender: Gender.MALE,
      maritalStatus: MaritalStatus.SINGLE,
      department: 'تقنية المعلومات',
      position: 'مطور برمجيات',
      employeeRole: EmployeeRole.EMPLOYEE,
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP006',
      fullNameAr: 'منى عبدالرحمن العتيبي',
      fullNameEn: 'Muna Abdulrahman AlOtaibi',
      gender: Gender.FEMALE,
      maritalStatus: MaritalStatus.DIVORCED,
      department: 'الشؤون الإدارية',
      position: 'مساعد إداري',
      employeeRole: EmployeeRole.EMPLOYEE,
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeNumber: 'EMP007',
      fullNameAr: 'عبدالعزيز راشد الدوسري',
      fullNameEn: 'Abdulaziz Rashid AlDosari',
      gender: Gender.MALE,
      maritalStatus: MaritalStatus.MARRIED,
      department: 'التعليم',
      position: 'معلم رياضيات',
      employeeRole: EmployeeRole.TEACHER,
      status: EmployeeStatus.ON_LEAVE,
    },
    {
      employeeNumber: 'EMP008',
      fullNameAr: 'ريم محمد الغامدي',
      fullNameEn: 'Reem Mohammed AlGhamdi',
      gender: Gender.FEMALE,
      maritalStatus: MaritalStatus.SINGLE,
      department: 'التسويق',
      position: 'أخصائي تسويق',
      employeeRole: EmployeeRole.EMPLOYEE,
      status: EmployeeStatus.ACTIVE,
    },
  ] as const;

  const extraNames = [
    ['محمد', 'عبدالله', 'العتيبي'],
    ['سارة', 'محمد', 'الحربي'],
    ['تركي', 'سعد', 'الشهري'],
    ['هند', 'ناصر', 'الزهراني'],
    ['عبدالرحمن', 'فهد', 'العنزي'],
    ['لمى', 'خالد', 'القحطاني'],
    ['فيصل', 'أحمد', 'السبيعي'],
    ['رنا', 'عبدالله', 'السالم'],
    ['مشعل', 'ناصر', 'الدوسري'],
    ['دلال', 'سعد', 'الغامدي'],
    ['صالح', 'محمد', 'المطيري'],
    ['أروى', 'فهد', 'الشمري'],
    ['حمد', 'تركي', 'الحارثي'],
    ['جود', 'عبدالرحمن', 'التميمي'],
    ['عبدالله', 'ماجد', 'العلي'],
    ['نجلاء', 'خالد', 'الأنصاري'],
    ['سلمان', 'ناصر', 'الحربي'],
    ['رهف', 'محمد', 'العنزي'],
    ['ماجد', 'سعد', 'السليمان'],
    ['شذى', 'أحمد', 'القرني'],
    ['عبدالمجيد', 'فهد', 'الهاجري'],
    ['أمل', 'ناصر', 'الراشد'],
  ];

  const departments = ['التعليم', 'الشؤون الإدارية', 'الموارد البشرية', 'المالية', 'المشتريات', 'تقنية المعلومات'];
  const positions = ['معلم', 'معلمة', 'إداري', 'أمين مستودع', 'مسؤول مشتريات', 'محاسب', 'مشرف', 'مدير مرحلة', 'مدير فرع'];

  // Generate EMP009-EMP030
  const generated = [] as Array<{
    employeeNumber: string;
    fullNameAr: string;
    fullNameEn: string;
    gender: Gender;
    maritalStatus: MaritalStatus;
    department: string;
    position: string;
    employeeRole: EmployeeRole;
    status: EmployeeStatus;
  }>;

  let idx = 9;
  for (const triple of extraNames) {
    if (idx > 30) break;

    const [a, b, c] = triple;
    const gender = idx % 2 === 0 ? Gender.FEMALE : Gender.MALE;
    const maritalStatus = idx % 3 === 0 ? MaritalStatus.MARRIED : MaritalStatus.SINGLE;
    const department = departments[idx % departments.length];
    const position = positions[idx % positions.length];

    // roles distribution
    let employeeRole: EmployeeRole = EmployeeRole.EMPLOYEE;
    if (position.includes('معلم') || position.includes('معلمة') || department === 'التعليم') employeeRole = EmployeeRole.TEACHER;
    if (position === 'مدير مرحلة') employeeRole = EmployeeRole.STAGE_MANAGER;
    if (position === 'مدير فرع') employeeRole = EmployeeRole.BRANCH_MANAGER;

    generated.push({
      employeeNumber: `EMP${String(idx).padStart(3, '0')}`,
      fullNameAr: `${a} ${b} ${c}`,
      fullNameEn: `${a} ${b} ${c}`,
      gender,
      maritalStatus,
      department,
      position,
      employeeRole,
      status: EmployeeStatus.ACTIVE,
    });

    idx++;
  }

  const all = [...employees, ...generated];

  // Create/update employees + assign to branches/stages
  const createdEmployees = [] as Array<{ id: string; employeeNumber: string; branchId?: string | null; stageId?: string | null; employeeRole: EmployeeRole }>;

  for (let i = 0; i < all.length; i++) {
    const e = all[i];

    const branch = branches[i % branches.length];
    const stageIds = stageByBranchName.get(branch.name) ?? [];
    const stageId = stageIds.length ? stageIds[i % stageIds.length] : null;

    // Create stable-looking IDs
    const nationalId = String(1000000000 + i).padStart(10, '0');

    const baseSalary = 6500 + (i % 7) * 1200;

    const emp = await prisma.employee.upsert({
      where: { employeeNumber: e.employeeNumber },
      update: {
        fullNameAr: e.fullNameAr,
        fullNameEn: e.fullNameEn,
        gender: e.gender,
        maritalStatus: e.maritalStatus,
        department: e.department,
        position: e.position,
        employeeRole: e.employeeRole,
        status: e.status,
        branchId: branch.id,
        stageId: stageId,
      },
      create: {
        employeeNumber: e.employeeNumber,
        fullNameAr: e.fullNameAr,
        fullNameEn: e.fullNameEn,
        nationalId,
        nationality: 'سعودي',
        dateOfBirth: new Date(1985 + (i % 12), (i % 12), 10 + (i % 10)),
        gender: e.gender,
        maritalStatus: e.maritalStatus,
        phone: `05${String(10000000 + i).padStart(8, '0')}`,
        email: `emp${String(i + 1).padStart(2, '0')}@albassam.edu.sa`,
        address: 'الرياض',
        city: 'الرياض',
        department: e.department,
        position: e.position,
        directManager: null,
        hireDate: new Date(2018 + (i % 7), (i % 12), 1 + (i % 25)),
        employmentType: i % 6 === 0 ? EmploymentType.CONTRACT : EmploymentType.PERMANENT,
        contractEndDate: i % 6 === 0 ? new Date(2027, 11, 31) : null,
        status: e.status,
        basicSalary: baseSalary,
        housingAllowance: 1500 + (i % 4) * 500,
        transportAllowance: 500 + (i % 4) * 150,
        otherAllowances: 0,
        bankName: i % 2 === 0 ? 'الراجحي' : 'الأهلي',
        bankAccountNumber: `1${String(200000000000000 + i).padStart(15, '0')}`,
        iban: `SA${String(10 + i).padStart(2, '0')}3456789012345678901234`,
        education: JSON.stringify([{ degree: 'بكالوريوس', institution: 'جامعة الملك سعود', year: 2010 + (i % 10) }]),
        certifications: JSON.stringify([]),
        branchId: branch.id,
        stageId: stageId,
        employeeRole: e.employeeRole,
      },
    });

    // Leave balance per employee (2026)
    const emergencyTotal = emp.gender === Gender.FEMALE ? 5 : 0;
    await prisma.leaveBalance.upsert({
      where: { employeeId: emp.id },
      update: {
        year: 2026,
        annualTotal: 30,
        annualUsed: 0,
        annualRemaining: 30,
        casualTotal: 5,
        casualUsed: 0,
        casualRemaining: 5,
        emergencyTotal,
        emergencyUsed: 0,
        emergencyRemaining: emergencyTotal,
      },
      create: {
        employeeId: emp.id,
        year: 2026,
        annualTotal: 30,
        annualUsed: 0,
        annualRemaining: 30,
        casualTotal: 5,
        casualUsed: 0,
        casualRemaining: 5,
        emergencyTotal,
        emergencyUsed: 0,
        emergencyRemaining: emergencyTotal,
      },
    });

    createdEmployees.push({ id: emp.id, employeeNumber: emp.employeeNumber, branchId: emp.branchId, stageId: emp.stageId, employeeRole: emp.employeeRole });
  }

  // Assign stage managers (one per stage) from employees with STAGE_MANAGER; if none, promote some
  const stageList = await prisma.stage.findMany({ where: { status: 'ACTIVE' }, orderBy: [{ branchId: 'asc' }, { name: 'asc' }] });

  let stageManagers = createdEmployees.filter((e) => e.employeeRole === EmployeeRole.STAGE_MANAGER);
  if (stageManagers.length < stageList.length) {
    // promote first N employees to stage manager
    const need = stageList.length - stageManagers.length;
    const promotable = createdEmployees.filter((e) => e.employeeRole === EmployeeRole.TEACHER || e.employeeRole === EmployeeRole.EMPLOYEE).slice(0, need);
    for (const p of promotable) {
      const updated = await prisma.employee.update({ where: { id: p.id }, data: { employeeRole: EmployeeRole.STAGE_MANAGER } });
      stageManagers.push({ id: updated.id, employeeNumber: updated.employeeNumber, branchId: updated.branchId, stageId: updated.stageId, employeeRole: updated.employeeRole });
    }
  }

  // Map stage -> manager from same branch if possible
  for (const s of stageList) {
    const candidate = stageManagers.find((m) => m.branchId === s.branchId) ?? stageManagers[0];
    if (!candidate) continue;
    await prisma.stage.update({
      where: { id: s.id },
      data: { managerId: candidate.id },
    });
  }

  console.log(`✅ Employees ready: ${all.length} employees (EMP001-EMP${String(all.length).padStart(3, '0')})`);
  return createdEmployees;
}

async function ensureAttendanceSettings() {
  console.log('⏰ Ensuring attendance settings...');
  const existing = await prisma.attendanceSettings.findFirst();
  if (existing) return;

  await prisma.attendanceSettings.create({
    data: {
      lateThresholdMinutes: 15,
      workHoursPerDay: 8,
      workStartTime: '08:00',
      workEndTime: '16:00',
      requireCheckOut: true,
      enableGpsTracking: false,
      enableGeofencing: false,
    },
  });
}

async function ensureAttendanceRecords(userIds: string[]) {
  console.log('📅 Seeding attendance records (last 7 days)...');

  const today = startOfDay(new Date());

  // Deterministic pattern per user/day
  for (const userId of userIds) {
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);

      // status rotation
      const mod = (i + userId.length) % 5;
      const status: AttendanceStatus =
        mod === 0 ? AttendanceStatus.PRESENT :
        mod === 1 ? AttendanceStatus.LATE :
        mod === 2 ? AttendanceStatus.ABSENT :
        mod === 3 ? AttendanceStatus.HALF_DAY :
        AttendanceStatus.EXCUSED;

      const checkIn = new Date(day);
      checkIn.setHours(status === AttendanceStatus.LATE ? 8 : 7, status === AttendanceStatus.LATE ? 35 : 55, 0, 0);

      const checkOut = status === AttendanceStatus.ABSENT ? null : addHours(checkIn, status === AttendanceStatus.HALF_DAY ? 4 : 8);
      const workHours = status === AttendanceStatus.ABSENT ? 0 : status === AttendanceStatus.HALF_DAY ? 4 : 8;

      // Check if record exists first
      const existing = await prisma.attendanceRecord.findFirst({
        where: {
          userId,
          date: day,
        },
      });

      if (existing) {
        await prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: {
            status,
            checkIn,
            checkOut,
            workHours,
            location: null,
            notes: status === AttendanceStatus.ABSENT ? 'غياب (بيانات تجريبية)' : 'بيانات تجريبية',
          },
        });
      } else {
        await prisma.attendanceRecord.create({
          data: {
            userId,
            date: day,
            status,
            checkIn,
            checkOut,
            workHours,
            location: null,
            notes: status === AttendanceStatus.ABSENT ? 'غياب (بيانات تجريبية)' : 'بيانات تجريبية',
          },
        });
      }
    }
  }

  console.log('✅ Attendance records seeded');
}

async function ensureWorkflows(reviewerUserId: string, approverUserId: string) {
  console.log('🔁 Seeding HR + Procurement workflows...');

  const hrTypes: RequestType[] = [
    RequestType.LEAVE,
    RequestType.UNPAID_LEAVE,
    RequestType.TICKET_ALLOWANCE,
    RequestType.FLIGHT_BOOKING,
    RequestType.SALARY_CERTIFICATE,
    RequestType.HOUSING_ALLOWANCE,
    RequestType.VISA_EXIT_REENTRY_SINGLE,
    RequestType.VISA_EXIT_REENTRY_MULTI,
    RequestType.RESIGNATION,
  ];

  const getStepsForType = (t: RequestType) => {
    // Important: userId on steps is kept as a FK placeholder.
    // Real routing is resolved dynamically in API based on branch manager / HR roles.
    const branchManagerFirst: RequestType[] = [
      RequestType.LEAVE,
      RequestType.UNPAID_LEAVE,
      RequestType.FLIGHT_BOOKING,
      RequestType.VISA_EXIT_REENTRY_SINGLE,
      RequestType.VISA_EXIT_REENTRY_MULTI,
      RequestType.RESIGNATION,
    ];

    if (branchManagerFirst.includes(t)) {
      return [
        { order: 0, userId: approverUserId, statusName: 'اعتماد مدير الفرع' },
        { order: 1, userId: approverUserId, statusName: 'اعتماد مدير الموارد البشرية' },
      ]
    }

    const hrReviewFirst: RequestType[] = [RequestType.TICKET_ALLOWANCE, RequestType.HOUSING_ALLOWANCE]

    if (hrReviewFirst.includes(t)) {
      return [
        { order: 0, userId: reviewerUserId, statusName: 'مراجعة الموارد البشرية' },
        { order: 1, userId: approverUserId, statusName: 'اعتماد مدير الموارد البشرية' },
      ]
    }

    if (t === RequestType.SALARY_CERTIFICATE) {
      return [
        { order: 0, userId: reviewerUserId, statusName: 'إعداد التعريف' },
        { order: 1, userId: approverUserId, statusName: 'اعتماد مدير الموارد البشرية' },
      ]
    }

    return [
      { order: 0, userId: reviewerUserId, statusName: 'مراجعة الموارد البشرية' },
      { order: 1, userId: approverUserId, statusName: 'اعتماد مدير الموارد البشرية' },
    ]
  }

  for (const t of hrTypes) {
    const wf = await prisma.hRRequestTypeWorkflow.upsert({
      where: { requestType: t },
      update: {
        reviewerUserId,
        approverUserId,
        requireReview: true,
        requireApproval: true,
        autoApprove: false,
        updatedBy: approverUserId,
      },
      create: {
        requestType: t,
        reviewerUserId,
        approverUserId,
        requireReview: true,
        requireApproval: true,
        autoApprove: false,
        updatedBy: approverUserId,
      },
    });

    const steps = getStepsForType(t)

    for (const s of steps) {
      // Ensure step exists by (workflowId, order) — no unique constraint, so use findFirst
      const existing = await prisma.hRWorkflowStep.findFirst({ where: { workflowId: wf.id, order: s.order } });
      if (existing) {
        await prisma.hRWorkflowStep.update({ where: { id: existing.id }, data: { userId: s.userId, statusName: s.statusName } });
      } else {
        await prisma.hRWorkflowStep.create({ data: { workflowId: wf.id, order: s.order, userId: s.userId, statusName: s.statusName } });
      }
    }
  }

  // Procurement workflows (a subset to keep it simple but functional)
  // Preferred approval path: abdullahsh -> mq (if those users exist)
  const abdullah = await prisma.user.findUnique({ where: { username: 'abdullahsh' }, select: { id: true } }).catch(() => null)
  const mq = await prisma.user.findUnique({ where: { username: 'mq' }, select: { id: true } }).catch(() => null)

  const procurementReviewerId = abdullah?.id || reviewerUserId
  const procurementApproverId = mq?.id || approverUserId

  const prCats: PurchaseCategory[] = [
    PurchaseCategory.STATIONERY,
    PurchaseCategory.MAINTENANCE,
    PurchaseCategory.TECHNOLOGY,
    PurchaseCategory.FURNITURE,
    PurchaseCategory.CLEANING,
  ];

  for (const c of prCats) {
    const wf = await prisma.procurementCategoryWorkflow.upsert({
      where: { category: c },
      update: {
        reviewerUserId: procurementReviewerId,
        approverUserId: procurementApproverId,
        requireReview: true,
        requireApproval: true,
        autoApprove: false,
        updatedBy: procurementApproverId,
      },
      create: {
        category: c,
        reviewerUserId: procurementReviewerId,
        approverUserId: procurementApproverId,
        requireReview: true,
        requireApproval: true,
        autoApprove: false,
        updatedBy: procurementApproverId,
      },
    });

    const steps = [
      { order: 0, userId: procurementReviewerId, statusName: 'مراجعة المشتريات' },
      { order: 1, userId: procurementApproverId, statusName: 'اعتماد المشتريات' },
    ];

    for (const s of steps) {
      const existing = await prisma.procurementWorkflowStep.findFirst({ where: { workflowId: wf.id, order: s.order } });
      if (existing) {
        await prisma.procurementWorkflowStep.update({ where: { id: existing.id }, data: { userId: s.userId, statusName: s.statusName } });
      } else {
        await prisma.procurementWorkflowStep.create({ data: { workflowId: wf.id, order: s.order, userId: s.userId, statusName: s.statusName } });
      }
    }
  }

  console.log('✅ Workflows ready');
}

async function ensureHRRequests(employeeUserIds: string[], reviewerUserId: string, approverUserId: string) {
  console.log('📝 Seeding HR requests (10-15, mixed statuses)...');

  const existingCount = await prisma.hRRequest.count();
  if (existingCount >= 10) {
    console.log(`⏭️  HR requests already exist (${existingCount}), skipping creation`);
    return;
  }

  const samples: Array<{
    type: RequestType;
    status: RequestStatus;
    employeeId: string;
    payload: Partial<{
      startDate: Date;
      endDate: Date;
      leaveType: string;
      destination: string;
      travelDate: Date;
      departureDate: Date;
      returnDate: Date;
      amount: number;
      period: string;
      purpose: string;
      recipientOrganization: string;
      reason: string;
    }>;
  }> = [];

  const pickUser = (i: number) => employeeUserIds[i % employeeUserIds.length];

  for (let i = 0; i < 12; i++) {
    const type: RequestType =
      i % 5 === 0 ? RequestType.LEAVE :
      i % 5 === 1 ? RequestType.TICKET_ALLOWANCE :
      i % 5 === 2 ? RequestType.FLIGHT_BOOKING :
      i % 5 === 3 ? RequestType.SALARY_CERTIFICATE :
      RequestType.HOUSING_ALLOWANCE;

    const status: RequestStatus =
      i % 3 === 0 ? RequestStatus.PENDING_REVIEW : i % 3 === 1 ? RequestStatus.APPROVED : RequestStatus.REJECTED;

    const employeeId = pickUser(i);

    const base = daysAgo(10 + i);
    const payload: any = { reason: `طلب تجريبي رقم ${i + 1}` };

    if (type === RequestType.LEAVE) {
      payload.startDate = startOfDay(base);
      payload.endDate = startOfDay(addHours(base, 24 * (2 + (i % 4))));
      payload.leaveType = i % 2 === 0 ? 'annual' : 'sick';
    }

    if (type === RequestType.TICKET_ALLOWANCE) {
      payload.destination = i % 2 === 0 ? 'جدة' : 'الدمام';
      payload.travelDate = startOfDay(daysAgo(20 - i));
      payload.amount = 1200 + i * 50;
    }

    if (type === RequestType.FLIGHT_BOOKING) {
      payload.destination = i % 2 === 0 ? 'القاهرة' : 'دبي';
      payload.departureDate = startOfDay(daysAgo(15 - i));
      payload.returnDate = startOfDay(daysAgo(10 - i));
    }

    if (type === RequestType.SALARY_CERTIFICATE) {
      payload.purpose = i % 2 === 0 ? 'فتح حساب بنكي' : 'تقديم على قرض';
    }

    if (type === RequestType.HOUSING_ALLOWANCE) {
      payload.amount = 3000 + i * 100;
      payload.period = 'شهري';
    }

    samples.push({ type, status, employeeId, payload });
  }

  for (const s of samples) {
    await prisma.hRRequest.create({
      data: {
        type: s.type,
        status: s.status,
        employeeId: s.employeeId,
        currentWorkflowStep: s.status === RequestStatus.PENDING_REVIEW ? 0 : null,
        startDate: s.payload.startDate ?? null,
        endDate: s.payload.endDate ?? null,
        leaveType: (s.payload as any).leaveType ?? null,
        destination: (s.payload as any).destination ?? null,
        travelDate: (s.payload as any).travelDate ?? null,
        departureDate: (s.payload as any).departureDate ?? null,
        returnDate: (s.payload as any).returnDate ?? null,
        amount: (s.payload as any).amount ?? null,
        period: (s.payload as any).period ?? null,
        purpose: (s.payload as any).purpose ?? null,
        recipientOrganization: (s.payload as any).recipientOrganization ?? null,
        reason: (s.payload as any).reason ?? null,
        reviewedBy: s.status === RequestStatus.PENDING_REVIEW ? null : reviewerUserId,
        reviewedAt: s.status === RequestStatus.PENDING_REVIEW ? null : new Date(),
        reviewComment: s.status === RequestStatus.REJECTED ? 'مرفوض (بيانات تجريبية)' : 'تمت المراجعة (بيانات تجريبية)',
        approvedBy: s.status === RequestStatus.APPROVED ? approverUserId : null,
        approvedAt: s.status === RequestStatus.APPROVED ? new Date() : null,
        approvalComment: s.status === RequestStatus.APPROVED ? 'تمت الموافقة (بيانات تجريبية)' : null,
      },
    });
  }

  console.log('✅ HR requests seeded');
}

async function ensureProcurementData(requesterUserIds: string[], reviewerUserId: string, approverUserId: string) {
  console.log('🛒 Seeding procurement (suppliers, requests, quotations, orders)...');

  const suppliersData = [
    { name: 'شركة قرطاس للقرطاسية', category: 'قرطاسية', phone: '0111111111', email: 'sales@qirtas.sa' },
    { name: 'مؤسسة النخيل للنظافة', category: 'نظافة', phone: '0112222222', email: 'info@nakheel.sa' },
    { name: 'شركة التقنية المتقدمة', category: 'تقنية', phone: '0113333333', email: 'sales@tech.sa' },
    { name: 'مصنع الأثاث الوطني', category: 'أثاث', phone: '0114444444', email: 'sales@furniture.sa' },
    { name: 'شركة الصيانة السريعة', category: 'صيانة', phone: '0115555555', email: 'support@maintenance.sa' },
    { name: 'مكتبة العلم', category: 'كتب', phone: '0116666666', email: 'contact@elm.sa' },
    { name: 'شركة الزي المدرسي', category: 'زي', phone: '0117777777', email: 'orders@uniform.sa' },
    { name: 'مورد عام', category: 'عام', phone: '0118888888', email: 'hello@general.sa' },
  ];

  const suppliers = [] as Array<{ id: string; name: string }>;
  for (const s of suppliersData) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    const supplier =
      existing ??
      (await prisma.supplier.create({
        data: {
          name: s.name,
          category: s.category,
          phone: s.phone,
          email: s.email,
          isActive: true,
          rating: 4.2,
          notes: 'بيانات تجريبية',
        },
      }));
    suppliers.push({ id: supplier.id, name: supplier.name });
  }

  const year = new Date().getFullYear();
  const reqs = [] as Array<{ id: string; requestNumber: string; items: any[]; supplierId?: string | null }>;

  for (let i = 1; i <= 12; i++) {
    const requestNumber = `PR-${year}-S${String(i).padStart(4, '0')}`;
    const requestedById = requesterUserIds[(i - 1) % requesterUserIds.length];
    const category = (Object.values(PurchaseCategory) as PurchaseCategory[])[i % Object.values(PurchaseCategory).length];
    const supplierId = suppliers[i % suppliers.length]?.id;

    const items = [
      {
        name: i % 2 === 0 ? 'ورق A4' : 'حبر طابعة',
        quantity: 10 + i,
        unit: 'علبة',
        specifications: 'مواصفات قياسية',
        estimatedPrice: 55 + i * 3,
      },
      {
        name: i % 3 === 0 ? 'مقاعد طلاب' : 'منظفات',
        quantity: 2 + (i % 5),
        unit: 'قطعة',
        specifications: 'حسب الحاجة',
        estimatedPrice: 180 + i * 12,
      },
    ];

    const status: PurchaseRequestStatus =
      i % 4 === 0 ? PurchaseRequestStatus.APPROVED :
      i % 4 === 1 ? PurchaseRequestStatus.PENDING_REVIEW :
      i % 4 === 2 ? PurchaseRequestStatus.REVIEWED :
      PurchaseRequestStatus.REJECTED;

    const existing = await prisma.purchaseRequest.findUnique({ where: { requestNumber } });
    const pr =
      existing ??
      (await prisma.purchaseRequest.create({
        data: {
          requestNumber,
          requestedById,
          department: i % 2 === 0 ? 'الإدارة' : 'التعليم',
          category,
          items: JSON.stringify(items),
          priority: i % 5 === 0 ? PurchasePriority.URGENT : PurchasePriority.NORMAL,
          status,
          currentWorkflowStep: status === PurchaseRequestStatus.PENDING_REVIEW ? 0 : null,
          justification: 'شراء مستلزمات (بيانات تجريبية)',
          attachments: null,
          estimatedBudget: 2000 + i * 250,
          requiredDate: startOfDay(daysAgo(2 - (i % 3))),
          supplierId: supplierId ?? null,
          reviewedById: status === PurchaseRequestStatus.REVIEWED || status === PurchaseRequestStatus.APPROVED ? reviewerUserId : null,
          reviewedAt: status === PurchaseRequestStatus.REVIEWED || status === PurchaseRequestStatus.APPROVED ? new Date() : null,
          reviewNotes: status === PurchaseRequestStatus.REJECTED ? 'مرفوض (بيانات تجريبية)' : 'تمت المراجعة (بيانات تجريبية)',
          approvedById: status === PurchaseRequestStatus.APPROVED ? approverUserId : null,
          approvedAt: status === PurchaseRequestStatus.APPROVED ? new Date() : null,
          approvalNotes: status === PurchaseRequestStatus.APPROVED ? 'تمت الموافقة (بيانات تجريبية)' : null,
          rejectedReason: status === PurchaseRequestStatus.REJECTED ? 'غير مطابق للميزانية (بيانات تجريبية)' : null,
        },
      }));

    reqs.push({ id: pr.id, requestNumber: pr.requestNumber, items, supplierId: pr.supplierId });
  }

  // Quotations (for first 6 requests)
  for (let i = 0; i < Math.min(6, reqs.length); i++) {
    const pr = reqs[i];
    const supplier = suppliers[i % suppliers.length];
    const quotationNumber = `QT-${year}-S${String(i + 1).padStart(4, '0')}`;

    const quotedItems = pr.items.map((it) => ({
      itemName: it.name,
      quantity: it.quantity,
      unitPrice: Math.max(10, Math.round((it.estimatedPrice ?? 50) * 0.95)),
      totalPrice: Math.max(10, Math.round((it.estimatedPrice ?? 50) * 0.95)) * it.quantity,
      notes: 'عرض سعر تجريبي',
    }));

    const totalAmount = quotedItems.reduce((sum: number, x: any) => sum + x.totalPrice, 0);

    const existing = await prisma.quotation.findUnique({ where: { quotationNumber } });
    if (!existing) {
      await prisma.quotation.create({
        data: {
          purchaseRequestId: pr.id,
          supplierId: supplier.id,
          quotationNumber,
          quotedItems: JSON.stringify(quotedItems),
          totalAmount,
          validUntil: startOfDay(daysAgo(-15)),
          paymentTerms: '30 يوم',
          deliveryTime: '7-10 أيام',
          notes: 'بيانات تجريبية',
          status: i % 3 === 0 ? QuotationStatus.ACCEPTED : QuotationStatus.PENDING,
        },
      });
    }
  }

  // Purchase Orders (for approved requests)
  const approvedReqs = await prisma.purchaseRequest.findMany({ where: { status: PurchaseRequestStatus.APPROVED } });
  let poIndex = 1;
  for (const pr of approvedReqs.slice(0, 8)) {
    const orderNumber = `PO-${year}-S${String(poIndex).padStart(4, '0')}`;
    poIndex++;

    const existing = await prisma.purchaseOrder.findUnique({ where: { orderNumber } });
    if (existing) continue;

    const items = JSON.parse(pr.items).map((it: any) => {
      const unitPrice = Math.max(10, Math.round((it.estimatedPrice ?? 50) * 0.92));
      const totalPrice = unitPrice * (it.quantity ?? 1);
      return {
        name: it.name,
        quantity: it.quantity,
        unit: it.unit,
        unitPrice,
        totalPrice,
        specifications: it.specifications ?? null,
      };
    });

    const totalAmount = items.reduce((sum: number, x: any) => sum + x.totalPrice, 0);
    const tax = Math.round(totalAmount * 0.15);
    const finalAmount = totalAmount + tax;

    await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        purchaseRequestId: pr.id,
        supplierId: pr.supplierId ?? suppliers[0].id,
        status: poIndex % 4 === 0 ? PurchaseOrderStatus.COMPLETED : PurchaseOrderStatus.APPROVED,
        items: JSON.stringify(items),
        totalAmount,
        tax,
        discount: 0,
        finalAmount,
        paymentTerms: 'تحويل بنكي - 30 يوم',
        deliveryTerms: 'تسليم لمقر المدرسة',
        notes: 'أمر شراء تجريبي',
        attachments: null,
        createdById: approverUserId,
        approvedById: approverUserId,
        approvedAt: new Date(),
      },
    });
  }

  console.log('✅ Procurement seeded');
}

async function ensureTasks(ownerIds: string[], createdById: string) {
  console.log('✅ Seeding tasks (15-20)...');

  const existing = await prisma.task.count();
  if (existing >= 15) {
    console.log(`⏭️  Tasks already exist (${existing}), skipping creation`);
    return;
  }

  const titles = [
    'متابعة عقد مورد',
    'إنهاء معاملة تجديد رخصة',
    'تجهيز مستندات موظف جديد',
    'رفع تقرير حضور الأسبوع',
    'مراجعة طلب شراء',
    'إعداد شهادة راتب',
    'تحديث بيانات موظف',
    'تنسيق اجتماع إداري',
    'اعتماد أمر شراء',
    'تسوية خصومات الحضور',
  ];

  for (let i = 0; i < 20; i++) {
    const ownerId = ownerIds[i % ownerIds.length];
    const title = `${titles[i % titles.length]} #${i + 1}`;
    const status: TaskStatus = i % 3 === 0 ? TaskStatus.NEW : i % 3 === 1 ? TaskStatus.IN_PROGRESS : TaskStatus.DONE;
    const priority: TaskPriority = i % 4 === 0 ? TaskPriority.HIGH : i % 4 === 1 ? TaskPriority.MEDIUM : TaskPriority.LOW;
    const category: TaskCategory = i % 2 === 0 ? TaskCategory.HR : TaskCategory.TRANSACTIONS;

    await prisma.task.create({
      data: {
        title,
        description: 'مهمة تجريبية لاختبار الفلاتر والبحث',
        category,
        status,
        priority,
        isPrivate: false,
        dueDate: i % 4 === 0 ? daysAgo(-3 - i) : null,
        checklist: JSON.stringify([
          { id: '1', text: 'بدء التنفيذ', completed: status !== TaskStatus.NEW },
          { id: '2', text: 'مراجعة', completed: status === TaskStatus.DONE },
        ]),
        ownerId,
        createdById,
      },
    });
  }
}

async function ensureSampleLeave() {
  // Keep a single approved leave for one employee (EMP007) so HR/attendance sync can be tested
  const emp = await prisma.employee.findUnique({ where: { employeeNumber: 'EMP007' } });
  if (!emp) return;

  const existingLeave = await prisma.leave.findFirst({ where: { employeeId: emp.id } });
  if (existingLeave) return;

  await prisma.leave.create({
    data: {
      employeeId: emp.id,
      type: 'ANNUAL',
      startDate: new Date('2026-02-10'),
      endDate: new Date('2026-02-17'),
      days: 7,
      reason: 'إجازة سنوية (بيانات تجريبية)',
      status: 'APPROVED',
      reviewedBy: 'الموارد البشرية',
      reviewedAt: new Date('2026-02-05'),
      reviewNotes: 'موافق',
    },
  });
}

async function ensureUserEmployeeLinks(mohammedUserId: string, hrUserId: string) {
  console.log('🔗 Linking users to employees...');

  const adminEmp = await prisma.employee.findUnique({ where: { employeeNumber: 'EMP001' } });
  const hrEmp = await prisma.employee.findUnique({ where: { employeeNumber: 'EMP002' } });

  if (adminEmp) {
    await prisma.employee.update({ where: { id: adminEmp.id }, data: { userId: mohammedUserId } });
  }

  if (hrEmp) {
    await prisma.employee.update({ where: { id: hrEmp.id }, data: { userId: hrUserId } });
  }

  console.log('✅ User-employee links ready');
}

function pad3(n: number) {
  return String(n).padStart(3, '0');
}

async function ensurePositionsAndHeadcount() {
  console.log('🧱 Seeding positions + department headcount...');

  const opener =
    (await prisma.employee.findUnique({ where: { employeeNumber: 'EMP002' } })) ??
    (await prisma.employee.findFirst({ orderBy: { createdAt: 'asc' } }));

  if (!opener) {
    console.warn('⚠️ No employees found; skipping positions/headcount seed');
    return;
  }

  const year = new Date().getFullYear();

  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeNumber: true,
      department: true,
      position: true,
      hireDate: true,
    },
    orderBy: { employeeNumber: 'asc' },
  });

  let posSeq = (await prisma.organizationalPosition.count()) + 1;

  // 1) Create FILLED positions for all employees (if missing)
  for (const emp of employees) {
    const existing = await prisma.organizationalPosition.findFirst({
      where: { currentEmployeeId: emp.id },
      select: { id: true },
    });

    if (existing) continue;

    const code = `POS-${year}-${pad3(posSeq)}`;
    posSeq++;

    const position = await prisma.organizationalPosition.create({
      data: {
        code,
        title: emp.position,
        titleEn: null,
        department: emp.department,
        level: 'Mid',
        status: 'FILLED',
        currentEmployeeId: emp.id,
        salaryMin: null,
        salaryMax: null,
        description: null,
        requirements: null,
        openedAt: emp.hireDate,
        openedBy: opener.id,
        approvalDocument: null,
        approvalNotes: 'Seed: auto-created for existing employee',
      },
    });

    await prisma.positionHistory.createMany({
      data: [
        {
          positionId: position.id,
          action: 'OPENED',
          employeeId: emp.id,
          performedBy: opener.id,
          notes: `Seed: opened position for ${emp.employeeNumber}`,
        },
        {
          positionId: position.id,
          action: 'FILLED',
          employeeId: emp.id,
          performedBy: opener.id,
          notes: `Seed: marked filled for ${emp.employeeNumber}`,
        },
      ],
    });
  }

  // 2) Seed DepartmentHeadcount based on current employees
  const deptCounts = new Map<string, number>();
  for (const emp of employees) {
    deptCounts.set(emp.department, (deptCounts.get(emp.department) ?? 0) + 1);
  }

  for (const [dept, filledCount] of deptCounts.entries()) {
    const buffer = dept === 'التعليم' ? 2 : 0;
    const approvedCount = filledCount + buffer;

    await prisma.departmentHeadcount.upsert({
      where: { department: dept },
      update: {
        approvedCount,
        currentCount: filledCount,
        notes: 'Seed: initial headcount generated from employees',
      },
      create: {
        department: dept,
        approvedCount,
        currentCount: filledCount,
        notes: 'Seed: initial headcount generated from employees',
      },
    });

    // Create a single VACANT slot (if there is room) to enable JobApplication testing,
    // while keeping some remaining room for opening new positions.
    if (buffer > 0) {
      const existingVacant = await prisma.organizationalPosition.count({
        where: { department: dept, status: 'VACANT' },
      });

      if (existingVacant < 1) {
        const code = `POS-${year}-${pad3(posSeq)}`;
        posSeq++;

        const vacancy = await prisma.organizationalPosition.create({
          data: {
            code,
            title: 'وظيفة شاغرة (Seed)',
            titleEn: 'Vacant (Seed)',
            department: dept,
            level: 'Mid',
            status: 'VACANT',
            currentEmployeeId: null,
            salaryMin: null,
            salaryMax: null,
            description: 'Seed: vacant position to test hiring flows',
            requirements: null,
            openedBy: opener.id,
            approvalDocument: null,
            approvalNotes: 'Seed: created a vacant position for testing',
          },
        });

        await prisma.positionHistory.create({
          data: {
            positionId: vacancy.id,
            action: 'OPENED',
            employeeId: null,
            performedBy: opener.id,
            notes: 'Seed: created vacant position',
          },
        });
      }
    }
  }

  console.log('✅ Positions + headcount seeded');
}

async function main() {
  console.log('🌱 Starting seed...');

  const commonPasswordHash = await bcrypt.hash('albassam2024', 10);

  await ensureBranchesAndStages();
  const { mohammed, user1, regularUsers } = await ensureUsers(commonPasswordHash);
  await ensureTaskTemplates(mohammed.id);

  await ensureEmployeesAndAssignments();
  await ensureUserEmployeeLinks(mohammed.id, user1.id);
  await ensurePositionsAndHeadcount();
  await ensureSampleLeave();

  await ensureAttendanceSettings();
  await ensureWorkflows(user1.id, mohammed.id);

  await ensureHRRequests(regularUsers.map((u) => u.id), user1.id, mohammed.id);
  await ensureAttendanceRecords(regularUsers.map((u) => u.id));
  await ensureProcurementData(regularUsers.map((u) => u.id), user1.id, mohammed.id);
  await ensureTasks([mohammed.id, user1.id, ...regularUsers.map((u) => u.id)], mohammed.id);

  console.log('🎉 Seed completed successfully!');
  console.log('🔐 Test logins (all same password):');
  console.log('- mohammed (ADMIN)');
  console.log('- user1 (HR_EMPLOYEE)');
  console.log('- user2..user6 (USER)');
  console.log('Password: albassam2024');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
