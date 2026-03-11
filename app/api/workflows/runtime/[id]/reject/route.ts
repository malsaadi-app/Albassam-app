import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { rejectStep } from '@/lib/workflow-runtime';
import { prisma } from '@/lib/db';
import { processExcuseStatusChange } from '@/lib/attendance-deductions';

/**
 * POST /api/workflows/runtime/[id]/reject
 * Reject a workflow step
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

    if (!comments || !comments.trim()) {
      return NextResponse.json(
        { error: 'سبب الرفض مطلوب' },
        { status: 400 }
      );
    }

    // Reject the step
    await rejectStep({
      approvalId: id,
      approverId: session.user.id,
      comments
    });

    // Get approval details
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

    // Update request status to REJECTED
    if (approval.requestType === 'HR_REQUEST') {
      await prisma.hRRequest.update({
        where: { id: approval.requestId },
        data: { status: 'REJECTED' }
      });
    } else if (approval.requestType === 'PURCHASE_REQUEST') {
      await prisma.purchaseRequest.update({
        where: { id: approval.requestId },
        data: { status: 'REJECTED' }
      });
    } else if (approval.requestType === 'MAINTENANCE_REQUEST') {
      await prisma.maintenanceRequest.update({
        where: { id: approval.requestId },
        data: { status: 'REJECTED' }
      });
    } else if (approval.requestType === 'ATTENDANCE_CORRECTION') {
      const attendanceReq = await prisma.attendanceRequest.update({
        where: { id: approval.requestId },
        data: { status: 'REJECTED' }
      });
      
      // Create attendance deduction if excuse is rejected
      if (attendanceReq.userId) {
        try {
          await processExcuseStatusChange(
            attendanceReq.id,
            'REJECTED',
            attendanceReq.userId
          );
        } catch (error) {
          console.error('Failed to process attendance deduction:', error);
          // Don't block the rejection - just log the error
        }
      }
    }

    // Send notification to requester
    if (requesterUserId) {
      await prisma.notification.create({
        data: {
          userId: requesterUserId,
          title: 'تم رفض الطلب',
          message: `تم رفض طلبك - ${approval.version.workflow.name}\nالسبب: ${comments}`,
          type: 'WORKFLOW_REJECTED',
          relatedId: approval.requestId,
          isRead: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم رفض الطلب بنجاح'
    });
  } catch (error: any) {
    console.error('Error rejecting workflow step:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء الرفض' },
      { status: 500 }
    );
  }
}
