import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { createHRRequestAuditLog } from '@/lib/audit';
import { hasPermission, isSuperAdmin } from '@/lib/permissions';


// Validation schema for review action
const reviewSchema = z.object({
  action: z.enum(['approve', 'return']),
  comment: z.string().min(1, 'التعليق مطلوب')
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

// POST /api/hr/requests/[id]/review - HR employee review action
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

    // RBAC: requires hr_requests.review (or SUPER_ADMIN)
    const allowed = (await isSuperAdmin(session.user.id)) || (await hasPermission(session.user.id, 'hr_requests.review'));
    if (!allowed) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const hrRequest = await prisma.hRRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    if (!hrRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // Can only review PENDING_REVIEW requests
    if (hrRequest.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'يمكن مراجعة الطلبات قيد المراجعة فقط' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    let updatedRequest;

    if (validatedData.action === 'approve') {
      // Forward to manager for final approval
      updatedRequest = await prisma.hRRequest.update({
        where: { id },
        data: {
          status: 'PENDING_APPROVAL',
          reviewedBy: session.user.id,
          reviewComment: validatedData.comment,
          reviewedAt: new Date()
        }
      });

      await createHRRequestAuditLog(prisma, {
        requestId: id,
        actorUserId: session.user.id,
        action: 'HR_FORWARDED',
        message: validatedData.comment
      });

      // Notify HR managers (fallback to ADMIN legacy role)
      const { getUserIdsBySystemRoleName } = await import('@/lib/hrWorkflowRouting');
      const hrManagers = await getUserIdsBySystemRoleName('HR_MANAGER');
      const fallbackAdmins = hrManagers.length === 0
        ? await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
        : [];

      const recipients = hrManagers.length > 0 ? hrManagers : fallbackAdmins.map(a => a.id);

      for (const userId of recipients) {
        await prisma.notification.create({
          data: {
            userId,
            title: 'طلب بانتظار الموافقة',
            message: `طلب ${getRequestTypeArabic(hrRequest.type)} من ${hrRequest.employee.displayName} بانتظار موافقتك`,
            type: 'request_pending_approval',
            relatedId: hrRequest.id,
            isRead: false
          }
        });
      }
    } else {
      // Return to employee
      updatedRequest = await prisma.hRRequest.update({
        where: { id },
        data: {
          status: 'RETURNED',
          reviewedBy: session.user.id,
          reviewComment: validatedData.comment,
          reviewedAt: new Date()
        }
      });

      await createHRRequestAuditLog(prisma, {
        requestId: id,
        actorUserId: session.user.id,
        action: 'HR_RETURNED',
        message: validatedData.comment
      });

      // Notify employee
      await prisma.notification.create({
        data: {
          userId: hrRequest.employeeId,
          title: 'طلب مرتجع',
          message: `تم إرجاع طلب ${getRequestTypeArabic(hrRequest.type)} الخاص بك. يرجى مراجعة التعليقات`,
          type: 'request_returned',
          relatedId: hrRequest.id,
          isRead: false
        }
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error reviewing HR request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ أثناء مراجعة الطلب' },
      { status: 500 }
    );
  }
}
