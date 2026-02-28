import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { createHRRequestAuditLog } from '@/lib/audit'

const schema = z
  .object({
    target: z.enum(['REQUESTER', 'PREVIOUS_STEP']),
    comment: z.string().min(1, 'سبب الإرجاع مطلوب')
  })

// POST /api/hr/requests/[id]/send-back
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const body = schema.parse(await request.json())

    const hrRequest = await prisma.hRRequest.findUnique({
      where: { id },
      include: { employee: { select: { id: true, displayName: true } } }
    })

    if (!hrRequest) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    // Must be able to process current step OR admin
    if (session.user.role !== 'ADMIN') {
      const workflow = await prisma.hRRequestTypeWorkflow.findUnique({
        where: { requestType: hrRequest.type as any },
        include: { steps: { orderBy: { order: 'asc' } } }
      })

      const currentIndex = hrRequest.currentWorkflowStep ?? 0
      const currentStep = workflow?.steps?.[currentIndex]
      if (!currentStep) return NextResponse.json({ error: 'خطوة غير صحيحة' }, { status: 400 })

      const routed = await (await import('@/lib/hrWorkflowRouting')).getApproverUserIdsForHRRequestStep({
        requestType: hrRequest.type,
        requesterUserId: hrRequest.employeeId,
        stepOrder: currentStep.order
      })

      if (!routed.userIds.includes(session.user.id)) {
        return NextResponse.json({ error: 'غير مصرح لك بإرجاع هذا الطلب' }, { status: 403 })
      }
    }

    const currentIndex = hrRequest.currentWorkflowStep ?? 0

    let nextIndex = currentIndex
    if (body.target === 'PREVIOUS_STEP') {
      nextIndex = Math.max(0, currentIndex - 1)
    }

    // For requester return, keep currentIndex but mark as PENDING_REVIEW so requester can resubmit.
    const status = body.target === 'REQUESTER' ? 'PENDING_REVIEW' : 'PENDING_APPROVAL'

    const updated = await prisma.hRRequest.update({
      where: { id },
      data: {
        status,
        currentWorkflowStep: nextIndex,
        reviewComment: body.comment,
        reviewedBy: session.user.id,
        reviewedAt: new Date()
      }
    })

    await createHRRequestAuditLog(prisma, {
      requestId: id,
      actorUserId: session.user.id,
      action: 'HR_RETURNED',
      message: `تم إرجاع الطلب إلى ${body.target === 'REQUESTER' ? 'مقدم الطلب' : 'الخطوة السابقة'}: ${body.comment}`
    })

    // Notify requester always
    await prisma.notification.create({
      data: {
        userId: hrRequest.employeeId,
        title: 'تم إرجاع الطلب',
        message: `تم إرجاع طلبك لملاحظات: ${body.comment}`,
        type: 'request_updated',
        relatedId: hrRequest.id,
        isRead: false
      }
    })

    return NextResponse.json(updated)
  } catch (e: any) {
    console.error('POST /api/hr/requests/[id]/send-back error', e)
    return NextResponse.json({ error: e?.message || 'حدث خطأ' }, { status: 400 })
  }
}
