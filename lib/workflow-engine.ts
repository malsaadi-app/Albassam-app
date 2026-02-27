/**
 * Simplified Workflow Engine
 * For basic approval flows
 */

import { prisma } from '@/lib/db';
import type { WorkflowLevel, WorkflowApprovalStatus } from '@prisma/client';

// ==================== TYPES ====================

export interface WorkflowContext {
  requestId: string;
  requestType: 'HR_REQUEST' | 'PURCHASE_REQUEST';
  employeeId?: string;
  stageId?: string;
  departmentId?: string;
  amount?: number;
  metadata?: Record<string, any>;
}

// ==================== WORKFLOW EXECUTION ====================

/**
 * Start a workflow for a request
 */
export async function startWorkflow(
  workflowId: string,
  context: WorkflowContext
): Promise<void> {
  const { requestId, requestType } = context;

  // Get workflow steps
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      steps: {
        orderBy: { order: 'asc' },
        include: {
          workflowRole: true
        }
      }
    }
  });

  if (!workflow || !workflow.steps.length) {
    return;
  }

  // Create approval logs for first step only (simplified)
  const firstStep = workflow.steps[0];
  
  // Try to find any admin/HR user as approver
  const approver = await prisma.user.findFirst({
    where: {
      OR: [
        { role: 'ADMIN' },
        { role: 'HR_EMPLOYEE' }
      ]
    }
  });

  if (!approver) {
    return;
  }

  // Create approval log
  await prisma.workflowApprovalLog.create({
    data: {
      workflowStepId: firstStep.id,
      requestType,
      requestId,
      approverId: approver.id,
      status: 'PENDING',
      metadata: context.metadata ? JSON.stringify(context.metadata) : null
    }
  });
}

/**
 * Approve a workflow step
 */
export async function approveStep(
  logId: string,
  approverId: string,
  comments?: string
): Promise<void> {
  await prisma.workflowApprovalLog.update({
    where: { id: logId },
    data: {
      status: 'APPROVED',
      comments,
      reviewedAt: new Date()
    }
  });
}

/**
 * Reject a workflow step
 */
export async function rejectStep(
  logId: string,
  approverId: string,
  comments: string
): Promise<void> {
  await prisma.workflowApprovalLog.update({
    where: { id: logId },
    data: {
      status: 'REJECTED',
      comments,
      reviewedAt: new Date()
    }
  });
}

/**
 * Get workflow status for a request
 */
export async function getWorkflowStatus(
  requestType: 'HR_REQUEST' | 'PURCHASE_REQUEST',
  requestId: string
) {
  const logs = await prisma.workflowApprovalLog.findMany({
    where: {
      requestType,
      requestId
    },
    include: {
      step: {
        include: {
          workflowRole: true
        }
      },
      approver: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return {
    logs,
    isComplete: logs.every(log => log.status !== 'PENDING'),
    hasRejection: logs.some(log => log.status === 'REJECTED')
  };
}
