const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRequests() {
  try {
    // Check HR Requests - count by status
    const hrPending = await prisma.hRRequest.count({
      where: {
        status: {
          in: ['PENDING_REVIEW', 'PENDING_APPROVAL']
        }
      }
    });
    
    console.log(`📋 HR Requests (PENDING_REVIEW/PENDING_APPROVAL): ${hrPending}`);
    
    if (hrPending > 0) {
      const samples = await prisma.hRRequest.findMany({
        where: {
          status: {
            in: ['PENDING_REVIEW', 'PENDING_APPROVAL']
          }
        },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: { fullNameAr: true }
          }
        }
      });
      
      samples.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.employee.fullNameAr} - ${r.type} (${r.status})`);
      });
    }
    console.log('');
    
    // Check Workflows
    const activeWorkflows = await prisma.workflow.count({
      where: { isActive: true }
    });
    
    console.log(`⚙️  Active Workflows: ${activeWorkflows}`);
    
    if (activeWorkflows > 0) {
      const workflows = await prisma.workflow.findMany({
        where: { isActive: true },
        select: { name: true, type: true },
        take: 5
      });
      
      workflows.forEach((w, i) => {
        console.log(`  ${i + 1}. ${w.name} (${w.type})`);
      });
    }
    console.log('');
    
    // Key finding: Check WorkflowStep count
    const workflowSteps = await prisma.workflowStep.count();
    console.log(`📊 Total Workflow Steps: ${workflowSteps}`);
    
    // Check WorkflowApprovalLog
    const approvalLogs = await prisma.workflowApprovalLog.count();
    console.log(`📊 Total Approval Logs: ${approvalLogs}`);
    console.log('');
    
    console.log('🔍 **Diagnosis:**');
    if (hrPending > 0 && approvalLogs === 0) {
      console.log('   ❌ Problem: Requests exist but NO approval logs!');
      console.log('   💡 Solution: Workflow approval logs not being created when requests submitted.');
    } else if (hrPending === 0) {
      console.log('   ✅ No pending HR requests in system.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRequests();
