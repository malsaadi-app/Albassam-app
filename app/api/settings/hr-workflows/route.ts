import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Get all request type workflows with their steps
    const workflows = await prisma.hRRequestTypeWorkflow.findMany({
      include: {
        steps: {
          include: {
            user: {
              select: { id: true, displayName: true, username: true }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { requestType: 'asc' }
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching HR workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { workflows } = body;

    if (!Array.isArray(workflows)) {
      return NextResponse.json({ error: 'Invalid workflows data' }, { status: 400 });
    }

    const userId = session.user.id;

    // Update or create each workflow with its steps
    const results = await Promise.all(
      workflows.map(async (workflow) => {
        // Upsert the workflow
        const savedWorkflow = await prisma.hRRequestTypeWorkflow.upsert({
          where: { requestType: workflow.requestType },
          update: {
            reviewerUserId: workflow.reviewerUserId || null,
            approverUserId: workflow.approverUserId || null,
            requireReview: workflow.requireReview ?? true,
            requireApproval: workflow.requireApproval ?? true,
            autoApprove: workflow.autoApprove ?? false,
            reviewTimeoutDays: workflow.reviewTimeoutDays || 3,
            approvalTimeoutDays: workflow.approvalTimeoutDays || 3,
            updatedBy: userId
          },
          create: {
            requestType: workflow.requestType,
            reviewerUserId: workflow.reviewerUserId || null,
            approverUserId: workflow.approverUserId || null,
            requireReview: workflow.requireReview ?? true,
            requireApproval: workflow.requireApproval ?? true,
            autoApprove: workflow.autoApprove ?? false,
            reviewTimeoutDays: workflow.reviewTimeoutDays || 3,
            approvalTimeoutDays: workflow.approvalTimeoutDays || 3,
            updatedBy: userId
          }
        });

        // Delete existing steps
        await prisma.hRWorkflowStep.deleteMany({
          where: { workflowId: savedWorkflow.id }
        });

        // Create new steps if provided
        if (workflow.steps && Array.isArray(workflow.steps) && workflow.steps.length > 0) {
          await prisma.hRWorkflowStep.createMany({
            data: workflow.steps.map((step: any, index: number) => ({
              workflowId: savedWorkflow.id,
              order: step.order ?? index,
              userId: step.userId,
              statusName: step.statusName || `خطوة ${index + 1}`
            }))
          });
        }

        return savedWorkflow;
      })
    );

    return NextResponse.json({ success: true, workflows: results });
  } catch (error) {
    console.error('Error saving HR workflows:', error);
    return NextResponse.json(
      { error: 'Failed to save workflows' },
      { status: 500 }
    );
  }
}
