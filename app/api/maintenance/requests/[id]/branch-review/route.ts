import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { getBranchForwarderUserId } from '@/lib/maintenance/routing'
import { getMaintenanceAccess } from '@/lib/maintenance/auth'
import { MaintenanceHistoryAction } from '@prisma/client'

// POST /api/maintenance/requests/[id]/branch-review
// Body: { action: 'approve'|'reject', comment?: string }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const action = String(body?.action || '')
    const comment = body?.comment ? String(body.comment) : null

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'إجراء غير صحيح' }, { status: 400 })
    }

    if (action === 'reject' && (!comment || comment.trim().length === 0)) {
      return NextResponse.json({ error: 'سبب الرفض مطلوب' }, { status: 400 })
    }

    const access = await getMaintenanceAccess()

    const req = await prisma.maintenanceRequest.findUnique({
      where: { id },
      select: { id: true, branchId: true, status: true, requestedById: true }
    })

    if (!req) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    if (req.status !== 'SUBMITTED') {
      return NextResponse.json({ error: 'لا يمكن تدقيق هذا الطلب' }, { status: 400 })
    }

    // Only branch forwarder (or admin) can approve/reject at this stage
    if (!access.isAdmin) {
      const forwarderUserId = await getBranchForwarderUserId(req.branchId)
      if (!forwarderUserId || forwarderUserId !== session.user.id) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
      }
    }

    const nextStatus = action === 'approve' ? 'UNDER_REVIEW' : 'REJECTED'

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.maintenanceRequest.update({
        where: { id },
        data: { status: nextStatus }
      })

      // history: we store comment as notes
      await tx.maintenanceHistory.create({
        data: {
          requestId: id,
          action: 'STATUS_CHANGED' as MaintenanceHistoryAction,
          oldValue: req.status,
          newValue: nextStatus,
          notes: comment || (action === 'approve' ? 'اعتماد الفرع' : 'رفض الفرع'),
          userId: access.employee?.id ?? req.requestedById
        }
      })

      return u
    })

    return NextResponse.json({ success: true, request: updated })
  } catch (e) {
    console.error('POST /api/maintenance/requests/[id]/branch-review error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تدقيق الطلب' }, { status: 500 })
  }
}
