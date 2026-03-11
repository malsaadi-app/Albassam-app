const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPendingRequest() {
  try {
    const requestId = 'cmmjnqjy60005dt3mfkhsgvho';
    
    // 1. Get the request
    const request = await prisma.hRRequest.findUnique({
      where: { id: requestId }
    });
    
    if (!request) {
      console.log('❌ Request not found!');
      return;
    }
    
    console.log('✅ Request found:');
    console.log(`   ID: ${request.id}`);
    console.log(`   Type: ${request.type}`);
    console.log(`   Status: ${request.status}`);
    console.log('');
    
    // 2. Find active workflow for LEAVE requests
    const workflow = await prisma.workflow.findFirst({
      where: {
        type: 'HR',
        isActive: true
      },
      include: {
        steps: {
          include: {
            approverUser: {
              select: {
                id: true,
                displayName: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (!workflow) {
      console.log('❌ No active workflow found for HR requests!');
      console.log('   Please create and publish a workflow first.');
      return;
    }
    
    console.log('✅ Workflow found:');
    console.log(`   ID: ${workflow.id}`);
    console.log(`   Name: ${workflow.name}`);
    console.log(`   Steps: ${workflow.steps.length}`);
    console.log('');
    
    // 3. Get first step
    const firstStep = workflow.steps[0];
    
    if (!firstStep) {
      console.log('❌ Workflow has no steps!');
      return;
    }
    
    console.log('✅ First step:');
    console.log(`   Name: ${firstStep.name}`);
    console.log(`   Type: ${firstStep.approverType}`);
    
    // 4. Determine approver
    let approverId = null;
    
    if (firstStep.approverType === 'SPECIFIC_USER' && firstStep.approverUserId) {
      approverId = firstStep.approverUserId;
      console.log(`   Approver: ${firstStep.approverUser?.displayName || 'USER'} (ID: ${approverId})`);
    } else if (firstStep.approverType === 'SYSTEM_ROLE' && firstStep.approverSystemRole) {
      const userWithRole = await prisma.user.findFirst({
        where: {
          role: firstStep.approverSystemRole
        }
      });
      approverId = userWithRole?.id;
      console.log(`   Approver (by system role ${firstStep.approverSystemRole}): ${userWithRole?.displayName || 'NOT FOUND'}`);
    } else {
      console.log(`   Approver type: ${firstStep.approverType} (not yet implemented in this script)`);
    }
    
    if (!approverId) {
      console.log('❌ Could not determine approver!');
      return;
    }
    
    console.log('');
    
    // 5. Check if approval log already exists
    const existing = await prisma.workflowApprovalLog.findFirst({
      where: {
        requestType: 'HR_REQUEST',
        requestId: requestId
      }
    });
    
    if (existing) {
      console.log('⚠️  WorkflowApprovalLog already exists!');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Status: ${existing.status}`);
      console.log(`   Approver: ${existing.approverId}`);
      return;
    }
    
    // 6. Create approval log
    const approval = await prisma.workflowApprovalLog.create({
      data: {
        workflowStepId: firstStep.id,
        requestType: 'HR_REQUEST',
        requestId: requestId,
        approverId: approverId,
        status: 'PENDING',
        metadata: JSON.stringify({
          workflowId: workflow.id,
          workflowName: workflow.name,
          stepName: firstStep.name,
          stepOrder: firstStep.order,
          totalSteps: workflow.steps.length
        })
      }
    });
    
    console.log('✅ WorkflowApprovalLog created!');
    console.log(`   ID: ${approval.id}`);
    console.log(`   Workflow Step: ${firstStep.name}`);
    console.log(`   Approver ID: ${approverId}`);
    console.log(`   Status: ${approval.status}`);
    console.log('');
    console.log('🎉 SUCCESS! Request is now in workflow!');
    console.log('   Should appear in pending approvals for the approver.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPendingRequest();
