import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { approveStep } from '@/lib/workflow-runtime';
import { prisma } from '@/lib/db';

/**
 * POST /api/workflows/runtime/[id]/approve
 * Approve a workflow step and move to next
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { comments } = body;

    // Approve the step
    const result = await approveStep({
      approvalId: id,
      approverId: session.user.id,
      comments: comments || undefined
    });

    // Get approval details for notification
    const approval = await prisma.workflowRuntimeApproval.findUnique({
      where: { id },
      include: {
        version: {
          include: {
            workflow: true
          }
        },
        stepDefinition: true
      }
    });

    if (!approval) {
      return NextResponse.json({ error: 'الموافقة غير موجودة' }, { status: 404 });
    }

    // Get requester userId
    let requesterUserId: string | null = null;
    
    if (approval.requestType === 'HR_REQUEST') {
      const req = await prisma.hRRequest.findUnique({
        where: { id: approval.requestId },
        select: { employeeId: true }
      });
      requesterUserId = req?.employeeId || null;
    } else if (approval.requestType === 'PURCHASE_REQUEST') {
      const req = await prisma.purchaseRequest.findUnique({
        where: { id: approval.requestId },
        select: { requestedById: true }
      });
      requesterUserId = req?.requestedById || null;
    } else if (approval.requestType === 'MAINTENANCE_REQUEST') {
      const req = await prisma.maintenanceRequest.findUnique({
        where: { id: approval.requestId },
        select: { requestedById: true }
      });
      // Need to get userId from employee
      if (req?.requestedById) {
        const emp = await prisma.employee.findUnique({
          where: { id: req.requestedById },
          select: { userId: true }
        });
        requesterUserId = emp?.userId || null;
      }
    } else if (approval.requestType === 'ATTENDANCE_CORRECTION') {
      const req = await prisma.attendanceRequest.findUnique({
        where: { id: approval.requestId },
        select: { userId: true }
      });
      requesterUserId = req?.userId || null;
    }

    // Update request status if workflow complete
    if (result.completed) {
      // Update based on request type
      if (approval.requestType === 'HR_REQUEST') {
        await prisma.hRRequest.update({
          where: { id: approval.requestId },
          data: { status: 'APPROVED' }
        });
      } else if (approval.requestType === 'PURCHASE_REQUEST') {
        await prisma.purchaseRequest.update({
          where: { id: approval.requestId },
          data: { status: 'APPROVED' }
        });
      } else if (approval.requestType === 'MAINTENANCE_REQUEST') {
        await prisma.maintenanceRequest.update({
          where: { id: approval.requestId },
          data: { status: 'COMPLETED' }
        });
      } else if (approval.requestType === 'ATTENDANCE_CORRECTION') {
        await prisma.attendanceRequest.update({
          where: { id: approval.requestId },
          data: { status: 'APPROVED' }
        });
      }

      // Send notification to requester
      if (requesterUserId) {
        await prisma.notification.create({
          data: {
            userId: requesterUserId,
            title: 'تمت الموافقة على الطلب',
            message: `تمت الموافقة على طلبك - ${approval.version.workflow.name}`,
            type: 'WORKFLOW_APPROVED',
            relatedId: approval.requestId,
            isRead: false
          }
        });
      }
    } else if (result.nextApproval) {
      // Send notification to next approver
      await prisma.notification.create({
        data: {
          userId: result.nextApproval.approverId,
          title: 'طلب جديد بانتظار موافقتك',
          message: `طلب جديد في انتظار موافقتك - ${approval.version.workflow.name}`,
          type: 'WORKFLOW_PENDING',
          relatedId: approval.requestId,
          isRead: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      completed: result.completed,
      nextApproval: result.nextApproval ? {
        id: result.nextApproval.id,
        approverId: result.nextApproval.approverId
      } : null,
      message: result.completed 
        ? 'تمت الموافقة وإكمال الطلب بنجاح' 
        : 'تمت الموافقة وانتقل الطلب للمرحلة التالية'
    });
  } catch (error: any) {
    console.error('Error approving workflow step:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء الموافقة' },
      { status: 500 }
    );
  }
}
