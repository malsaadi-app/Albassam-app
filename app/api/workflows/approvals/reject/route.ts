import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { WorkflowApprovalStatus } from '@prisma/client';

/**
 * POST /api/workflows/approvals/reject
 * Reject the request at current step
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { approvalId, approverId, comments } = body;

    if (!approvalId || !approverId) {
      return NextResponse.json(
        { error: 'Missing approvalId or approverId' },
        { status: 400 }
      );
    }

    if (!comments || comments.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get current approval
    const approval = await prisma.workflowApprovalLog.findUnique({
      where: { id: approvalId },
      include: {
        step: {
          include: {
            workflow: true
          }
        },
        approver: true
      }
    });

    if (!approval) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      );
    }

    if (approval.approverId !== approverId) {
      return NextResponse.json(
        { error: 'You are not authorized to reject this request' },
        { status: 403 }
      );
    }

    if (approval.status !== WorkflowApprovalStatus.PENDING) {
      return NextResponse.json(
        { error: 'This approval has already been processed' },
        { status: 400 }
      );
    }

    if (!approval.step.allowReject) {
      return NextResponse.json(
        { error: 'Rejection is not allowed at this step' },
        { status: 400 }
      );
    }

    // Update approval to rejected
    await prisma.workflowApprovalLog.update({
      where: { id: approvalId },
      data: {
        status: WorkflowApprovalStatus.REJECTED,
        comments,
        reviewedAt: new Date()
      }
    });

    // TODO: Update the original request status to REJECTED
    // TODO: Send rejection notification to requester

    if (approval.step.notifyOnReject) {
      // await sendNotification(requesterId, ...)
    }

    return NextResponse.json({
      message: 'Request rejected successfully',
      rejected: true,
      rejectedBy: approval.approver.displayName,
      rejectionReason: comments,
      stepName: approval.step.name
    });

  } catch (error: any) {
    console.error('Error rejecting request:', error);
    return NextResponse.json(
      { error: 'Failed to reject request', details: error?.message },
      { status: 500 }
    );
  }
}
