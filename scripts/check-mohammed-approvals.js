const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApprovals() {
  try {
    // Get mohammed user
    const user = await prisma.user.findFirst({
      where: { username: 'mohammed' }
    });
    
    if (!user) {
      console.log('❌ Mohammed user not found');
      return;
    }
    
    console.log('✅ Mohammed user found:', user.id);
    console.log('   Username:', user.username);
    console.log('   Display Name:', user.displayName);
    console.log('');
    
    // Check WorkflowApprovalLog
    const approvals = await prisma.workflowApprovalLog.findMany({
      where: {
        approverId: user.id,
        status: 'PENDING'
      }
    });
    
    console.log(`📊 Pending approvals for mohammed: ${approvals.length}`);
    
    if (approvals.length > 0) {
      console.log('\n--- Approvals details ---');
      approvals.forEach((a, i) => {
        console.log(`${i + 1}. Type: ${a.requestType}, RequestID: ${a.requestId}, Status: ${a.status}`);
      });
    } else {
      console.log('   (No pending approvals found for mohammed)');
    }
    
    // Check all pending approvals (for debugging)
    const allPending = await prisma.workflowApprovalLog.count({
      where: { status: 'PENDING' }
    });
    
    console.log(`\n📊 Total pending approvals in system: ${allPending}`);
    
    if (allPending > 0) {
      const somePending = await prisma.workflowApprovalLog.findMany({
        where: { status: 'PENDING' },
        include: {
          approver: {
            select: { username: true, displayName: true }
          }
        },
        take: 5
      });
      
      console.log('\n--- Some pending approvals in system ---');
      somePending.forEach((a, i) => {
        console.log(`${i + 1}. Approver: ${a.approver.username} (${a.approver.displayName})`);
        console.log(`   Type: ${a.requestType}, RequestID: ${a.requestId}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkApprovals();
