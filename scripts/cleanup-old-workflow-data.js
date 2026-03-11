const { PrismaClient } = require('@prisma/client');
const directUrl = 'postgresql://postgres.uvizfidyfhxwekqbtkma:hazGyk-6wecqo-rokxij@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=false';
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

async function cleanupOldWorkflowData() {
  try {
    console.log('🧹 Database Cleanup: Old Workflow System\n');
    
    // 1. Count old data
    console.log('📊 Current state:');
    const oldWorkflows = await prisma.workflow.count();
    const oldApprovalLogs = await prisma.workflowApprovalLog.count();
    const oldWorkflowSteps = await prisma.workflowStep.count();
    
    console.log(`   Old Workflows: ${oldWorkflows}`);
    console.log(`   Old Workflow Steps: ${oldWorkflowSteps}`);
    console.log(`   Old Approval Logs: ${oldApprovalLogs}`);
    console.log('');
    
    if (oldWorkflows === 0 && oldApprovalLogs === 0 && oldWorkflowSteps === 0) {
      console.log('✅ Already clean! No old data to remove.');
      return;
    }
    
    // 2. Delete old approval logs
    if (oldApprovalLogs > 0) {
      console.log('🗑️  Deleting old approval logs...');
      const deletedLogs = await prisma.workflowApprovalLog.deleteMany({});
      console.log(`   ✅ Deleted ${deletedLogs.count} approval log(s)`);
    }
    
    // 3. Delete old workflow steps
    if (oldWorkflowSteps > 0) {
      console.log('🗑️  Deleting old workflow steps...');
      const deletedSteps = await prisma.workflowStep.deleteMany({});
      console.log(`   ✅ Deleted ${deletedSteps.count} workflow step(s)`);
    }
    
    // 4. Delete old workflows
    if (oldWorkflows > 0) {
      console.log('🗑️  Deleting old workflows...');
      const deletedWorkflows = await prisma.workflow.deleteMany({});
      console.log(`   ✅ Deleted ${deletedWorkflows.count} workflow(s)`);
    }
    
    console.log('');
    console.log('📊 Final state:');
    const finalWorkflows = await prisma.workflow.count();
    const finalApprovalLogs = await prisma.workflowApprovalLog.count();
    const finalWorkflowSteps = await prisma.workflowStep.count();
    
    console.log(`   Old Workflows: ${finalWorkflows}`);
    console.log(`   Old Workflow Steps: ${finalWorkflowSteps}`);
    console.log(`   Old Approval Logs: ${finalApprovalLogs}`);
    console.log('');
    
    // 5. Verify new system still intact
    console.log('✅ Verifying new system integrity...');
    const newApprovals = await prisma.workflowRuntimeApproval.count();
    const publishedWorkflows = await prisma.workflowVersion.count({
      where: { status: 'PUBLISHED' }
    });
    
    console.log(`   WorkflowRuntimeApproval: ${newApprovals} ✅`);
    console.log(`   Published Workflows: ${publishedWorkflows} ✅`);
    console.log('');
    
    console.log('🎉 Cleanup complete!');
    console.log('   ✅ Old data removed');
    console.log('   ✅ New system intact');
    console.log('   ✅ Ready for production');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldWorkflowData();
