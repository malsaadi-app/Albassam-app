const { PrismaClient } = require('@prisma/client');
const directUrl = 'postgresql://postgres.uvizfidyfhxwekqbtkma:hazGyk-6wecqo-rokxij@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=false';
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

async function testWorkflowStatus() {
  try {
    console.log('🔍 Workflow System Status Check\n');
    
    // 1. Check published workflows
    console.log('📋 1. Published Workflows:');
    const publishedWorkflows = await prisma.workflowVersion.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        workflow: true,
        steps: true
      }
    });
    
    console.log(`   Found: ${publishedWorkflows.length} published workflow(s)`);
    publishedWorkflows.forEach(w => {
      console.log(`   - ${w.workflow.name} (v${w.version}, ${w.steps.length} steps)`);
    });
    console.log('');
    
    // 2. Check runtime approvals
    console.log('📊 2. Runtime Approvals:');
    const totalApprovals = await prisma.workflowRuntimeApproval.count();
    const pendingApprovals = await prisma.workflowRuntimeApproval.count({
      where: { status: 'PENDING' }
    });
    const approvedApprovals = await prisma.workflowRuntimeApproval.count({
      where: { status: 'APPROVED' }
    });
    const rejectedApprovals = await prisma.workflowRuntimeApproval.count({
      where: { status: 'REJECTED' }
    });
    
    console.log(`   Total: ${totalApprovals}`);
    console.log(`   Pending: ${pendingApprovals}`);
    console.log(`   Approved: ${approvedApprovals}`);
    console.log(`   Rejected: ${rejectedApprovals}`);
    console.log('');
    
    // 3. Check recent requests
    console.log('📝 3. Recent Requests (last 24h):');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentHR = await prisma.hRRequest.count({
      where: { createdAt: { gte: yesterday } }
    });
    const recentPurchase = await prisma.purchaseRequest.count({
      where: { createdAt: { gte: yesterday } }
    });
    const recentMaintenance = await prisma.maintenanceRequest.count({
      where: { createdAt: { gte: yesterday } }
    });
    const recentAttendance = await prisma.attendanceRequest.count({
      where: { createdAt: { gte: yesterday } }
    });
    
    console.log(`   HR: ${recentHR}`);
    console.log(`   Purchase: ${recentPurchase}`);
    console.log(`   Maintenance: ${recentMaintenance}`);
    console.log(`   Attendance: ${recentAttendance}`);
    console.log('');
    
    // 4. Check old system (for comparison)
    console.log('🗄️ 4. Old System (Legacy):');
    const oldWorkflows = await prisma.workflow.count();
    const oldApprovals = await prisma.workflowApprovalLog.count();
    
    console.log(`   Old Workflows: ${oldWorkflows}`);
    console.log(`   Old Approval Logs: ${oldApprovals}`);
    console.log('');
    
    // 5. Summary
    console.log('📌 Summary:');
    if (publishedWorkflows.length === 0) {
      console.log('   ⚠️  No published workflows found!');
      console.log('   → Need to publish a workflow at /settings/workflow-builder');
    } else if (totalApprovals === 0) {
      console.log('   ⚠️  No runtime approvals yet');
      console.log('   → System ready, waiting for first request');
    } else {
      console.log('   ✅ System active with approvals');
    }
    
    if (oldApprovals > 0) {
      console.log(`   ℹ️  Found ${oldApprovals} old approval logs (can be cleaned up)`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testWorkflowStatus();
