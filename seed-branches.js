const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding branches and stages...');

  // Create branches with stages
  const branchesData = [
    {
      name: 'مجمع البسام الأهلية بنين',
      type: 'SCHOOL',
      commercialRegNo: '2050040241',
      workStartTime: '07:00',
      workEndTime: '14:00',
      stages: [
        { name: 'ابتدائية' },
        { name: 'متوسطة' },
        { name: 'ثانوية' }
      ]
    },
    {
      name: 'مجمع البسام الأهلية بنات',
      type: 'SCHOOL',
      commercialRegNo: '2050040241',
      workStartTime: '07:00',
      workEndTime: '14:00',
      stages: [
        { name: 'رياض أطفال' },
        { name: 'ابتدائية' },
        { name: 'متوسطة' },
        { name: 'ثانوية' }
      ]
    },
    {
      name: 'مجمع البسام العالمية بنات',
      type: 'SCHOOL',
      commercialRegNo: '2050110165',
      workStartTime: '07:00',
      workEndTime: '14:00',
      stages: [
        { name: 'رياض أطفال' },
        { name: 'ابتدائية' },
        { name: 'متوسطة' },
        { name: 'ثانوية' }
      ]
    },
    {
      name: 'معهد البسام العالي للتدريب (رجالي)',
      type: 'INSTITUTE',
      commercialRegNo: '2050089277',
      workStartTime: '07:00',
      workEndTime: '14:00',
      stages: []
    },
    {
      name: 'معهد البسام العالي للتدريب (النسائي)',
      type: 'INSTITUTE',
      commercialRegNo: '2050089294',
      workStartTime: '07:00',
      workEndTime: '14:00',
      stages: []
    },
    {
      name: 'شركة الصفر التجارية',
      type: 'COMPANY',
      commercialRegNo: '2050015622',
      workStartTime: '07:00',
      workEndTime: '14:00',
      stages: []
    },
    {
      name: 'شركة يوسف حمد البسام وشركاه',
      type: 'COMPANY',
      commercialRegNo: '2050034348',
      workStartTime: '07:00',
      workEndTime: '14:00',
      stages: []
    },
    {
      name: 'فرع شركة يوسف حمد البسام وشركاه',
      type: 'COMPANY',
      commercialRegNo: '2050084516',
      workStartTime: '07:00',
      workEndTime: '14:00',
      stages: []
    }
  ];

  for (const branchData of branchesData) {
    const { stages, ...branchFields } = branchData;
    
    // Create branch
    const branch = await prisma.branch.create({
      data: {
        ...branchFields,
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ Created branch: ${branch.name}`);

    // Create stages for this branch
    if (stages && stages.length > 0) {
      for (const stageData of stages) {
        const stage = await prisma.stage.create({
          data: {
            branchId: branch.id,
            name: stageData.name,
            updatedAt: new Date()
          }
        });
        console.log(`  ├─ Stage: ${stage.name}`);
      }
    }
  }

  // Count results
  const branchCount = await prisma.branch.count();
  const stageCount = await prisma.stage.count();

  console.log('\n✨ Seeding completed!');
  console.log(`📊 Total: ${branchCount} branches, ${stageCount} stages`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
