import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { WorkflowApprovalStatus } from '@prisma/client';

/**
 * POST /api/workflows/approvals
 * Initialize workflow approvals for a request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestType, requestId, workflowId, branchId, requesterId } = body;

    if (!requestType || !requestId || !workflowId) {
      return NextResponse.json(
        { error: 'Missing required fields: requestType, requestId, workflowId' },
        { status: 400 }
      );
    }

    // Get workflow with steps
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          include: {
            workflowRole: true,
            approverUser: {
              select: {
                id: true,
                displayName: true,
                employee: {
                  select: {
                    id: true,
                    branchId: true
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        branches: {
          include: {
            branch: true
          }
        }
      }
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    if (!workflow.isActive) {
      return NextResponse.json(
        { error: 'Workflow is not active' },
        { status: 400 }
      );
    }

    // Check if branch is allowed
    if (branchId) {
      const isBranchAllowed = workflow.branches.some(wb => wb.branchId === branchId);
      if (!isBranchAllowed) {
        return NextResponse.json(
          { error: 'This workflow is not configured for the specified branch' },
          { status: 400 }
        );
      }
    }

    // Get first step
    const firstStep = workflow.steps[0];
    if (!firstStep) {
      return NextResponse.json(
        { error: 'Workflow has no steps defined' },
        { status: 400 }
      );
    }

    // Determine approver for first step
    let approverId = null;

    if (firstStep.approverType === 'SPECIFIC_USER') {
      approverId = firstStep.approverUserId;
    } else if (firstStep.approverType === 'ROLE') {
      // Find user with this workflow role in the same branch
      // This is simplified - you may need more complex logic
      const userWithRole = await prisma.user.findFirst({
        where: {
          employee: {
            branchId: branchId || undefined
          }
          // Add role matching logic here based on your system
        }
      });
      approverId = userWithRole?.id;
    } else if (firstStep.approverType === 'DIRECT_MANAGER') {
      // Get requester's manager
      const requester = await prisma.user.findUnique({
        where: { id: requesterId },
        include: {
          employee: true
        }
      });
      // TODO: Implement manager logic based on your Employee model structure
      approverId = null; // placeholder
    } else if (firstStep.approverType === 'SYSTEM_ROLE') {
      // Find user with system role
      const userWithSystemRole = await prisma.user.findFirst({
        where: {
          role: firstStep.approverSystemRole as any
        }
      });
      approverId = userWithSystemRole?.id;
    }

    if (!approverId) {
      return NextResponse.json(
        { error: 'Could not determine approver for first step' },
        { status: 400 }
      );
    }

    // Create approval log for first step
    const approval = await prisma.workflowApprovalLog.create({
      data: {
        workflowStepId: firstStep.id,
        requestType,
        requestId,
        approverId,
        status: WorkflowApprovalStatus.PENDING,
        metadata: JSON.stringify({
          workflowId,
          workflowName: workflow.name,
          stepName: firstStep.name,
          stepOrder: firstStep.order,
          totalSteps: workflow.steps.length
        })
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
            displayName: true
          }
        }
      }
    });

    // TODO: Send notification to approver
    if (firstStep.notifyOnEntry) {
      // await sendNotification(approverId, ...)
    }

    return NextResponse.json({
      approval,
      currentStep: firstStep,
      workflowName: workflow.name,
      message: 'Workflow initiated successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error initiating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to initiate workflow', details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflows/approvals?requestType=HR_REQUEST&requestId=xxx
 * Get approval status for a request
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestType = searchParams.get('requestType');
    const requestId = searchParams.get('requestId');

    if (!requestType || !requestId) {
      return NextResponse.json(
        { error: 'Missing requestType or requestId' },
        { status: 400 }
      );
    }

    const approvals = await prisma.workflowApprovalLog.findMany({
      where: {
        requestType,
        requestId
      },
      include: {
        step: {
          include: {
            workflow: true,
            workflowRole: true
          }
        },
        approver: {
          select: {
            id: true,
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (approvals.length === 0) {
      return NextResponse.json({
        approvals: [],
        currentStep: null,
        status: 'NOT_STARTED'
      });
    }

    const currentApproval = approvals.find(a => a.status === WorkflowApprovalStatus.PENDING);
    const completedSteps = approvals.filter(a => a.status === WorkflowApprovalStatus.APPROVED).length;
    
    // Fetch total steps count
    const totalSteps = await prisma.workflowStep.count({
      where: { workflowId: approvals[0].step.workflowId }
    });

    return NextResponse.json({
      approvals,
      currentApproval,
      currentStep: currentApproval?.step,
      completedSteps,
      totalSteps,
      status: currentApproval ? 'IN_PROGRESS' : 'COMPLETED',
      progress: Math.round((completedSteps / totalSteps) * 100)
    });

  } catch (error: any) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals', details: error?.message },
      { status: 500 }
    );
  }
}
