/**
 * Workflow Authorization (Simplified)
 */

import { prisma } from '@/lib/db';

/**
 * Check if user can approve a workflow step
 */
export async function canApprove(
  userId: string,
  logId: string
): Promise<boolean> {
  const log = await prisma.workflowApprovalLog.findUnique({
    where: { id: logId }
  });

  if (!log) return false;
  if (log.status !== 'PENDING') return false;

  // Check if user is the assigned approver
  if (log.approverId === userId) return true;

  // Check if user is ADMIN
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  return user?.role === 'ADMIN';
}

/**
 * Check if user can view a request
 */
export async function canViewRequest(
  userId: string,
  requestType: 'HR_REQUEST' | 'PURCHASE_REQUEST',
  requestId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true }
  });

  if (!user) return false;
  if (user.role === 'ADMIN') return true;

  // Check if user is the requester
  if (requestType === 'HR_REQUEST') {
    const request = await prisma.hRRequest.findUnique({
      where: { id: requestId },
      select: { employeeId: true }
    });
    if (request?.employeeId === userId) return true;
  } else if (requestType === 'PURCHASE_REQUEST') {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      select: { requestedById: true }
    });
    if (request?.requestedById === userId) return true;
  }

  // Check if user is an approver in the workflow
  const isApprover = await prisma.workflowApprovalLog.findFirst({
    where: {
      requestType,
      requestId,
      approverId: userId
    }
  });

  return !!isApprover;
}
