import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/session';


// Validation schema
const processStepSchema = z.object({
  action: z.enum(['approve', 'reject']),
  comment: z.string().optional()
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

    // Verify user is authorized for this step
    if (currentStep.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'غير مصرح لك بمعالجة هذه الخطوة' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = processStepSchema.parse(body);

    let updatedRequest;

    if (validatedData.action === 'reject') {
      // Reject the request immediately
      updatedRequest = await prisma.purchaseRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewNotes: validatedData.comment || null,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          rejectedReason: `رفض في مرحلة: ${currentStep.statusName}${validatedData.comment ? ` - ${validatedData.comment}` : ''}`
        }
      });

      // Notify requester
      await prisma.notification.create({
        data: {
          userId: purchaseRequest.requestedById,
          title: 'طلب شراء مرفوض',
          message: `تم رفض طلب الشراء ${purchaseRequest.requestNumber} في مرحلة: ${currentStep.statusName}`,
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
        // Final approval - complete the request
        updatedRequest = await prisma.purchaseRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvalNotes: validatedData.comment || null,
            approvedById: session.user.id,
            approvedAt: new Date(),
            currentWorkflowStep: nextStepIndex
          }
        });

        // Notify requester
        await prisma.notification.create({
          data: {
            userId: purchaseRequest.requestedById,
            title: 'طلب شراء موافق عليه',
            message: `تمت الموافقة على طلب الشراء ${purchaseRequest.requestNumber}`,
            type: 'procurement_approved',
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

        // Notify next responsible person
        await prisma.notification.create({
          data: {
            userId: nextStep.userId,
            title: 'طلب شراء بانتظار موافقتك',
            message: `طلب شراء ${purchaseRequest.requestNumber} (${getCategoryLabel(purchaseRequest.category)}) في مرحلة: ${nextStep.statusName}`,
            type: 'procurement_pending',
            relatedId: purchaseRequest.id,
            isRead: false
          }
        });

        // Notify requester of progress
        await prisma.notification.create({
          data: {
            userId: purchaseRequest.requestedById,
            title: 'تقدم في طلب الشراء',
            message: `طلب الشراء ${purchaseRequest.requestNumber} تقدم إلى مرحلة: ${nextStep.statusName}`,
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
