const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkflows() {
  try {
    const workflows = await prisma.workflow.findMany({
      include: {
        steps: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    console.log(`📊 Total Workflows: ${workflows.length}\n`);
    
    workflows.forEach((w, i) => {
      console.log(`${i + 1}. ${w.name}`);
      console.log(`   ID: ${w.id}`);
      console.log(`   Type: ${w.type}`);
      console.log(`   For Specific Type: ${w.forSpecificType || 'N/A'}`);
      console.log(`   Active: ${w.isActive ? '✅ YES' : '❌ NO'}`);
      console.log(`   Steps: ${w.steps.length}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkflows();
