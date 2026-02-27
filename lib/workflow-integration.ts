/**
 * Workflow Integration with HR and Procurement
 * Simplified version for initial deployment
 */

import { prisma } from '@/lib/db';
import { startWorkflow, getWorkflowStatus } from './workflow-engine';

// ==================== HR REQUEST INTEGRATION ====================

/**
 * Start workflow for HR request
 */
export async function startHRWorkflow(requestId: string): Promise<void> {
  const request = await prisma.hRRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    throw new Error('HR Request not found');
  }

  // Find applicable workflow
  const workflow = await prisma.workflow.findFirst({
    where: {
      type: 'HR',
      isActive: true
    }
  });

  if (!workflow) {
    // No workflow configured - skip
    return;
  }

  // Start workflow
  await startWorkflow(workflow.id, {
    requestId: request.id,
    requestType: 'HR_REQUEST',
    employeeId: request.employeeId,
    metadata: {
      type: request.type
    }
  });
}

/**
 * Get HR workflow status
 */
export async function getHRWorkflowStatus(requestId: string) {
  return getWorkflowStatus('HR_REQUEST', requestId);
}

// ==================== PROCUREMENT INTEGRATION ====================

/**
 * Start workflow for procurement request
 */
export async function startProcurementWorkflow(requestId: string): Promise<void> {
  const request = await prisma.purchaseRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    throw new Error('Purchase Request not found');
  }

  // Find applicable workflow
  const workflow = await prisma.workflow.findFirst({
    where: {
      type: 'PROCUREMENT',
      isActive: true
    }
  });

  if (!workflow) {
    // No workflow configured - skip
    return;
  }

  // Start workflow
  await startWorkflow(workflow.id, {
    requestId: request.id,
    requestType: 'PURCHASE_REQUEST',
    amount: request.estimatedBudget || 0,
    metadata: {
      category: request.category
    }
  });
}

/**
 * Get procurement workflow status
 */
export async function getProcurementWorkflowStatus(requestId: string) {
  return getWorkflowStatus('PURCHASE_REQUEST', requestId);
}
