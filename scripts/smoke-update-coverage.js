const { PrismaClient } = require('@prisma/client');
(async ()=>{
  const prisma = new PrismaClient();
  try {
    const asg = await prisma.orgUnitAssignment.findFirst();
    if(!asg){
      console.log('No orgUnitAssignment found to test.');
      process.exit(0);
    }
    console.log('Testing assignment id:', asg.id);
    const updated = await prisma.orgUnitAssignment.update({ where: { id: asg.id }, data: { coverageScope: 'ALL', coverageBranchIds: null }});
    console.log('Updated coverageScope ->', updated.coverageScope);
    // revert
    await prisma.orgUnitAssignment.update({ where: { id: asg.id }, data: { coverageScope: asg.coverageScope || 'BRANCH', coverageBranchIds: asg.coverageBranchIds }});
    console.log('Reverted changes.');
    await prisma.$disconnect();
  } catch (err){
    console.error('Smoke test error', err);
    process.exit(1);
  }
})();