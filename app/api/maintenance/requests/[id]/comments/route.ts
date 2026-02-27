import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { canAccessRequest, getMaintenanceAccess, isMaintenanceManager, isMaintenanceTechnician } from '@/lib/maintenance/auth'
import { MaintenanceHistoryAction } from '@prisma/client'

const postSchema = z.object({
  comment: z.string().min(1),
  isInternal: z.boolean().optional()
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const access = await getMaintenanceAccess()

    const req = await prisma.maintenanceRequest.findUnique({ where: { id } })
    if (!req) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    if (!canAccessRequest(access, req)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const canSeeInternal = access.isAdmin || isMaintenanceManager(access) || isMaintenanceTechnician(access)

    const comments = await prisma.maintenanceComment.findMany({
      where: {
        requestId: id,
        ...(canSeeInternal ? {} : { isInternal: false })
      },
      include: {
        user: { select: { id: true, fullNameAr: true, fullNameEn: true, employeeNumber: true, maintenanceRole: true, maintenanceTeam: true } }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ comments })
  } catch (e) {
    console.error('GET /api/maintenance/requests/[id]/comments error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب التعليقات' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const access = await getMaintenanceAccess()
    if (!access.isAdmin && !access.employee) {
      return NextResponse.json({ error: 'لا يوجد ملف موظف مرتبط' }, { status: 403 })
    }

    const req = await prisma.maintenanceRequest.findUnique({ where: { id } })
    if (!req) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    if (!canAccessRequest(access, req)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = await request.json()
    const data = postSchema.parse(body)

    const actorId = access.employee!.id

    const internalRequested = data.isInternal === true
    const canPostInternal = access.isAdmin || isMaintenanceManager(access) || isMaintenanceTechnician(access)

    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.maintenanceComment.create({
        data: {
          requestId: id,
          userId: actorId,
          comment: data.comment,
          isInternal: internalRequested && canPostInternal
        },
        include: { user: { select: { id: true, fullNameAr: true, fullNameEn: true, employeeNumber: true } } }
      })

      await tx.maintenanceHistory.create({
        data: {
          requestId: id,
          action: 'COMMENT_ADDED' as MaintenanceHistoryAction,
          notes: data.comment,
          userId: actorId
        }
      })

      return c
    })

    return NextResponse.json({ comment })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: e.errors }, { status: 400 })
    }
    console.error('POST /api/maintenance/requests/[id]/comments error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة التعليق' }, { status: 500 })
  }
}
