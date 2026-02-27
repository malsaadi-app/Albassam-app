/**
 * Seed Departments
 * Adds sample departments to the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Seeding Departments...');

  // Departments (الأقسام)
  const departments = [
    {
      nameAr: 'التعليم',
      nameEn: 'Education',
      description: 'قسم الشؤون التعليمية والأكاديمية',
      isActive: true,
    },
    {
      code: 'HR',
      nameAr: 'الموارد البشرية',
      nameEn: 'Human Resources',
      description: 'إدارة شؤون الموظفين والتوظيف',
      isActive: true,
    },
    {
      code: 'FINANCE',
      nameAr: 'المالية',
      nameEn: 'Finance',
      description: 'الشؤون المالية والمحاسبية',
      isActive: true,
    },
    {
      code: 'ADMIN',
      nameAr: 'الإدارة',
      nameEn: 'Administration',
      description: 'الشؤون الإدارية العامة',
      isActive: true,
    },
    {
      code: 'IT',
      nameAr: 'تقنية المعلومات',
      nameEn: 'Information Technology',
      description: 'خدمات تقنية المعلومات والدعم الفني',
      isActive: true,
    },
    {
      code: 'STUDENT_AFFAIRS',
      nameAr: 'شؤون الطلاب',
      nameEn: 'Student Affairs',
      description: 'رعاية الطلاب والأنشطة الطلابية',
      isActive: true,
    },
    {
      code: 'LIBRARY',
      nameAr: 'المكتبة',
      nameEn: 'Library',
      description: 'إدارة المكتبة والمصادر التعليمية',
      isActive: true,
    },
    {
      code: 'MAINTENANCE',
      nameAr: 'الصيانة',
      nameEn: 'Maintenance',
      description: 'صيانة المباني والمرافق',
      isActive: true,
    },
    {
      code: 'SECURITY',
      nameAr: 'الأمن والسلامة',
      nameEn: 'Security & Safety',
      description: 'أمن وسلامة المدرسة',
      isActive: true,
    },
    {
      code: 'CLEANING',
      nameAr: 'النظافة',
      nameEn: 'Cleaning',
      description: 'خدمات النظافة والتعقيم',
      isActive: true,
    },
    {
      code: 'TRANSPORTATION',
      nameAr: 'النقل',
      nameEn: 'Transportation',
      description: 'خدمات النقل المدرسي',
      isActive: true,
    },
    {
      code: 'ACTIVITIES',
      nameAr: 'النشاط الطلابي',
      nameEn: 'Student Activities',
      description: 'الأنشطة اللاصفية والرياضية',
      isActive: true,
    },
    {
      code: 'GUIDANCE',
      nameAr: 'التوجيه والإرشاد',
      nameEn: 'Guidance & Counseling',
      description: 'الإرشاد الطلابي والدعم النفسي',
      isActive: true,
    },
    {
      code: 'QUALITY',
      nameAr: 'الجودة',
      nameEn: 'Quality Assurance',
      description: 'ضمان الجودة والتطوير المستمر',
      isActive: true,
    },
    {
      code: 'PROCUREMENT',
      nameAr: 'المشتريات',
      nameEn: 'Procurement',
      description: 'إدارة المشتريات والمخازن',
      isActive: true,
    },
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
        console.error(`❌ Error creating ${dept.code}:`, error.message);
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
