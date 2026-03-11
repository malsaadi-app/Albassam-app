const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLeaveRequest() {
  try {
    const requestId = 'cmmjnqjy60005dt3mfkhsgvho';
    
    console.log('🔍 Step 1: Get the request...');
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
    
    console.log('🔍 Step 2: Find workflow...');
    // Get ALL workflows and filter manually
    const allWorkflows = await prisma.workflow.findMany({
      where: { isActive: true },
      include: {
        steps: {
          include: {
            approverUser: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    
    console.log(`   Found ${allWorkflows.length} active workflows`);
    
    if (allWorkflows.length === 0) {
      console.log('❌ No active workflows found!');
      return;
    }
    
    // List all workflows
    allWorkflows.forEach((w, i) => {
      console.log(`   ${i + 1}. ${w.name} (Type: ${w.type}, Steps: ${w.steps.length})`);
    });
    console.log('');
    
    // Use the first one (since user confirmed it exists)
    const workflow = allWorkflows[0];
    
    console.log('✅ Using workflow:');
    console.log(`   ID: ${workflow.id}`);
    console.log(`   Name: ${workflow.name}`);
    console.log(`   Steps: ${workflow.steps.length}`);
    console.log('');
    
    if (workflow.steps.length === 0) {
      console.log('❌ Workflow has no steps!');
      return;
    }
    
    const firstStep = workflow.steps[0];
    
    console.log('🔍 Step 3: Determine approver...');
    console.log(`   First step: ${firstStep.name}`);
    console.log(`   Approver type: ${firstStep.approverType}`);
    
    let approverId = null;
    
    if (firstStep.approverType === 'SPECIFIC_USER' && firstStep.approverUserId) {
      approverId = firstStep.approverUserId;
      console.log(`   ✅ Approver: ${firstStep.approverUser?.displayName || firstStep.approverUser?.username || 'USER'}`);
      console.log(`   Approver ID: ${approverId}`);
    } else if (firstStep.approverType === 'SYSTEM_ROLE' && firstStep.approverSystemRole) {
      const userWithRole = await prisma.user.findFirst({
        where: {
          role: firstStep.approverSystemRole
        },
        select: {
          id: true,
          username: true,
          displayName: true
        }
      });
      approverId = userWithRole?.id;
      console.log(`   System role: ${firstStep.approverSystemRole}`);
      console.log(`   ✅ Found user: ${userWithRole?.displayName || userWithRole?.username || 'N/A'}`);
      console.log(`   Approver ID: ${approverId}`);
    } else {
      console.log(`   ⚠️  Approver type ${firstStep.approverType} - need to implement!`);
    }
    
    if (!approverId) {
      console.log('❌ Could not determine approver!');
      return;
    }
    
    console.log('');
    
    console.log('🔍 Step 4: Check existing approval log...');
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
      console.log('');
      console.log('✅ Request already in workflow! Check your approvals page.');
      return;
    }
    
    console.log('   No existing log found.');
    console.log('');
    
    console.log('🔍 Step 5: Create approval log...');
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
    
    console.log('✅ WorkflowApprovalLog created successfully!');
    console.log(`   ID: ${approval.id}`);
    console.log(`   Workflow: ${workflow.name}`);
    console.log(`   Step: ${firstStep.name}`);
    console.log(`   Approver ID: ${approverId}`);
    console.log(`   Status: ${approval.status}`);
    console.log('');
    console.log('🎉 SUCCESS!');
    console.log('   Request is now in the workflow.');
    console.log('   It should appear in the pending approvals for the approver.');
    console.log('   Refresh your dashboard to see the updated count!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixLeaveRequest();
