/**
 * Seed Departments (Simple)
 * Adds sample departments to the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Seeding Departments...');

  // Departments (الأقسام)
  const departments = [
    { nameAr: 'التعليم', nameEn: 'Education', description: 'قسم الشؤون التعليمية والأكاديمية' },
    { nameAr: 'الموارد البشرية', nameEn: 'Human Resources', description: 'إدارة شؤون الموظفين والتوظيف' },
    { nameAr: 'المالية', nameEn: 'Finance', description: 'الشؤون المالية والمحاسبية' },
    { nameAr: 'الإدارة', nameEn: 'Administration', description: 'الشؤون الإدارية العامة' },
    { nameAr: 'تقنية المعلومات', nameEn: 'Information Technology', description: 'خدمات تقنية المعلومات والدعم الفني' },
    { nameAr: 'شؤون الطلاب', nameEn: 'Student Affairs', description: 'رعاية الطلاب والأنشطة الطلابية' },
    { nameAr: 'المكتبة', nameEn: 'Library', description: 'إدارة المكتبة والمصادر التعليمية' },
    { nameAr: 'الصيانة', nameEn: 'Maintenance', description: 'صيانة المباني والمرافق' },
    { nameAr: 'الأمن والسلامة', nameEn: 'Security & Safety', description: 'أمن وسلامة المدرسة' },
    { nameAr: 'النظافة', nameEn: 'Cleaning', description: 'خدمات النظافة والتعقيم' },
    { nameAr: 'النقل', nameEn: 'Transportation', description: 'خدمات النقل المدرسي' },
    { nameAr: 'النشاط الطلابي', nameEn: 'Student Activities', description: 'الأنشطة اللاصفية والرياضية' },
    { nameAr: 'التوجيه والإرشاد', nameEn: 'Guidance & Counseling', description: 'الإرشاد الطلابي والدعم النفسي' },
    { nameAr: 'الجودة', nameEn: 'Quality Assurance', description: 'ضمان الجودة والتطوير المستمر' },
    { nameAr: 'المشتريات', nameEn: 'Procurement', description: 'إدارة المشتريات والمخازن' },
  ];

  console.log(`📝 Creating ${departments.length} Departments...`);
  
  let created = 0;
  let existing = 0;
  
  for (const dept of departments) {
    try {
      await prisma.department.upsert({
        where: { nameAr: dept.nameAr },
        update: {},
        create: dept,
      });
      created++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        existing++;
      } else {
        console.error(`❌ Error creating ${dept.nameAr}:`, error.message);
      }
    }
  }

  console.log(`✅ Created ${created} new departments`);
  if (existing > 0) {
    console.log(`ℹ️  ${existing} departments already existed`);
  }
  console.log('🎉 Departments seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
