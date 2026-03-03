import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// GET /api/procurement/requests/:id/audit
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(await cookies())
  if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { id } = await params

  const pr = await prisma.purchaseRequest.findUnique({
    where: { id },
    select: { id: true, requestedById: true, category: true, currentWorkflowStep: true },
  })
  if (!pr) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })

  // Allow: admin OR requester OR current-step assignee
  if (session.user.role !== 'ADMIN' && pr.requestedById !== session.user.id) {
    try {
      const { resolveProcurementStepAssignees } = await import('@/lib/procurementWorkflowRouting')
      const workflow = await prisma.procurementCategoryWorkflow.findUnique({
        where: { category: pr.category },
        include: { steps: { orderBy: { order: 'asc' } } },
      })
      const stepIndex = pr.currentWorkflowStep ?? 0
      const fallbackUserId = workflow?.steps?.[stepIndex]?.userId
      const allowed = await resolveProcurementStepAssignees({
        requestedByUserId: pr.requestedById,
        workflowCategory: pr.category,
        stepIndex,
        fallbackUserId: fallbackUserId || null,
      })
      if (!allowed.includes(session.user.id)) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }
  }

  const logs = await (prisma as any).purchaseRequestAuditLog.findMany({
    where: { requestId: id },
    orderBy: { createdAt: 'asc' },
    include: { actor: { select: { id: true, username: true, displayName: true, role: true } } },
  })

  return NextResponse.json({ logs })
}
