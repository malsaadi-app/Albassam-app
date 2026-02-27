import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { getMaintenanceAccess } from '@/lib/maintenance/auth'
import { MaintenanceHistoryAction } from '@prisma/client'

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  ratingComment: z.string().optional()
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const access = await getMaintenanceAccess()
    if (!access.employee && !access.isAdmin) {
      return NextResponse.json({ error: 'لا يوجد ملف موظف مرتبط' }, { status: 403 })
    }

    const req = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { requestedBy: true }
    })

    if (!req) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const actorId = access.employee?.id
    if (!actorId) return NextResponse.json({ error: 'تعذر تحديد الموظف الحالي' }, { status: 403 })

    if (!access.isAdmin && req.requestedById !== actorId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    if (req.status !== 'COMPLETED' && req.status !== 'COMPLETED_PENDING_CONFIRMATION') {
      return NextResponse.json({ error: 'لا يمكن التقييم قبل إكمال الطلب' }, { status: 400 })
    }

    const body = await request.json()
    const data = schema.parse(body)

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          rating: data.rating,
          ratingComment: data.ratingComment ?? null
        }
      })

      await tx.maintenanceHistory.create({
        data: {
          requestId: id,
          action: 'RATED' as MaintenanceHistoryAction,
          notes: data.ratingComment ? `Rating: ${data.rating} - ${data.ratingComment}` : `Rating: ${data.rating}`,
          userId: actorId
        }
      })

      return next
    })

    return NextResponse.json({ request: updated })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: e.errors }, { status: 400 })
    }
    console.error('POST /api/maintenance/requests/[id]/rating error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ التقييم' }, { status: 500 })
  }
}
