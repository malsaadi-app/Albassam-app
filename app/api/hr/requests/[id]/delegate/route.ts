import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { createHRRequestAuditLog } from '@/lib/audit'

const schema = z
  .object({
    // Accept either a single userId or a list (pool)
    delegatedToUserId: z.string().min(1).optional(),
    delegatedToUserIds: z.array(z.string().min(1)).optional(),
    comment: z.string().optional(),
    _requireComment: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    const require = val._requireComment !== false
    if (require && (!val.comment || val.comment.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'سبب الإحالة مطلوب',
        path: ['comment'],
      })
    }
  })

// POST /api/hr/requests/[id]/delegate
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    const actorUserId = session.user.id

    const raw = await request.json()


    const hrRequest = await prisma.hRRequest.findUnique({
      where: { id },
      select: { id: true, type: true, employeeId: true, currentWorkflowStep: true }
    })

    if (!hrRequest) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    let requireComment = true
    try {
      const builderStep = await (await import('@/lib/hrWorkflowBuilderRouting')).getStepDefinitionFromBuilder({
        requestType: hrRequest.type,
        requesterUserId: hrRequest.employeeId,
        stepOrder: hrRequest.currentWorkflowStep ?? 0,
      })
      if (builderStep && typeof builderStep.requireComment === 'boolean') {
        requireComment = builderStep.requireComment
      }
    } catch {
      // ignore
    }

    const body = schema.parse({ ...raw, _requireComment: requireComment })

    const targetIds = (body.delegatedToUserIds && body.delegatedToUserIds.length ? body.delegatedToUserIds : body.delegatedToUserId ? [body.delegatedToUserId] : []).map(String)
    if (targetIds.length === 0) return NextResponse.json({ error: 'المستخدم المستلم مطلوب' }, { status: 400 })

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

    // Validate users exist
    const existingUsers = await prisma.user.findMany({ where: { id: { in: targetIds } }, select: { id: true } })
    const existingIds = new Set(existingUsers.map((u) => u.id))
    const validTargetIds = targetIds.filter((id) => existingIds.has(id))
    if (validTargetIds.length === 0) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 400 })

    const currentIndex = hrRequest.currentWorkflowStep ?? 0

    // Cancel previous delegations for this step
    await prisma.hRRequestDelegation.updateMany({
      where: { requestId: id, stepIndex: currentIndex, status: 'ACTIVE' },
      data: { status: 'CANCELLED' }
    })

    const delegations = await prisma.hRRequestDelegation.createMany({
      data: validTargetIds.map((delegatedToUserId) => ({
        requestId: id,
        delegatedToUserId,
        delegatedByUserId: actorUserId,
        stepIndex: currentIndex,
        comment: body.comment || '',
      })),
      skipDuplicates: true,
    })

    await createHRRequestAuditLog(prisma, {
      requestId: id,
      actorUserId: actorUserId,
      action: 'DELEGATION_CREATED',
      message: `تمت إحالة الطلب (Pool) لعدد ${validTargetIds.length} مع تعليق: ${body.comment}`
    })

    // Notify each target
    await prisma.notification.createMany({
      data: validTargetIds.map((userId) => ({
        userId,
        title: 'طلب محال لك',
        message: `تمت إحالة طلب HR لك. ملاحظة: ${body.comment}`,
        type: 'request_pending',
        relatedId: id,
        isRead: false,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({ ok: true, delegatedCount: delegations.count, delegatedToUserIds: validTargetIds })
  } catch (e: any) {
    console.error('POST /api/hr/requests/[id]/delegate error', e)
    return NextResponse.json({ error: e?.message || 'حدث خطأ' }, { status: 400 })
  }
}
