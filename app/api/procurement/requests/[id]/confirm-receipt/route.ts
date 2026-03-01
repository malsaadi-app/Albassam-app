import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import prisma from '@/lib/prisma'

/**
 * POST /api/procurement/requests/[id]/confirm-receipt
 * Requester confirms delivery/receipt and closes the request.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession(await cookies())
  if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const pr = await prisma.purchaseRequest.findUnique({ where: { id } })
  if (!pr) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

  if (pr.requestedById !== session.user.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  if (pr.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: 'لا يمكن الإقفال في الحالة الحالية' }, { status: 400 })
  }

  const updated = await prisma.purchaseRequest.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      currentWorkflowStep: (pr.currentWorkflowStep ?? 0) + 1,
    },
  })

  return NextResponse.json(updated)
}
