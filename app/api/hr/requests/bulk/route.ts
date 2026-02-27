import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { createHRRequestAuditLog } from '@/lib/audit';


const bulkActionSchema = z.object({
  requestIds: z.array(z.string()),
  action: z.enum(['approve', 'reject', 'return']),
  comment: z.string().min(1, 'التعليق مطلوب')
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Check if user is HR_EMPLOYEE or ADMIN
    if (session.user.role !== 'HR_EMPLOYEE' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح لك بهذا الإجراء' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = bulkActionSchema.parse(body);

    const results = [];
    const errors = [];

    for (const requestId of validatedData.requestIds) {
      try {
        const hrRequest = await prisma.hRRequest.findUnique({
          where: { id: requestId },
          include: {
            employee: {
              select: { displayName: true, id: true }
            }
          }
        });

        if (!hrRequest) {
          errors.push({ requestId, error: 'الطلب غير موجود' });
          continue;
        }

        // HR Employee actions
        if (session.user.role === 'HR_EMPLOYEE') {
          if (hrRequest.status !== 'PENDING_REVIEW') {
            errors.push({ requestId, error: 'لا يمكن مراجعة هذا الطلب' });
            continue;
          }

          if (validatedData.action === 'approve') {
            // Forward to admin for approval
            await prisma.hRRequest.update({
              where: { id: requestId },
              data: {
                status: 'PENDING_APPROVAL',
                reviewedBy: session.user.id,
                reviewComment: validatedData.comment,
                reviewedAt: new Date()
              }
            });

            // Notify admin
            const admins = await prisma.user.findMany({
              where: { role: 'ADMIN' },
              select: { id: true }
            });

            for (const admin of admins) {
              await prisma.notification.create({
                data: {
                  userId: admin.id,
                  title: 'طلب جاهز للموافقة',
                  message: `طلب من ${hrRequest.employee.displayName} جاهز للموافقة`,
                  type: 'request_pending_approval',
                  relatedId: requestId
                }
              });
            }

            await createHRRequestAuditLog(prisma, {
              requestId,
              actorUserId: session.user.id,
              action: 'HR_FORWARDED',
              message: validatedData.comment
            });

            results.push({ requestId, status: 'forwarded' });
          } else if (validatedData.action === 'return') {
            // Return to employee
            await prisma.hRRequest.update({
              where: { id: requestId },
              data: {
                status: 'RETURNED',
                reviewedBy: session.user.id,
                reviewComment: validatedData.comment,
                reviewedAt: new Date()
              }
            });

            // Notify employee
            await prisma.notification.create({
              data: {
                userId: hrRequest.employee.id,
                title: 'تم إرجاع طلبك',
                message: `تم إرجاع طلبك للتعديل: ${validatedData.comment}`,
                type: 'request_returned',
                relatedId: requestId
              }
            });

            await createHRRequestAuditLog(prisma, {
              requestId,
              actorUserId: session.user.id,
              action: 'HR_RETURNED',
              message: validatedData.comment
            });

            results.push({ requestId, status: 'returned' });
          } else {
            errors.push({ requestId, error: 'إجراء غير مسموح' });
          }
        }

        // Admin actions
        if (session.user.role === 'ADMIN') {
          if (hrRequest.status !== 'PENDING_APPROVAL') {
            errors.push({ requestId, error: 'لا يمكن الموافقة على هذا الطلب' });
            continue;
          }

          if (validatedData.action === 'approve') {
            await prisma.hRRequest.update({
              where: { id: requestId },
              data: {
                status: 'APPROVED',
                approvedBy: session.user.id,
                approvalComment: validatedData.comment,
                approvedAt: new Date()
              }
            });

            // If it's a leave request, deduct from balance
            if (hrRequest.type === 'LEAVE' && hrRequest.startDate && hrRequest.endDate) {
              const start = new Date(hrRequest.startDate);
              const end = new Date(hrRequest.endDate);
              const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

              const employee = await prisma.employee.findFirst({
                where: {
                  OR: [
                    { id: hrRequest.employeeId },
                    { userId: hrRequest.employeeId }
                  ]
                }
              });

              if (employee) {
                const currentYear = new Date().getFullYear();
                const leaveBalance = await prisma.leaveBalance.findFirst({
                  where: {
                    employeeId: employee.id,
                    year: currentYear
                  }
                });

                if (leaveBalance) {
                  const leaveType = hrRequest.leaveType || 'annual';
                  if (leaveType === 'annual') {
                    await prisma.leaveBalance.update({
                      where: { id: leaveBalance.id },
                      data: {
                        annualUsed: { increment: days },
                        annualRemaining: { decrement: days }
                      }
                    });
                  } else if (leaveType === 'casual') {
                    await prisma.leaveBalance.update({
                      where: { id: leaveBalance.id },
                      data: {
                        casualUsed: { increment: days },
                        casualRemaining: { decrement: days }
                      }
                    });
                  }
                }
              }
            }

            // Notify employee
            await prisma.notification.create({
              data: {
                userId: hrRequest.employee.id,
                title: 'تمت الموافقة على طلبك',
                message: `تمت الموافقة على طلبك ✅`,
                type: 'request_approved',
                relatedId: requestId
              }
            });

            await createHRRequestAuditLog(prisma, {
              requestId,
              actorUserId: session.user.id,
              action: 'ADMIN_APPROVED',
              message: validatedData.comment
            });

            results.push({ requestId, status: 'approved' });
          } else if (validatedData.action === 'reject') {
            await prisma.hRRequest.update({
              where: { id: requestId },
              data: {
                status: 'REJECTED',
                approvedBy: session.user.id,
                approvalComment: validatedData.comment,
                approvedAt: new Date()
              }
            });

            // Notify employee
            await prisma.notification.create({
              data: {
                userId: hrRequest.employee.id,
                title: 'تم رفض طلبك',
                message: `تم رفض طلبك: ${validatedData.comment}`,
                type: 'request_rejected',
                relatedId: requestId
              }
            });

            await createHRRequestAuditLog(prisma, {
              requestId,
              actorUserId: session.user.id,
              action: 'ADMIN_REJECTED',
              message: validatedData.comment
            });

            results.push({ requestId, status: 'rejected' });
          } else {
            errors.push({ requestId, error: 'إجراء غير مسموح' });
          }
        }
      } catch (error) {
        console.error(`Error processing request ${requestId}:`, error);
        errors.push({ requestId, error: 'حدث خطأ أثناء معالجة الطلب' });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      errors,
      summary: {
        total: validatedData.requestIds.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Error in bulk action:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تنفيذ العملية' },
      { status: 500 }
    );
  }
}
