import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { createHRRequestAuditLog } from '@/lib/audit'

const schema = z.object({
  delegatedToUserId: z.string().min(1),
  comment: z.string().min(1, 'سبب الإحالة مطلوب')
})

// POST /api/hr/requests/[id]/delegate
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const body = schema.parse(await request.json())

    const hrRequest = await prisma.hRRequest.findUnique({
      where: { id },
      select: { id: true, type: true, employeeId: true, currentWorkflowStep: true }
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
        return NextResponse.json({ error: 'غير مصرح لك بإحالة هذا الطلب' }, { status: 403 })
      }
    }

    // Validate user exists
    const toUser = await prisma.user.findUnique({ where: { id: body.delegatedToUserId }, select: { id: true } })
    if (!toUser) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 400 })

    const currentIndex = hrRequest.currentWorkflowStep ?? 0

    // Cancel previous delegations for this step
    await prisma.hRRequestDelegation.updateMany({
      where: { requestId: id, stepIndex: currentIndex, status: 'ACTIVE' },
      data: { status: 'CANCELLED' }
    })

    const delegation = await prisma.hRRequestDelegation.create({
      data: {
        requestId: id,
        delegatedToUserId: body.delegatedToUserId,
        delegatedByUserId: session.user.id,
        stepIndex: currentIndex,
        comment: body.comment,
      }
    })

    await createHRRequestAuditLog(prisma, {
      requestId: id,
      actorUserId: session.user.id,
      action: 'DELEGATION_CREATED',
      message: `تمت إحالة الطلب لشخص آخر مع تعليق: ${body.comment}`
    })

    await prisma.notification.create({
      data: {
        userId: body.delegatedToUserId,
        title: 'طلب محال لك',
        message: `تمت إحالة طلب HR لك. ملاحظة: ${body.comment}`,
        type: 'request_pending',
        relatedId: id,
        isRead: false
      }
    })

    return NextResponse.json({ ok: true, delegation })
  } catch (e: any) {
    console.error('POST /api/hr/requests/[id]/delegate error', e)
    return NextResponse.json({ error: e?.message || 'حدث خطأ' }, { status: 400 })
  }
}
