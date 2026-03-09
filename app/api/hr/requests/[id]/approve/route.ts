import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { createHRRequestAuditLog } from '@/lib/audit';
import { hasPermission, isSuperAdmin } from '@/lib/permissions-server';


// Validation schema for approval action
const approvalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  comment: z.string().optional()
});

// Helper function to get Arabic request type name
function getRequestTypeArabic(type: string): string {
  const types: { [key: string]: string } = {
    'LEAVE': 'إجازة',
    'TICKET_ALLOWANCE': 'بدل تذاكر',
    'FLIGHT_BOOKING': 'حجز طيران',
    'SALARY_CERTIFICATE': 'تعريف بالراتب',
    'HOUSING_ALLOWANCE': 'بدل سكن',
    'VISA_EXIT_REENTRY_SINGLE': 'خروج/عودة مفرد',
    'VISA_EXIT_REENTRY_MULTI': 'خروج/عودة متعدد',
    'RESIGNATION': 'استقالة'
  };
  return types[type] || type;
}

// POST /api/hr/requests/[id]/approve - Admin final approval/rejection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // RBAC: requires hr_requests.approve (or SUPER_ADMIN)
    const allowed = isSuperAdmin(session.user) || hasPermission(session.user, 'hr_requests.approve');
    if (!allowed) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const hrRequest = await prisma.hRRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            displayName: true,
            employee: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!hrRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // Can only approve PENDING_APPROVAL requests
    if (hrRequest.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: 'يمكن الموافقة على الطلبات قيد الموافقة فقط' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = approvalSchema.parse(body);

    let updatedRequest;

    if (validatedData.action === 'approve') {
      // Approve the request
      updatedRequest = await prisma.hRRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: session.user.id,
          approvalComment: validatedData.comment,
          approvedAt: new Date()
        }
      });

      // If it's a leave request, deduct from balance
      if (hrRequest.type === 'LEAVE' && hrRequest.startDate && hrRequest.endDate && hrRequest.employee.employee) {
        const start = new Date(hrRequest.startDate);
        const end = new Date(hrRequest.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        const employeeId = hrRequest.employee.employee.id;
        const currentYear = new Date().getFullYear();

        // Get current leave balance
        const leaveBalance = await prisma.leaveBalance.findFirst({
          where: {
            employeeId,
            year: currentYear
          }
        });

        if (leaveBalance) {
          // Determine which balance to deduct from based on leave type
          if (hrRequest.leaveType === 'annual') {
            await prisma.leaveBalance.update({
              where: { id: leaveBalance.id },
              data: {
                annualUsed: leaveBalance.annualUsed + days,
                annualRemaining: leaveBalance.annualRemaining - days
              }
            });
          } else if (hrRequest.leaveType === 'sick' || hrRequest.leaveType === 'emergency') {
            await prisma.leaveBalance.update({
              where: { id: leaveBalance.id },
              data: {
                casualUsed: leaveBalance.casualUsed + days,
                casualRemaining: leaveBalance.casualRemaining - days
              }
            });
          }
        }
      }

      await createHRRequestAuditLog(prisma, {
        requestId: id,
        actorUserId: session.user.id,
        action: 'ADMIN_APPROVED',
        message: validatedData.comment || null
      });

      // Notify employee
      await prisma.notification.create({
        data: {
          userId: hrRequest.employeeId,
          title: 'طلب موافق عليه',
          message: `تمت الموافقة على طلب ${getRequestTypeArabic(hrRequest.type)} الخاص بك`,
          type: 'request_approved',
          relatedId: hrRequest.id,
          isRead: false
        }
      });
    } else {
      // Reject the request
      updatedRequest = await prisma.hRRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          approvedBy: session.user.id,
          approvalComment: validatedData.comment,
          approvedAt: new Date()
        }
      });

      await createHRRequestAuditLog(prisma, {
        requestId: id,
        actorUserId: session.user.id,
        action: 'ADMIN_REJECTED',
        message: validatedData.comment || null
      });

      // Notify employee
      await prisma.notification.create({
        data: {
          userId: hrRequest.employeeId,
          title: 'طلب مرفوض',
          message: `تم رفض طلب ${getRequestTypeArabic(hrRequest.type)} الخاص بك`,
          type: 'request_rejected',
          relatedId: hrRequest.id,
          isRead: false
        }
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error approving HR request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الموافقة على الطلب' },
      { status: 500 }
    );
  }
}
