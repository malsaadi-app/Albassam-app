/**
 * Workflow Runtime System
 * Handles runtime approval creation and management for new workflow system
 */

import { prisma } from './db';
import type { WorkflowRuntimeStatus, WorkflowRuntimeLevel } from '@prisma/client';

/**
 * Step configuration interface
 */
interface StepConfig {
  userId?: string; // SPECIFIC_USER
  roleId?: string; // ROLE
  departmentId?: string; // DEPARTMENT_HEAD
  resolver?: string; // Dynamic resolvers (ORG_STRUCTURE_STAGE_HEAD, etc.)
  autoEscalateDays?: number; // Auto-escalation after X days
  notifyOnEntry?: boolean;
  notifyOnApproval?: boolean;
  notifyOnReject?: boolean;
  level?: 'STAGE' | 'DEPARTMENT' | 'COMPANY';
}

/**
 * Resolve approver from step configuration
 */
export async function resolveApprover(
  stepConfig: StepConfig,
  stepType: string,
  requestContext?: {
    employeeId?: string;
    branchId?: string;
    departmentId?: string;
  }
): Promise<string | null> {
  
  // 1. SPECIFIC_USER - Direct user assignment
  if (stepConfig.userId) {
    return stepConfig.userId;
  }
  
  // 2. SYSTEM_ROLE - Find user with specific role
  if (stepConfig.roleId) {
    const user = await prisma.user.findFirst({
      where: { 
        roleId: stepConfig.roleId
      },
      select: { id: true }
    });
    return user?.id || null;
  }
  
  // 3. DEPARTMENT_HEAD - Find department head
  if (stepConfig.departmentId || requestContext?.departmentId) {
    const deptId = stepConfig.departmentId || requestContext?.departmentId;
    // TODO: Implement department head lookup from org structure
    // For now, fallback to first admin user
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { role: 'ADMIN' },
          { roleId: { not: null } }
        ]
      },
      select: { id: true }
    });
    return user?.id || null;
  }
  
  // 4. Dynamic Resolvers
  if (stepConfig.resolver) {
    switch (stepConfig.resolver) {
      case 'ORG_STRUCTURE_STAGE_HEAD':
        // Find stage head from org structure
        // TODO: Implement full org structure lookup
        // For now, use fallback admin user
        const user = await prisma.user.findFirst({
          where: { 
            OR: [
              { role: 'ADMIN' },
              { roleId: { not: null } }
            ]
          },
          select: { id: true }
        });
        return user?.id || null;
        
      case 'ORG_STRUCTURE_DEPARTMENT_HEAD':
        // Similar to STAGE_HEAD but for department
        // TODO: Implement
        const deptUser = await prisma.user.findFirst({
          where: { 
            OR: [
              { role: 'ADMIN' },
              { roleId: { not: null } }
            ]
          },
          select: { id: true }
        });
        return deptUser?.id || null;
        
      default:
        console.warn(`Unknown resolver: ${stepConfig.resolver}`);
        return null;
    }
  }
  
  // 5. Fallback based on stepType
  if (stepType === 'STAGE_HEAD' || stepType === 'DEPARTMENT_HEAD') {
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { role: 'ADMIN' },
          { roleId: { not: null } }
        ]
      },
      select: { id: true }
    });
    return user?.id || null;
  }
  
  return null;
}

/**
 * Create runtime approval for a request
 */
export async function createRuntimeApproval(params: {
  versionId: string;
  stepDefinitionId: string;
  requestType: string; // HR_REQUEST, PURCHASE_REQUEST, etc.
  requestId: string;
  approverId: string;
  level?: WorkflowRuntimeLevel;
  metadata?: any;
  notifyOnEntry?: boolean;
  notifyOnApproval?: boolean;
  notifyOnReject?: boolean;
}) {
  
  return await prisma.workflowRuntimeApproval.create({
    data: {
      versionId: params.versionId,
      stepDefinitionId: params.stepDefinitionId,
      requestType: params.requestType,
      requestId: params.requestId,
      approverId: params.approverId,
      status: 'PENDING',
      level: params.level || null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      notifyOnEntry: params.notifyOnEntry ?? true,
      notifyOnApproval: params.notifyOnApproval ?? true,
      notifyOnReject: params.notifyOnReject ?? true,
    }
  });
}

/**
 * Initiate workflow for a request
 * Finds published workflow and creates approval for first step
 */
export async function initiateWorkflow(params: {
  module: string; // HR, PROCUREMENT, MAINTENANCE, ATTENDANCE
  requestType: string; // HR_REQUEST, PURCHASE_REQUEST, etc.
  requestId: string;
  requestContext?: {
    employeeId?: string;
    branchId?: string;
    departmentId?: string;
    amount?: number;
  };
}) {
  
  // 1. Find published workflow version for module
  const workflow = await prisma.workflowVersion.findFirst({
    where: {
      workflow: { module: params.module },
      status: 'PUBLISHED'
    },
    include: {
      workflow: true,
      steps: {
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { version: 'desc' }
  });
  
  if (!workflow) {
    throw new Error(`No published workflow found for module: ${params.module}`);
  }
  
  if (workflow.steps.length === 0) {
    throw new Error(`Workflow has no steps: ${workflow.workflow.name}`);
  }
  
  // 2. Get first step
  const firstStep = workflow.steps[0];
  
  // 3. Parse step config
  let stepConfig: StepConfig = {};
  try {
    stepConfig = typeof firstStep.configJson === 'string'
      ? JSON.parse(firstStep.configJson)
      : firstStep.configJson;
  } catch (error) {
    console.error('Error parsing step config:', error);
  }
  
  // 4. Resolve approver
  const approverId = await resolveApprover(
    stepConfig,
    firstStep.stepType,
    params.requestContext
  );
  
  if (!approverId) {
    throw new Error(`Could not resolve approver for step: ${firstStep.titleAr}`);
  }
  
  // 5. Create runtime approval
  const approval = await createRuntimeApproval({
    versionId: workflow.id,
    stepDefinitionId: firstStep.id,
    requestType: params.requestType,
    requestId: params.requestId,
    approverId: approverId,
    level: stepConfig.level as WorkflowRuntimeLevel,
    metadata: {
      workflowId: workflow.workflow.id,
      workflowName: workflow.workflow.name,
      workflowVersion: workflow.version,
      stepName: firstStep.titleAr,
      stepOrder: firstStep.order,
      totalSteps: workflow.steps.length,
      autoEscalateDays: stepConfig.autoEscalateDays,
    },
    notifyOnEntry: stepConfig.notifyOnEntry,
    notifyOnApproval: stepConfig.notifyOnApproval,
    notifyOnReject: stepConfig.notifyOnReject,
  });
  
  return {
    approval,
    workflow,
    step: firstStep
  };
}

/**
 * Approve a step and move to next
 */
export async function approveStep(params: {
  approvalId: string;
  approverId: string;
  comments?: string;
}) {
  
  // 1. Get current approval
  const approval = await prisma.workflowRuntimeApproval.findUnique({
    where: { id: params.approvalId },
    include: {
      version: {
        include: {
          steps: {
            orderBy: { order: 'asc' }
          }
        }
      },
      stepDefinition: true
    }
  });
  
  if (!approval) {
    throw new Error('Approval not found');
  }
  
  if (approval.approverId !== params.approverId) {
    throw new Error('Not authorized to approve this step');
  }
  
  if (approval.status !== 'PENDING') {
    throw new Error('Approval already processed');
  }
  
  // 2. Update current approval
  await prisma.workflowRuntimeApproval.update({
    where: { id: params.approvalId },
    data: {
      status: 'APPROVED',
      comments: params.comments,
      reviewedAt: new Date()
    }
  });
  
  // 3. Find next step
  const currentOrder = approval.stepDefinition.order;
  const nextStep = approval.version.steps.find(s => s.order === currentOrder + 1);
  
  // 4. If there's a next step, create approval for it
  if (nextStep) {
    // Parse config
    let stepConfig: StepConfig = {};
    try {
      stepConfig = typeof nextStep.configJson === 'string'
        ? JSON.parse(nextStep.configJson)
        : nextStep.configJson;
    } catch (error) {
      console.error('Error parsing next step config:', error);
    }
    
    // Resolve approver
    const nextApproverId = await resolveApprover(
      stepConfig,
      nextStep.stepType
    );
    
    if (!nextApproverId) {
      throw new Error(`Could not resolve approver for next step: ${nextStep.titleAr}`);
    }
    
    // Create next approval
    const nextApproval = await createRuntimeApproval({
      versionId: approval.versionId,
      stepDefinitionId: nextStep.id,
      requestType: approval.requestType,
      requestId: approval.requestId,
      approverId: nextApproverId,
      level: stepConfig.level as WorkflowRuntimeLevel,
      metadata: {
        previousApprovalId: params.approvalId,
        stepName: nextStep.titleAr,
        stepOrder: nextStep.order,
        totalSteps: approval.version.steps.length,
        autoEscalateDays: stepConfig.autoEscalateDays,
      },
      notifyOnEntry: stepConfig.notifyOnEntry,
      notifyOnApproval: stepConfig.notifyOnApproval,
      notifyOnReject: stepConfig.notifyOnReject,
    });
    
    return { completed: false, nextApproval };
  }
  
  // 5. Workflow complete!
  return { completed: true, nextApproval: null };
}

/**
 * Reject a step
 */
export async function rejectStep(params: {
  approvalId: string;
  approverId: string;
  comments: string;
}) {
  
  const approval = await prisma.workflowRuntimeApproval.findUnique({
    where: { id: params.approvalId }
  });
  
  if (!approval) {
    throw new Error('Approval not found');
  }
  
  if (approval.approverId !== params.approverId) {
    throw new Error('Not authorized to reject this step');
  }
  
  if (approval.status !== 'PENDING') {
    throw new Error('Approval already processed');
  }
  
  await prisma.workflowRuntimeApproval.update({
    where: { id: params.approvalId },
    data: {
      status: 'REJECTED',
      comments: params.comments,
      reviewedAt: new Date()
    }
  });
  
  return { rejected: true };
}

/**
 * Escalate stale approvals
 * Called by cron job
 */
export async function escalateStaleApprovals() {
  
  const staleApprovals = await prisma.workflowRuntimeApproval.findMany({
    where: {
      status: 'PENDING',
      escalatedAt: null
    },
    include: {
      stepDefinition: true
    }
  });
  
  const escalated = [];
  
  for (const approval of staleApprovals) {
    // Parse metadata to get autoEscalateDays
    let metadata: any = {};
    try {
      metadata = approval.metadata ? JSON.parse(approval.metadata as string) : {};
    } catch (error) {
      console.error('Error parsing metadata:', error);
      continue;
    }
    
    const autoEscalateDays = metadata.autoEscalateDays;
    if (!autoEscalateDays) continue;
    
    // Check if should escalate
    const daysSinceCreated = Math.floor(
      (Date.now() - approval.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceCreated >= autoEscalateDays) {
      // Find escalation target (admin user)
      const escalationTarget = await prisma.user.findFirst({
        where: { 
          OR: [
            { role: 'ADMIN' },
            { roleId: { not: null } }
          ]
        },
        select: { id: true }
      });
      
      if (escalationTarget) {
        await prisma.workflowRuntimeApproval.update({
          where: { id: approval.id },
          data: {
            status: 'ESCALATED',
            escalatedAt: new Date(),
            escalatedTo: escalationTarget.id
          }
        });
        
        escalated.push(approval.id);
      }
    }
  }
  
  return { escalated: escalated.length, ids: escalated };
}

/**
 * Get pending approvals for user
 */
export async function getPendingApprovals(userId: string) {
  
  return await prisma.workflowRuntimeApproval.findMany({
    where: {
      approverId: userId,
      status: 'PENDING'
    },
    include: {
      version: {
        include: {
          workflow: true
        }
      },
      stepDefinition: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
}

/**
 * Get approval counts by type for user
 */
export async function getApprovalCounts(userId: string) {
  
  const approvals = await prisma.workflowRuntimeApproval.findMany({
    where: {
      approverId: userId,
      status: 'PENDING'
    },
    select: {
      requestType: true
    }
  });
  
  const counts: Record<string, number> = {};
  
  for (const approval of approvals) {
    counts[approval.requestType] = (counts[approval.requestType] || 0) + 1;
  }
  
  return counts;
}
