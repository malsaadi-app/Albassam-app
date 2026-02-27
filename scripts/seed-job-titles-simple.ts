/**
 * Seed Job Titles Only
 * Adds sample job titles to the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Seeding Job Titles...');

  // Job Titles (المسميات الوظيفية)
  const jobTitles = [
    { nameAr: 'معلم', nameEn: 'Teacher', category: 'تعليمي' },
    { nameAr: 'معلم أول', nameEn: 'Senior Teacher', category: 'تعليمي' },
    { nameAr: 'معلم متخصص', nameEn: 'Specialist Teacher', category: 'تعليمي' },
    { nameAr: 'رئيس قسم', nameEn: 'Department Head', category: 'إداري' },
    { nameAr: 'وكيل مدرسة', nameEn: 'Vice Principal', category: 'إداري' },
    { nameAr: 'مدير مدرسة', nameEn: 'Principal', category: 'إداري' },
    { nameAr: 'مدير عام', nameEn: 'General Manager', category: 'إداري' },
    { nameAr: 'نائب المدير العام', nameEn: 'Assistant General Manager', category: 'إداري' },
    { nameAr: 'محاسب', nameEn: 'Accountant', category: 'مالي' },
    { nameAr: 'محاسب أول', nameEn: 'Senior Accountant', category: 'مالي' },
    { nameAr: 'مدير مالي', nameEn: 'Financial Manager', category: 'مالي' },
    { nameAr: 'موظف إداري', nameEn: 'Administrative Staff', category: 'إداري' },
    { nameAr: 'موظف موارد بشرية', nameEn: 'HR Staff', category: 'إداري' },
    { nameAr: 'مدير موارد بشرية', nameEn: 'HR Manager', category: 'إداري' },
    { nameAr: 'مشرف تربوي', nameEn: 'Educational Supervisor', category: 'تعليمي' },
    { nameAr: 'منسق', nameEn: 'Coordinator', category: 'إداري' },
    { nameAr: 'سكرتير', nameEn: 'Secretary', category: 'إداري' },
    { nameAr: 'سكرتير تنفيذي', nameEn: 'Executive Secretary', category: 'إداري' },
    { nameAr: 'مرشد طلابي', nameEn: 'Student Counselor', category: 'تعليمي' },
    { nameAr: 'أخصائي نفسي', nameEn: 'Psychologist', category: 'تعليمي' },
    { nameAr: 'أمين مكتبة', nameEn: 'Librarian', category: 'خدمات' },
    { nameAr: 'فني معمل', nameEn: 'Lab Technician', category: 'فني' },
    { nameAr: 'فني حاسب آلي', nameEn: 'IT Technician', category: 'فني' },
    { nameAr: 'مسؤول تقنية معلومات', nameEn: 'IT Manager', category: 'فني' },
    { nameAr: 'عامل نظافة', nameEn: 'Cleaner', category: 'خدمات' },
    { nameAr: 'سائق', nameEn: 'Driver', category: 'خدمات' },
    { nameAr: 'حارس أمن', nameEn: 'Security Guard', category: 'خدمات' },
    { nameAr: 'مشرف نظافة', nameEn: 'Cleaning Supervisor', category: 'خدمات' },
    { nameAr: 'مشرف صيانة', nameEn: 'Maintenance Supervisor', category: 'فني' },
    { nameAr: 'عامل صيانة', nameEn: 'Maintenance Worker', category: 'فني' },
  ];

  console.log(`📝 Creating ${jobTitles.length} Job Titles...`);
  
  let created = 0;
  let existing = 0;
  
  for (const title of jobTitles) {
    try {
      await prisma.jobTitle.upsert({
        where: { nameAr: title.nameAr },
        update: {},
        create: title,
      });
      created++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        existing++;
      } else {
        console.error(`❌ Error creating ${title.nameAr}:`, error.message);
      }
    }
  }

  console.log(`✅ Created ${created} new job titles`);
  if (existing > 0) {
    console.log(`ℹ️  ${existing} job titles already existed`);
  }
  console.log('🎉 Job Titles seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
