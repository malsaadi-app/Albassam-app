import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET /api/hr/requests/[id]/action-context
// Returns whether the current user can process the current step + labels.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession(await cookies())

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const hrRequest = await prisma.hRRequest.findUnique({
      where: { id },
      select: { id: true, type: true, status: true, employeeId: true, currentWorkflowStep: true }
    })

    if (!hrRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    }

    const workflow = await prisma.hRRequestTypeWorkflow.findUnique({
      where: { requestType: hrRequest.type as any },
      include: { steps: { orderBy: { order: 'asc' } } }
    })

    const currentStepIndex = hrRequest.currentWorkflowStep ?? 0
    const currentStep = workflow?.steps?.[currentStepIndex]

    if (!workflow || !currentStep) {
      return NextResponse.json({
        canProcess: false,
        stepIndex: currentStepIndex,
        stepName: null,
        expectedLabel: null
      })
    }

    const routed = await (await import('@/lib/hrWorkflowRouting')).getApproverUserIdsForHRRequestStep({
      requestType: hrRequest.type,
      requesterUserId: hrRequest.employeeId,
      stepOrder: currentStep.order
    })

    const delegated = await prisma.hRRequestDelegation.findFirst({
      where: {
        requestId: id,
        stepIndex: currentStepIndex,
        status: 'ACTIVE',
        delegatedToUserId: session.user.id
      },
      select: { id: true }
    })

    const isOwner = hrRequest.employeeId === session.user.id

    return NextResponse.json({
      canProcess: routed.userIds.includes(session.user.id) || !!delegated,
      canResubmit: isOwner && (hrRequest as any).status === 'PENDING_REVIEW',
      stepIndex: currentStepIndex,
      stepName: currentStep.statusName,
      expectedLabel: routed.labelAr
    })
  } catch (e) {
    console.error('GET /api/hr/requests/[id]/action-context error', e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
