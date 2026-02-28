import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { createHRRequestAuditLog } from '@/lib/audit';


// Validation schema
const processStepSchema = z.object({
  action: z.enum(['approve', 'reject']),
  comment: z.string().optional()
}).superRefine((val, ctx) => {
  if (val.action === 'reject' && (!val.comment || val.comment.trim().length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'سبب الرفض مطلوب', path: ['comment'] });
  }
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

/**
 * POST /api/hr/requests/[id]/process-step
 * Process the current workflow step (approve or reject)
 * Works with dynamic workflow steps
 */
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

    // Fetch the request with workflow info
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

    // Get workflow for this request type
    const workflow = await prisma.hRRequestTypeWorkflow.findUnique({
      where: { requestType: hrRequest.type as any },
      include: {
        steps: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!workflow || !workflow.steps || workflow.steps.length === 0) {
      return NextResponse.json(
        { error: 'لا يوجد workflow محدد لهذا النوع من الطلبات' },
        { status: 400 }
      );
    }

    const currentStepIndex = hrRequest.currentWorkflowStep ?? 0;
    const currentStep = workflow.steps[currentStepIndex];

    if (!currentStep) {
      return NextResponse.json(
        { error: 'خطوة غير صحيحة' },
        { status: 400 }
      );
    }

    // Verify user is authorized for this step (dynamic routing)
    const { userIds: allowedUserIds, labelAr } = await (await import('@/lib/hrWorkflowRouting')).getApproverUserIdsForHRRequestStep({
      requestType: hrRequest.type,
      requesterUserId: hrRequest.employeeId,
      stepOrder: currentStep.order
    });

    if (!allowedUserIds.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'غير مصرح لك بمعالجة هذه الخطوة', expected: labelAr },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = processStepSchema.parse(body);

    let updatedRequest;

    if (validatedData.action === 'reject') {
      // Reject the request immediately
      updatedRequest = await prisma.hRRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewComment: validatedData.comment || null,
          reviewedBy: session.user.id,
          reviewedAt: new Date()
        }
      });

      await createHRRequestAuditLog(prisma, {
        requestId: id,
        actorUserId: session.user.id,
        action: 'REJECTED',
        message: `رفض في خطوة: ${currentStep.statusName}${validatedData.comment ? ` - ${validatedData.comment}` : ''}`
      });

      // Notify employee
      await prisma.notification.create({
        data: {
          userId: hrRequest.employeeId,
          title: 'طلب مرفوض',
          message: `تم رفض طلب ${getRequestTypeArabic(hrRequest.type)} الخاص بك في مرحلة: ${currentStep.statusName}`,
          type: 'request_rejected',
          relatedId: hrRequest.id,
          isRead: false
        }
      });
    } else {
      // Approve current step
      const nextStepIndex = currentStepIndex + 1;
      const isLastStep = nextStepIndex >= workflow.steps.length;

      if (isLastStep) {
        // Final approval - complete the request
        updatedRequest = await prisma.hRRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvalComment: validatedData.comment || null,
            approvedBy: session.user.id,
            approvedAt: new Date(),
            currentWorkflowStep: nextStepIndex
          }
        });

        // If it's a leave request, deduct from balance
        if (hrRequest.type === 'LEAVE' && hrRequest.startDate && hrRequest.endDate && hrRequest.employee.employee) {
          const start = new Date(hrRequest.startDate);
          const end = new Date(hrRequest.endDate);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          const employeeId = hrRequest.employee.employee.id;
          const currentYear = new Date().getFullYear();

          const leaveBalance = await prisma.leaveBalance.findFirst({
            where: {
              employeeId,
              year: currentYear
            }
          });

          if (leaveBalance) {
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
          action: 'APPROVED',
          message: `موافقة نهائية من: ${currentStep.statusName}${validatedData.comment ? ` - ${validatedData.comment}` : ''}`
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
        // Move to next actionable step (auto-skip empty routed steps)
        let candidateIndex = nextStepIndex;
        let nextStep = workflow.steps[candidateIndex];
        let nextUserIds: string[] = [];

        while (nextStep && candidateIndex < workflow.steps.length) {
          const routed = await (await import('@/lib/hrWorkflowRouting')).getApproverUserIdsForHRRequestStep({
            requestType: hrRequest.type,
            requesterUserId: hrRequest.employeeId,
            stepOrder: nextStep.order
          });

          nextUserIds = routed.userIds;
          if (nextUserIds.length > 0) break;

          candidateIndex++;
          nextStep = workflow.steps[candidateIndex];
        }

        const reachedEnd = !nextStep || candidateIndex >= workflow.steps.length;

        if (reachedEnd) {
          // No further approvers found; treat as final approval
          updatedRequest = await prisma.hRRequest.update({
            where: { id },
            data: {
              status: 'APPROVED',
              approvalComment: validatedData.comment || null,
              approvedBy: session.user.id,
              approvedAt: new Date(),
              currentWorkflowStep: workflow.steps.length
            }
          });

          await createHRRequestAuditLog(prisma, {
            requestId: id,
            actorUserId: session.user.id,
            action: 'APPROVED',
            message: `موافقة نهائية (تخطي تلقائي للخطوات الفارغة): ${currentStep.statusName}${validatedData.comment ? ` - ${validatedData.comment}` : ''}`
          });

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
          updatedRequest = await prisma.hRRequest.update({
            where: { id },
            data: {
              status: 'PENDING_APPROVAL',
              currentWorkflowStep: candidateIndex,
              reviewComment: validatedData.comment || null,
              reviewedBy: session.user.id,
              reviewedAt: new Date()
            }
          });

          await createHRRequestAuditLog(prisma, {
            requestId: id,
            actorUserId: session.user.id,
            action: 'STEP_APPROVED',
            message: `تمت الموافقة في خطوة: ${currentStep.statusName}. تحول إلى: ${nextStep.statusName}${validatedData.comment ? ` - ${validatedData.comment}` : ''}`
          });

          // Notify next responsible person(s)
          for (const userId of nextUserIds) {
            await prisma.notification.create({
              data: {
                userId,
                title: 'طلب بانتظار موافقتك',
                message: `طلب ${getRequestTypeArabic(hrRequest.type)} من ${hrRequest.employee.displayName} في مرحلة: ${nextStep.statusName}`,
                type: 'request_pending',
                relatedId: hrRequest.id,
                isRead: false
              }
            });
          }

          // Notify employee of progress
          await prisma.notification.create({
            data: {
              userId: hrRequest.employeeId,
              title: 'تقدم في طلبك',
              message: `طلب ${getRequestTypeArabic(hrRequest.type)} الخاص بك تقدم إلى مرحلة: ${nextStep.statusName}`,
              type: 'request_updated',
              relatedId: hrRequest.id,
              isRead: false
            }
          });
        }

      }
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error processing workflow step:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الخطوة' },
      { status: 500 }
    );
  }
}
