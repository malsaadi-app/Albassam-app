const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// المسميات الوظيفية (31 مسمى)
const jobTitles = [
  'المشرف العام',
  'مدير مرحلة',
  'وكيل مدرسة',
  'وكيل الشؤون المدرسية',
  'المدير المالي',
  'نائب الرئيس',
  'مدير قسم الخدمات المساندة',
  'مدير الموارد البشرية',
  'مشرف تربوي',
  'مشرف حافلات',
  'مشرف سكن',
  'مراقب دور',
  'موجه طلابي',
  'معلم',
  'منسق صفوف أولية',
  'مصادر تعلم',
  'محاسب',
  'موظف استقبال',
  'مسؤول الصيانة',
  'مساعد إداري',
  'سكرتير',
  'موظف',
  'موظف قسم الموارد البشرية',
  'تسجيل قبول',
  'سائق',
  'حارس أمن',
  'عامل',
  'طاقم مساند',
  'مدير تطوير الأعمال',
  'رئيس قسم الجودة',
  'مدير القسم الإعلامي'
];

// الأقسام (32 قسم)
const departments = [
  'الإدارة العليا - بنين',
  'الإدارة المالية',
  'إدارة عليا - بنات',
  'الإرشاد الطلابي',
  'الاجتماعيات',
  'التربية الإسلامية',
  'التربية البدنية',
  'التربية الفنية',
  'الحاسب الآلي',
  'الرياضيات',
  'الصفوف الأولية',
  'الصفوف العليا',
  'العلوم',
  'اللغة العربية',
  'اللغة الإنجليزية',
  'النشاط الطلابي',
  'القسم الإعلامي',
  'القسم الصحي والتمريض',
  'القسم الثانوي',
  'القسم المتوسط',
  'قسم الإشراف التربوي',
  'قسم البرنامج الدولي',
  'قسم التدريب',
  'قسم الخدمات المساندة',
  'قسم الجودة',
  'قسم السكرتارية والاستقبال',
  'قسم الشؤون الإدارية',
  'قسم القبول والتسجيل',
  'قسم المراسلة',
  'قسم المكتبة',
  'قسم الموارد البشرية',
  'قسم تقنية المعلومات'
];

async function main() {
  console.log('🚀 Starting master data seed...\n');

  // استيراد المسميات الوظيفية
  console.log('📋 Seeding Job Titles...');
  let jobTitleCount = 0;
  for (let i = 0; i < jobTitles.length; i++) {
    const title = jobTitles[i];
    const existing = await prisma.jobTitle.findFirst({
      where: { nameAr: title }
    });
    
    if (!existing) {
      await prisma.jobTitle.create({
        data: {
          nameAr: title,
          sortOrder: i + 1,
          isActive: true
        }
      });
      jobTitleCount++;
    }
  }
  console.log(`✅ Created ${jobTitleCount} job titles (${jobTitles.length - jobTitleCount} already existed)\n`);

  // استيراد الأقسام
  console.log('🏢 Seeding Departments...');
  let deptCount = 0;
  for (let i = 0; i < departments.length; i++) {
    const dept = departments[i];
    const existing = await prisma.department.findFirst({
      where: { nameAr: dept }
    });
    
    if (!existing) {
      await prisma.department.create({
        data: {
          nameAr: dept,
          sortOrder: i + 1,
          isActive: true
        }
      });
      deptCount++;
    }
  }
  console.log(`✅ Created ${deptCount} departments (${departments.length - deptCount} already existed)\n`);

  console.log('🎉 Master data seed completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Job Titles: ${jobTitles.length} total`);
  console.log(`   - Departments: ${departments.length} total`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding master data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
