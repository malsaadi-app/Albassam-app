import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/settings/procurement-workflows - Fetch all category workflows
export async function GET() {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Fetch all workflows with their steps
    const workflows = await prisma.procurementCategoryWorkflow.findMany({
      include: {
        reviewer: { select: { id: true, displayName: true, username: true } },
        approver: { select: { id: true, displayName: true, username: true } },
        updater: { select: { id: true, displayName: true } },
        steps: {
          include: {
            user: {
              select: { id: true, displayName: true, username: true }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { category: 'asc' }
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error('❌ Error fetching procurement workflows:', error);
    return NextResponse.json(
      { error: 'فشل جلب إعدادات مسار الموافقات' },
      { status: 500 }
    );
  }
}

// POST /api/settings/procurement-workflows - Create or update workflows (batch)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { workflows } = body;

    if (!workflows || !Array.isArray(workflows)) {
      return NextResponse.json({ error: 'workflows array is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Upsert all workflows with their steps
    const updates = await Promise.all(
      workflows.map(async (wf: any) => {
        // Upsert the workflow
        const savedWorkflow = await prisma.procurementCategoryWorkflow.upsert({
          where: { category: wf.category },
          update: {
            reviewerUserId: wf.reviewerUserId || null,
            approverUserId: wf.approverUserId || null,
            requireReview: wf.requireReview ?? true,
            requireApproval: wf.requireApproval ?? true,
            autoApprove: wf.autoApprove ?? false,
            reviewTimeoutDays: wf.reviewTimeoutDays ?? 3,
            approvalTimeoutDays: wf.approvalTimeoutDays ?? 3,
            updatedBy: userId,
            updatedAt: new Date()
          },
          create: {
            category: wf.category,
            reviewerUserId: wf.reviewerUserId || null,
            approverUserId: wf.approverUserId || null,
            requireReview: wf.requireReview ?? true,
            requireApproval: wf.requireApproval ?? true,
            autoApprove: wf.autoApprove ?? false,
            reviewTimeoutDays: wf.reviewTimeoutDays ?? 3,
            approvalTimeoutDays: wf.approvalTimeoutDays ?? 3,
            updatedBy: userId
          }
        });

        // Delete existing steps
        await prisma.procurementWorkflowStep.deleteMany({
          where: { workflowId: savedWorkflow.id }
        });

        // Create new steps if provided
        if (wf.steps && Array.isArray(wf.steps) && wf.steps.length > 0) {
          await prisma.procurementWorkflowStep.createMany({
            data: wf.steps.map((step: any, index: number) => ({
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

    return NextResponse.json({ updated: updates.length, workflows: updates });
  } catch (error) {
    console.error('❌ Error saving procurement workflows:', error);
    return NextResponse.json(
      { error: 'فشل حفظ إعدادات مسار الموافقات' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/procurement-workflows - Bulk update multiple categories
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { categories, workflowData } = body;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ error: 'الفئات مطلوبة' }, { status: 400 });
    }

    const userId = session.user.id;

    // Update multiple categories at once
    const updates = await Promise.all(
      categories.map((category: any) =>
        prisma.procurementCategoryWorkflow.upsert({
          where: { category },
          update: {
            ...workflowData,
            updatedBy: userId,
            updatedAt: new Date()
          },
          create: {
            category,
            ...workflowData,
            updatedBy: userId
          }
        })
      )
    );

    return NextResponse.json({ updated: updates.length, workflows: updates });
  } catch (error) {
    console.error('❌ Error bulk updating procurement workflows:', error);
    return NextResponse.json(
      { error: 'فشل تحديث إعدادات مسار الموافقات' },
      { status: 500 }
    );
  }
}
