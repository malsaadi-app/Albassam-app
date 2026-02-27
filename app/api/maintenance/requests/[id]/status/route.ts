import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { canUpdateStatus, getMaintenanceAccess, isMaintenanceManager, isMaintenanceTechnician } from '@/lib/maintenance/auth'
import { MaintenanceHistoryAction, MaintenanceStatus } from '@prisma/client'

const schema = z.object({
  status: z.enum([
    'SUBMITTED',
    'UNDER_REVIEW',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED_PENDING_CONFIRMATION',
    'COMPLETED',
    'CANCELLED',
    'REJECTED',
    'ON_HOLD',
    'REOPENED'
  ]),
  notes: z.string().optional()
})

const transitions: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['ASSIGNED', 'REJECTED', 'ON_HOLD', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED_PENDING_CONFIRMATION', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
  COMPLETED_PENDING_CONFIRMATION: ['COMPLETED', 'REOPENED'],
  COMPLETED: ['REOPENED'],
  CANCELLED: ['REOPENED'],
  REJECTED: ['REOPENED'],
  ON_HOLD: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
  REOPENED: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED']
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const access = await getMaintenanceAccess()
    if (!access.isAdmin && !access.employee) {
      return NextResponse.json({ error: 'لا يوجد ملف موظف مرتبط' }, { status: 403 })
    }

    const body = await request.json()
    const data = schema.parse(body)

    const req = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        requestedBy: true,
        assignedTo: true
      }
    })
    if (!req) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    if (!canUpdateStatus(access, req)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const actorId = access.employee!.id

    // Special rule: requester can only cancel/reopen
    const isRequester = req.requestedById === actorId
    const isMgrOrTech = access.isAdmin || isMaintenanceManager(access) || isMaintenanceTechnician(access)
    if (isRequester && !isMgrOrTech) {
      if (data.status !== 'CANCELLED' && data.status !== 'REOPENED') {
        return NextResponse.json({ error: 'يمكنك فقط إلغاء الطلب أو إعادة فتحه' }, { status: 403 })
      }
    }

    const allowed = transitions[req.status]
    if (allowed && !allowed.includes(data.status as any)) {
      return NextResponse.json({ error: `الانتقال غير مسموح من ${req.status} إلى ${data.status}` }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: data.status as any
        }
      })

      await tx.maintenanceHistory.create({
        data: {
          requestId: id,
          action: 'STATUS_CHANGED' as MaintenanceHistoryAction,
          oldValue: req.status,
          newValue: data.status,
          notes: data.notes,
          userId: actorId
        }
      })

      // Notify requester (if has a linked userId)
      if (req.requestedBy.userId && req.requestedBy.userId !== access.sessionUserId) {
        await tx.notification.create({
          data: {
            userId: req.requestedBy.userId,
            title: 'تحديث على طلب الصيانة',
            message: `تم تحديث حالة الطلب ${req.requestNumber} إلى ${data.status}.`,
            type: 'MAINTENANCE_STATUS',
            relatedId: id,
            isRead: false
          }
        })
      }

      return next
    })

    return NextResponse.json({ request: updated })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: e.errors }, { status: 400 })
    }
    console.error('PATCH /api/maintenance/requests/[id]/status error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث الحالة' }, { status: 500 })
  }
}
