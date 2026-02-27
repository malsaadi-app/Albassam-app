import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { WorkflowApprovalStatus } from '@prisma/client';

/**
 * POST /api/workflows/approvals/approve
 * Approve current step and move to next
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

    // Get current approval
    const approval = await prisma.workflowApprovalLog.findUnique({
      where: { id: approvalId },
      include: {
        step: {
          include: {
            workflow: {
              include: {
                steps: {
                  orderBy: { order: 'asc' }
                }
              }
            }
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
        { error: 'You are not authorized to approve this request' },
        { status: 403 }
      );
    }

    if (approval.status !== WorkflowApprovalStatus.PENDING) {
      return NextResponse.json(
        { error: 'This approval has already been processed' },
        { status: 400 }
      );
    }

    // Update current approval
    await prisma.workflowApprovalLog.update({
      where: { id: approvalId },
      data: {
        status: WorkflowApprovalStatus.APPROVED,
        comments,
        reviewedAt: new Date()
      }
    });

    // Get next step
    const workflow = approval.step.workflow;
    const currentStepOrder = approval.step.order;
    
    // Fetch all steps for this workflow
    const allSteps = await prisma.workflowStep.findMany({
      where: { workflowId: workflow.id },
      orderBy: { order: 'asc' }
    });
    
    const nextStep = allSteps.find(s => s.order === currentStepOrder + 1);

    let result: any = {
      message: 'Request approved successfully',
      approved: true,
      completed: false
    };

    if (nextStep) {
      // There's a next step - create approval for it
      // Determine next approver (simplified logic)
      let nextApproverId = null;

      if (nextStep.approverType === 'SPECIFIC_USER') {
        nextApproverId = nextStep.approverUserId;
      } else if (nextStep.approverType === 'SYSTEM_ROLE') {
        const userWithRole = await prisma.user.findFirst({
          where: { role: nextStep.approverSystemRole as any }
        });
        nextApproverId = userWithRole?.id;
      }
      // Add more logic for ROLE and DIRECT_MANAGER

      if (nextApproverId) {
        const nextApproval = await prisma.workflowApprovalLog.create({
          data: {
            workflowStepId: nextStep.id,
            requestType: approval.requestType,
            requestId: approval.requestId,
            approverId: nextApproverId,
            status: WorkflowApprovalStatus.PENDING,
            metadata: JSON.stringify({
              workflowId: workflow.id,
              workflowName: workflow.name,
              stepName: nextStep.name,
              stepOrder: nextStep.order,
              totalSteps: workflow.steps.length,
              previousStep: approval.step.name,
              approvedBy: approval.approver.displayName
            })
          },
          include: {
            step: true,
            approver: {
              select: {
                id: true,
                displayName: true
              }
            }
          }
        });

        // TODO: Send notification
        if (nextStep.notifyOnEntry) {
          // await sendNotification(nextApproverId, ...)
        }

        result.nextStep = nextStep;
        result.nextApproval = nextApproval;
        result.message = `Request approved and moved to: ${nextStep.name}`;
      }
    } else {
      // No more steps - workflow completed!
      result.completed = true;
      result.message = 'Request fully approved - workflow completed!';

      // TODO: Update the original request status (HR request, etc)
      // TODO: Send completion notification
    }

    // Send approval notification
    if (approval.step.notifyOnApproval) {
      // TODO: Notify requester about approval
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error approving request:', error);
    return NextResponse.json(
      { error: 'Failed to approve request', details: error?.message },
      { status: 500 }
    );
  }
}
