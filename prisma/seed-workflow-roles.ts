import { PrismaClient, WorkflowLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding workflow roles...');

  const roles = [
    // STAGE Level (مستوى المرحلة)
    {
      slug: 'stage_manager',
      nameAr: 'مدير المرحلة',
      nameEn: 'Stage Manager',
      level: WorkflowLevel.STAGE,
      description: 'مدير مرحلة دراسية أو قسم'
    },
    {
      slug: 'stage_deputy',
      nameAr: 'وكيل المرحلة',
      nameEn: 'Stage Deputy',
      level: WorkflowLevel.STAGE,
      description: 'وكيل مرحلة دراسية أو قسم'
    },
    
    // DEPARTMENT Level (مستوى القسم)
    {
      slug: 'hr_manager',
      nameAr: 'مدير الموارد البشرية',
      nameEn: 'HR Manager',
      level: WorkflowLevel.DEPARTMENT,
      description: 'مدير قسم الموارد البشرية'
    },
    {
      slug: 'procurement_manager',
      nameAr: 'مدير المشتريات',
      nameEn: 'Procurement Manager',
      level: WorkflowLevel.DEPARTMENT,
      description: 'مدير قسم المشتريات'
    },
    {
      slug: 'finance_manager',
      nameAr: 'مدير المالية',
      nameEn: 'Finance Manager',
      level: WorkflowLevel.DEPARTMENT,
      description: 'مدير قسم المالية'
    },
    {
      slug: 'maintenance_manager',
      nameAr: 'مدير الصيانة',
      nameEn: 'Maintenance Manager',
      level: WorkflowLevel.DEPARTMENT,
      description: 'مدير قسم الصيانة'
    },
    
    // COMPANY Level (مستوى الشركة)
    {
      slug: 'director',
      nameAr: 'المدير العام',
      nameEn: 'Director',
      level: WorkflowLevel.COMPANY,
      description: 'المدير العام للشركة'
    },
    {
      slug: 'ceo',
      nameAr: 'الرئيس التنفيذي',
      nameEn: 'CEO',
      level: WorkflowLevel.COMPANY,
      description: 'الرئيس التنفيذي للشركة'
    },
    {
      slug: 'cfo',
      nameAr: 'المدير المالي',
      nameEn: 'CFO',
      level: WorkflowLevel.COMPANY,
      description: 'المدير المالي التنفيذي'
    }
  ];

  for (const role of roles) {
    await prisma.workflowRole.upsert({
      where: { slug: role.slug },
      update: role,
      create: role
    });
    console.log(`✅ Created/Updated role: ${role.nameAr} (${role.slug})`);
  }

  console.log('✅ Workflow roles seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding workflow roles:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
