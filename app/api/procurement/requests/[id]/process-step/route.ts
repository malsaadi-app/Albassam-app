import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { createPurchaseRequestAuditLog } from '@/lib/procurementAudit';

// Validation schema (requireComment resolved dynamically from builder when available)
const processStepSchema = z
  .object({
    action: z.enum(['approve', 'reject']),
    comment: z.string().optional(),
    _requireComment: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    const require = val._requireComment !== false
    if (require && (!val.comment || val.comment.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: val.action === 'reject' ? 'سبب الرفض مطلوب' : 'تعليق الموافقة مطلوب',
        path: ['comment'],
      })
    }
  });

// Helper function to get category label
function getCategoryLabel(category: string): string {
  const labels: { [key: string]: string } = {
    'STATIONERY': 'قرطاسية',
    'CLEANING': 'نظافة',
    'MAINTENANCE': 'صيانة',
    'FOOD': 'مواد غذائية',
    'EQUIPMENT': 'معدات',
    'TECHNOLOGY': 'تقنية',
    'FURNITURE': 'أثاث',
    'TEXTBOOKS': 'كتب دراسية',
    'UNIFORMS': 'زي مدرسي',
    'OTHER': 'أخرى'
  };
  return labels[category] || category;
}

/**
 * POST /api/procurement/requests/[id]/process-step
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
    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        requestedBy: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    if (!purchaseRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // Get workflow for this category
    const workflow = await prisma.procurementCategoryWorkflow.findUnique({
      where: { category: purchaseRequest.category },
      include: {
        steps: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!workflow || !workflow.steps || workflow.steps.length === 0) {
      return NextResponse.json(
        { error: 'لا يوجد workflow محدد لهذا التصنيف' },
        { status: 400 }
      );
    }

    const currentStepIndex = purchaseRequest.currentWorkflowStep ?? 0;
    const currentStep = workflow.steps[currentStepIndex];

    if (!currentStep) {
      return NextResponse.json(
        { error: 'خطوة غير صحيحة' },
        { status: 400 }
      );
    }

    // Verify user is authorized for this step.
    // Special case: step0 can have a branch gatekeeper (e.g., Asma) who pre-approves,
    // then the configured step owner (mq) still approves the same step.
    const { resolveProcurementStepAssignees } = await import('@/lib/procurementWorkflowRouting')
    const allowedUserIds = await resolveProcurementStepAssignees({
      requestedByUserId: purchaseRequest.requestedById,
      workflowCategory: purchaseRequest.category,
      stepIndex: currentStepIndex,
      fallbackUserId: currentStep.userId,
    })

    const isGatekeeperPreApproval = currentStepIndex === 0 && session.user.id !== currentStep.userId && allowedUserIds.includes(session.user.id)

    // Normal step owner OR allowed assignee
    if (!isGatekeeperPreApproval && currentStep.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'غير مصرح لك بمعالجة هذه الخطوة' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Builder-first: get step name + requireComment (if published)
    let requireComment = true
    let currentStepName = currentStep.statusName
    let nextStepName: string | null = null
    try {
      const { getProcurementStepDefinitionFromBuilder } = await import('@/lib/procurementWorkflowBuilderRouting')
      const stepDef = await getProcurementStepDefinitionFromBuilder({
        requestType: 'PURCHASE_REQUEST',
        requestedByUserId: purchaseRequest.requestedById,
        category: String(purchaseRequest.category),
        stepIndex: currentStepIndex,
      })
      if (stepDef) {
        if (typeof stepDef.requireComment === 'boolean') requireComment = stepDef.requireComment
        if (stepDef.titleAr) currentStepName = String(stepDef.titleAr)
      }

      const ns = await getProcurementStepDefinitionFromBuilder({
        requestType: 'PURCHASE_REQUEST',
        requestedByUserId: purchaseRequest.requestedById,
        category: String(purchaseRequest.category),
        stepIndex: currentStepIndex + 1,
      })
      if (ns?.titleAr) nextStepName = String(ns.titleAr)
    } catch {
      // ignore
    }

    const validatedData = processStepSchema.parse({ ...body, _requireComment: requireComment });

    let updatedRequest;

    // Gatekeeper pre-approval: do NOT advance workflow step, just notify configured step owner.
    if (isGatekeeperPreApproval && validatedData.action === 'approve') {
      // notify configured owner (mq)
      await prisma.notification.create({
        data: {
          userId: currentStep.userId,
          title: 'طلب شراء جاهز للمراجعة النهائية',
          message: `تمت موافقة مسؤول الفرع على طلب الشراء ${purchaseRequest.requestNumber}، بانتظار مراجعتك (${currentStepName})`,
          type: 'procurement_gatekeeper_approved',
          relatedId: purchaseRequest.id,
          isRead: false,
        },
      })

      // notify requester
      await prisma.notification.create({
        data: {
          userId: purchaseRequest.requestedById,
          title: 'تقدم في طلب الشراء',
          message: `تمت موافقة مسؤول الفرع على طلب الشراء ${purchaseRequest.requestNumber}، والآن بانتظار مراجعة المشتريات`,
          type: 'procurement_updated',
          relatedId: purchaseRequest.id,
          isRead: false,
        },
      })

      await createPurchaseRequestAuditLog(prisma as any, {
        requestId: purchaseRequest.id,
        actorUserId: session.user.id,
        action: 'STEP_APPROVED',
        message: `اعتماد (Gatekeeper): ${currentStepName}${validatedData.comment ? ` - ${validatedData.comment}` : ''}`,
      })

      return NextResponse.json({ ok: true, status: purchaseRequest.status, currentWorkflowStep: purchaseRequest.currentWorkflowStep })
    }

    if (validatedData.action === 'reject') {
      // Reject the request immediately
      updatedRequest = await prisma.purchaseRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewNotes: validatedData.comment || null,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          rejectedReason: `رفض في مرحلة: ${currentStepName}${validatedData.comment ? ` - ${validatedData.comment}` : ''}`
        }
      });

      await createPurchaseRequestAuditLog(prisma as any, {
        requestId: purchaseRequest.id,
        actorUserId: session.user.id,
        action: 'REJECTED',
        message: `تم الرفض في مرحلة: ${currentStepName}${validatedData.comment ? ` - ${validatedData.comment}` : ''}`,
      })

      // Notify requester
      await prisma.notification.create({
        data: {
          userId: purchaseRequest.requestedById,
          title: 'طلب شراء مرفوض',
          message: `تم رفض طلب الشراء ${purchaseRequest.requestNumber} في مرحلة: ${currentStepName}`,
          type: 'procurement_rejected',
          relatedId: purchaseRequest.id,
          isRead: false
        }
      });
    } else {
      // Approve current step
      const nextStepIndex = currentStepIndex + 1;
      const isLastStep = nextStepIndex >= workflow.steps.length;

      if (isLastStep) {
        // Last workflow step: mark as IN_PROGRESS (execution/delivery happens next).
        updatedRequest = await prisma.purchaseRequest.update({
          where: { id },
          data: {
            status: 'IN_PROGRESS',
            approvalNotes: validatedData.comment || null,
            approvedById: session.user.id,
            approvedAt: new Date(),
            currentWorkflowStep: nextStepIndex
          }
        });

        await createPurchaseRequestAuditLog(prisma as any, {
          requestId: purchaseRequest.id,
          actorUserId: session.user.id,
          action: 'APPROVED',
          message: `موافقة نهائية: ${currentStepName}${validatedData.comment ? ` - ${validatedData.comment}` : ''}`,
        })

        // Notify requester
        await prisma.notification.create({
          data: {
            userId: purchaseRequest.requestedById,
            title: 'طلب شراء قيد التنفيذ',
            message: `تم اعتماد طلب الشراء ${purchaseRequest.requestNumber} وهو الآن قيد التنفيذ/التسليم` ,
            type: 'procurement_in_progress',
            relatedId: purchaseRequest.id,
            isRead: false
          }
        });
      } else {
        // Move to next step
        const nextStep = workflow.steps[nextStepIndex];
        
        updatedRequest = await prisma.purchaseRequest.update({
          where: { id },
          data: {
            status: 'REVIEWED', // Keep enum-compatible status
            currentWorkflowStep: nextStepIndex,
            reviewNotes: validatedData.comment || null,
            reviewedById: session.user.id,
            reviewedAt: new Date()
          }
        });

        // Notify next responsible person(s)
        const nextAssignees = await resolveProcurementStepAssignees({
          requestedByUserId: purchaseRequest.requestedById,
          workflowCategory: purchaseRequest.category,
          stepIndex: nextStepIndex,
          fallbackUserId: nextStep.userId,
        })

        for (const userId of nextAssignees) {
          await prisma.notification.create({
            data: {
              userId,
              title: 'طلب شراء بانتظار موافقتك',
              message: `طلب شراء ${purchaseRequest.requestNumber} (${getCategoryLabel(purchaseRequest.category)}) في مرحلة: ${nextStepName || nextStep.statusName}`,
              type: 'procurement_pending',
              relatedId: purchaseRequest.id,
              isRead: false
            }
          });
        }

        await createPurchaseRequestAuditLog(prisma as any, {
          requestId: purchaseRequest.id,
          actorUserId: session.user.id,
          action: 'STEP_APPROVED',
          message: `تمت الموافقة في خطوة: ${currentStepName}. تحول إلى: ${nextStepName || nextStep.statusName}${validatedData.comment ? ` - ${validatedData.comment}` : ''}`,
        })

        // Notify requester of progress
        await prisma.notification.create({
          data: {
            userId: purchaseRequest.requestedById,
            title: 'تقدم في طلب الشراء',
            message: `طلب الشراء ${purchaseRequest.requestNumber} تقدم إلى مرحلة: ${nextStepName || nextStep.statusName}`,
            type: 'procurement_updated',
            relatedId: purchaseRequest.id,
            isRead: false
          }
        });
      }
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error processing procurement workflow step:', error);
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
