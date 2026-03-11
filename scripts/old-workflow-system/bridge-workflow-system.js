const { PrismaClient } = require('@prisma/client');

// Use direct connection to avoid prepared statement cache issues
const directUrl = 'postgresql://postgres.uvizfidyfhxwekqbtkma:hazGyk-6wecqo-rokxij@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=false';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directUrl
    }
  }
});

/**
 * Bridge Workflow System
 * Reads published workflows from new system (WorkflowDefinition)
 * Creates corresponding entries in old system (Workflow)
 * Creates approval log for pending request
 */

async function bridgeWorkflowSystem() {
  try {
    console.log('🌉 Bridge Workflow System - Start\n');
    
    // ============================================
    // STEP 1: Get published workflow from new system
    // ============================================
    console.log('📋 Step 1: Finding published workflow in new system...');
    
    const publishedVersion = await prisma.workflowVersion.findFirst({
      where: {
        status: 'PUBLISHED'
      },
      include: {
        workflow: true,
        steps: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });
    
    if (!publishedVersion) {
      console.log('❌ No published workflow found in new system!');
      console.log('   Please publish a workflow first at /settings/workflow-builder');
      return;
    }
    
    console.log('✅ Found published workflow:');
    console.log(`   Name: ${publishedVersion.workflow.name}`);
    console.log(`   Module: ${publishedVersion.workflow.module}`);
    console.log(`   Version: ${publishedVersion.version}`);
    console.log(`   Steps: ${publishedVersion.steps.length}`);
    console.log('');
    
    // ============================================
    // STEP 2: Check if already bridged to old system
    // ============================================
    console.log('🔍 Step 2: Checking old system...');
    
    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        name: publishedVersion.workflow.name
      },
      include: {
        steps: true
      }
    });
    
    if (existingWorkflow) {
      console.log('✅ Workflow already exists in old system:');
      console.log(`   ID: ${existingWorkflow.id}`);
      console.log(`   Name: ${existingWorkflow.name}`);
      console.log(`   Active: ${existingWorkflow.isActive}`);
      console.log(`   Steps: ${existingWorkflow.steps.length}`);
      console.log('');
      
      // Use existing workflow
      var workflowId = existingWorkflow.id;
      var firstStep = existingWorkflow.steps.find(s => s.order === 1);
      
    } else {
      console.log('⚠️  Workflow not found in old system. Creating bridge...');
      console.log('');
      
      // ============================================
      // STEP 3: Create workflow in old system
      // ============================================
      console.log('🔨 Step 3: Creating workflow in old system...');
      
      const newWorkflow = await prisma.workflow.create({
        data: {
          name: publishedVersion.workflow.name,
          description: publishedVersion.workflow.description || 'Auto-created from workflow builder',
          type: publishedVersion.workflow.module, // HR, PROCUREMENT, etc.
          forSpecificType: null, // Will be determined by request type
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Workflow created:');
      console.log(`   ID: ${newWorkflow.id}`);
      console.log(`   Name: ${newWorkflow.name}`);
      console.log('');
      
      // ============================================
      // STEP 4: Create workflow steps in old system
      // ============================================
      console.log('🔨 Step 4: Creating workflow steps...');
      
      const createdSteps = [];
      
      for (const step of publishedVersion.steps) {
        const stepName = step.titleAr || step.titleEn || `Step ${step.order}`;
        console.log(`   Creating step ${step.order}: ${stepName}`);
        
        // Parse config to get assignment info
        let config = {};
        try {
          config = typeof step.configJson === 'string' 
            ? JSON.parse(step.configJson) 
            : step.configJson;
          console.log(`   Config:`, JSON.stringify(config));
          console.log(`   StepType:`, step.stepType);
        } catch (e) {
          console.log(`   ⚠️  Could not parse configJson: ${e.message}`);
        }
        
        // Map stepType and config to approverType
        let approverType = 'SPECIFIC_USER';
        let approverUserId = null;
        let approverSystemRole = null;
        
        // Check config for assignment details
        if (config.userId) {
          // NEW SYSTEM FORMAT: userId in config
          approverType = 'SPECIFIC_USER';
          approverUserId = config.userId;
        } else if (config.assigneeUserId) {
          approverType = 'SPECIFIC_USER';
          approverUserId = config.assigneeUserId;
        } else if (config.roleId || config.assigneeRoleId || config.assigneeRole) {
          approverType = 'SYSTEM_ROLE';
          approverSystemRole = config.roleId || config.assigneeRole || 'SUPER_ADMIN';
        } else if (config.departmentId || config.assigneeDepartmentId) {
          approverType = 'DEPARTMENT_HEAD';
        } else if (step.stepType === 'STAGE_HEAD' || step.stepType === 'DEPARTMENT_HEAD') {
          // Dynamic resolvers - for bridge, use system role
          approverType = 'SYSTEM_ROLE';
          approverSystemRole = 'SUPER_ADMIN';
        } else if (config.resolver === 'ORG_STRUCTURE_STAGE_HEAD') {
          // Organizational resolver - map to SUPER_ADMIN for bridge
          approverType = 'SYSTEM_ROLE';
          approverSystemRole = 'SUPER_ADMIN';
        } else if (step.stepType === 'USER' || step.stepType === 'user') {
          approverType = 'SPECIFIC_USER';
          // Will need to find a default user - fallback to SUPER_ADMIN
          const defaultUser = await prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN' }
          });
          if (defaultUser) {
            approverUserId = defaultUser.id;
          }
        } else if (step.stepType === 'ROLE' || step.stepType === 'role') {
          approverType = 'SYSTEM_ROLE';
          approverSystemRole = 'SUPER_ADMIN';
        } else {
          // Default fallback
          approverType = 'SYSTEM_ROLE';
          approverSystemRole = 'SUPER_ADMIN';
        }
        
        // Determine level based on approver type
        let level = 'COMPANY'; // Default to company level
        if (approverType === 'DEPARTMENT_HEAD') {
          level = 'DEPARTMENT';
        } else if (approverType === 'STAGE_MANAGER' || approverType === 'STAGE') {
          level = 'STAGE';
        }
        
        const createdStep = await prisma.workflowStep.create({
          data: {
            workflowId: newWorkflow.id,
            name: stepName,
            order: step.order,
            level: level,
            approverType: approverType,
            approverUserId: approverUserId,
            approverSystemRole: approverSystemRole
          }
        });
        
        createdSteps.push(createdStep);
        console.log(`   ✅ Step created (ID: ${createdStep.id})`);
        console.log(`       Type: ${approverType}, UserId: ${approverUserId}, SystemRole: ${approverSystemRole}`);
      }
      
      console.log(`✅ Created ${createdSteps.length} steps`);
      console.log('');
      
      var workflowId = newWorkflow.id;
      var firstStep = createdSteps[0];
    }
    
    if (!firstStep) {
      console.log('❌ No first step found!');
      return;
    }
    
    // ============================================
    // STEP 5: Determine approver for first step
    // ============================================
    console.log('🔍 Step 5: Determining approver...');
    console.log(`   Step: ${firstStep.name}`);
    console.log(`   Approver Type: ${firstStep.approverType}`);
    
    let approverId = null;
    
    if (firstStep.approverType === 'SPECIFIC_USER' && firstStep.approverUserId) {
      approverId = firstStep.approverUserId;
      const user = await prisma.user.findUnique({
        where: { id: approverId },
        select: { username: true, displayName: true }
      });
      console.log(`   ✅ Approver: ${user?.displayName || user?.username || 'USER'} (${approverId})`);
      
    } else if (firstStep.approverType === 'SYSTEM_ROLE' && firstStep.approverSystemRole) {
      const user = await prisma.user.findFirst({
        where: { role: firstStep.approverSystemRole },
        select: { id: true, username: true, displayName: true }
      });
      approverId = user?.id;
      console.log(`   ✅ Approver (${firstStep.approverSystemRole}): ${user?.displayName || user?.username || 'NOT FOUND'}`);
      
    } else {
      console.log(`   ⚠️  Approver type ${firstStep.approverType} not yet handled`);
    }
    
    if (!approverId) {
      console.log('❌ Could not determine approver!');
      return;
    }
    
    console.log('');
    
    // ============================================
    // STEP 6: Create approval log for pending request
    // ============================================
    console.log('🔨 Step 6: Creating approval log for pending request...');
    
    const requestId = 'cmmjnqjy60005dt3mfkhsgvho';
    
    // Check if already exists
    const existingLog = await prisma.workflowApprovalLog.findFirst({
      where: {
        requestType: 'HR_REQUEST',
        requestId: requestId
      }
    });
    
    if (existingLog) {
      console.log('⚠️  Approval log already exists:');
      console.log(`   ID: ${existingLog.id}`);
      console.log(`   Status: ${existingLog.status}`);
      console.log(`   Approver: ${existingLog.approverId}`);
      console.log('');
      console.log('✅ Request already in workflow!');
      return;
    }
    
    // Create approval log
    const approvalLog = await prisma.workflowApprovalLog.create({
      data: {
        workflowStepId: firstStep.id,
        requestType: 'HR_REQUEST',
        requestId: requestId,
        approverId: approverId,
        status: 'PENDING',
        metadata: JSON.stringify({
          workflowId: workflowId,
          workflowName: publishedVersion.workflow.name,
          stepName: firstStep.name,
          stepOrder: firstStep.order,
          totalSteps: publishedVersion.steps.length,
          versionId: publishedVersion.id,
          bridgedAt: new Date().toISOString()
        }),
        createdAt: new Date()
      }
    });
    
    console.log('✅ Approval log created:');
    console.log(`   ID: ${approvalLog.id}`);
    console.log(`   Request: ${requestId}`);
    console.log(`   Approver: ${approverId}`);
    console.log(`   Status: ${approvalLog.status}`);
    console.log('');
    
    console.log('🎉 SUCCESS!');
    console.log('   ✅ Workflow bridged from new system to old system');
    console.log('   ✅ Approval log created for pending request');
    console.log('   ✅ Request should now appear in approver\'s pending list');
    console.log('   ✅ Pending count should update');
    console.log('');
    console.log('📊 Next: Refresh dashboard to see the changes!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    console.error('\n💡 Stack trace:');
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

bridgeWorkflowSystem();
