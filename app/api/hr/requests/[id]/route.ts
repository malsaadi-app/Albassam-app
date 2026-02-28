import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { isDelegatedViewer } from '@/lib/delegation';
import { HR_REQUEST_TYPE_CONFIG } from '@/lib/hrRequestConfig';
import { createHRRequestAuditLog, diffObjects } from '@/lib/audit';


// Validation schema for updating HR requests
const updateRequestSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  leaveType: z.string().optional(),
  destination: z.string().optional(),
  travelDate: z.string().optional(),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  amount: z.number().optional(),
  period: z.string().optional(),
  purpose: z.string().optional(),
  recipientOrganization: z.string().optional(),
  reason: z.string().optional(),
  attachment: z.string().optional()
}).superRefine((val, ctx) => {
  // Server-side conditional validation (based on existing request type)
  // The actual type is fetched from DB in PUT.
});

// GET /api/hr/requests/[id] - Get request details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const hrRequest = await prisma.hRRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        },
        reviewer: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        },
        approver: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        }
      }
    });

    if (!hrRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // Check permissions
    if (session.user.role === 'USER') {
      const delegated = await isDelegatedViewer(prisma, session.user.id)

      const isOwner = hrRequest.employeeId === session.user.id

      // Also allow current-step approvers (e.g., stage managers / VP) to view details.
      let isApprover = false
      try {
        const workflow = await prisma.hRRequestTypeWorkflow.findUnique({
          where: { requestType: hrRequest.type as any },
          include: { steps: { orderBy: { order: 'asc' } } }
        })
        const currentIndex = hrRequest.currentWorkflowStep ?? 0
        const currentStep = workflow?.steps?.[currentIndex]
        if (currentStep) {
          const routed = await (await import('@/lib/hrWorkflowRouting')).getApproverUserIdsForHRRequestStep({
            requestType: hrRequest.type,
            requesterUserId: hrRequest.employeeId,
            stepOrder: currentStep.order,
          })
          isApprover = routed.userIds.includes(session.user.id)
        }
      } catch (e) {
        console.warn('HR request approver check failed', e)
      }

      if (!delegated && !isOwner && !isApprover) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
      }
    }

    return NextResponse.json(hrRequest);
  } catch (error) {
    console.error('Error fetching HR request:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الطلب' },
      { status: 500 }
    );
  }
}

// PUT /api/hr/requests/[id] - Edit request (only if RETURNED status)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const hrRequest = await prisma.hRRequest.findUnique({
      where: { id }
    });

    if (!hrRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // Only the employee who submitted can edit
    if (hrRequest.employeeId !== session.user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Only RETURNED requests can be edited
    if (hrRequest.status !== 'RETURNED') {
      return NextResponse.json(
        { error: 'يمكن تعديل الطلبات المرتجعة فقط' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateRequestSchema.parse(body);

    // Conditional validation based on request type
    const cfg = (HR_REQUEST_TYPE_CONFIG as any)[hrRequest.type];
    if (cfg?.requiredFields?.length) {
      for (const field of cfg.requiredFields) {
        // allow partial updates? for resubmit we want required present after update
        const incoming = (validatedData as any)[field];
        const existing = (hrRequest as any)[field];
        const finalVal = incoming !== undefined ? incoming : existing;
        const missing = finalVal === undefined || finalVal === null || (typeof finalVal === 'string' && finalVal.trim() === '');
        if (missing) {
          return NextResponse.json({ error: `الحقل مطلوب: ${field}` }, { status: 400 });
        }
      }
    }

    const before = {
      startDate: hrRequest.startDate,
      endDate: hrRequest.endDate,
      leaveType: hrRequest.leaveType,
      destination: hrRequest.destination,
      travelDate: hrRequest.travelDate,
      departureDate: hrRequest.departureDate,
      returnDate: hrRequest.returnDate,
      amount: hrRequest.amount,
      period: hrRequest.period,
      purpose: hrRequest.purpose,
      recipientOrganization: hrRequest.recipientOrganization,
      reason: hrRequest.reason,
      attachment: hrRequest.attachment
    };

    // Update the request and change status back to PENDING_REVIEW
    const updatedRequest = await prisma.hRRequest.update({
      where: { id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        travelDate: validatedData.travelDate ? new Date(validatedData.travelDate) : undefined,
        departureDate: validatedData.departureDate ? new Date(validatedData.departureDate) : undefined,
        returnDate: validatedData.returnDate ? new Date(validatedData.returnDate) : undefined,
        status: 'PENDING_REVIEW' // Reset to pending review
      },
      include: {
        employee: {
          select: {
            displayName: true
          }
        }
      }
    });

    const after = {
      startDate: updatedRequest.startDate,
      endDate: updatedRequest.endDate,
      leaveType: updatedRequest.leaveType,
      destination: updatedRequest.destination,
      travelDate: updatedRequest.travelDate,
      departureDate: updatedRequest.departureDate,
      returnDate: updatedRequest.returnDate,
      amount: updatedRequest.amount,
      period: updatedRequest.period,
      purpose: updatedRequest.purpose,
      recipientOrganization: updatedRequest.recipientOrganization,
      reason: updatedRequest.reason,
      attachment: updatedRequest.attachment
    };

    const changes = diffObjects(before, after);
    await createHRRequestAuditLog(prisma, {
      requestId: updatedRequest.id,
      actorUserId: session.user.id,
      action: 'REQUEST_UPDATED',
      message: 'تم تحديث الطلب وإعادة الإرسال',
      diffJson: changes
    });

    // Notify HR employee that request was resubmitted
    if (hrRequest.reviewedBy) {
      await prisma.notification.create({
        data: {
          userId: hrRequest.reviewedBy,
          title: 'طلب معاد إرساله',
          message: `تم إعادة إرسال طلب من ${updatedRequest.employee.displayName}`,
          type: 'request_resubmitted',
          relatedId: updatedRequest.id,
          isRead: false
        }
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating HR request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الطلب' },
      { status: 500 }
    );
  }
}
