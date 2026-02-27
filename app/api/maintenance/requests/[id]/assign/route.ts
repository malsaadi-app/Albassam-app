import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { canAccessRequest, canAssign, getMaintenanceAccess, teamForType } from '@/lib/maintenance/auth'
import { MaintenanceHistoryAction } from '@prisma/client'

const schema = z.object({
  assignedToId: z.string().min(1),
  notes: z.string().optional()
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      include: { requestedBy: true }
    })
    if (!req) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    if (!canAssign(access, req.type)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const assignedTo = await prisma.employee.findUnique({ where: { id: data.assignedToId } })
    if (!assignedTo) return NextResponse.json({ error: 'الفني غير موجود' }, { status: 404 })

    // If assigner has a team, ensure assigned technician is in same team
    if (access.maintenanceTeam && assignedTo.maintenanceTeam && access.maintenanceTeam !== assignedTo.maintenanceTeam) {
      return NextResponse.json({ error: 'لا يمكن تعيين هذا الطلب لفني من فريق مختلف' }, { status: 400 })
    }

    const actorId = access.employee!.id

    const updated = await prisma.$transaction(async (tx) => {
      const prevAssigned = req.assignedToId

      const next = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          assignedToId: data.assignedToId,
          assignedAt: new Date(),
          assignedById: actorId,
          status: req.status === 'SUBMITTED' ? 'ASSIGNED' : (req.status === 'UNDER_REVIEW' ? 'ASSIGNED' : req.status)
        }
      })

      await tx.maintenanceHistory.create({
        data: {
          requestId: id,
          action: 'ASSIGNED' as MaintenanceHistoryAction,
          oldValue: prevAssigned ?? undefined,
          newValue: data.assignedToId,
          notes: data.notes,
          userId: actorId
        }
      })

      // Notification to technician (if has userId)
      if (assignedTo.userId) {
        await tx.notification.create({
          data: {
            userId: assignedTo.userId,
            title: 'تم تعيين طلب صيانة لك',
            message: `تم تعيين الطلب ${req.requestNumber} لك.`,
            type: 'MAINTENANCE_ASSIGNED',
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
    console.error('POST /api/maintenance/requests/[id]/assign error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء التعيين' }, { status: 500 })
  }
}
