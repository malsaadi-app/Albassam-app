import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { canAccessRequest, canEditRequest, getMaintenanceAccess, isMaintenanceManager } from '@/lib/maintenance/auth'
import { MaintenanceHistoryAction, MaintenanceStatus } from '@prisma/client'

const patchSchema = z.object({
  category: z.string().min(1).optional(),
  priority: z.enum(['NORMAL', 'HIGH', 'EMERGENCY']).optional(),
  locationDetails: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  branchId: z.string().min(1).optional(),
  stageId: z.string().optional().nullable(),
  assetId: z.string().optional().nullable()
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const access = await getMaintenanceAccess()

    const req = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
        asset: true,
        requestedBy: { select: { id: true, fullNameAr: true, fullNameEn: true, employeeNumber: true, maintenanceRole: true, maintenanceTeam: true, userId: true } },
        assignedTo: { select: { id: true, fullNameAr: true, fullNameEn: true, employeeNumber: true, maintenanceRole: true, maintenanceTeam: true, userId: true } },
        assignedBy: { select: { id: true, fullNameAr: true, fullNameEn: true, employeeNumber: true } },
        completedBy: { select: { id: true, fullNameAr: true, fullNameEn: true, employeeNumber: true } },
        comments: {
          include: { user: { select: { id: true, fullNameAr: true, fullNameEn: true, employeeNumber: true, maintenanceRole: true, maintenanceTeam: true } } },
          orderBy: { createdAt: 'asc' }
        },
        history: {
          include: { user: { select: { id: true, fullNameAr: true, fullNameEn: true, employeeNumber: true, maintenanceRole: true, maintenanceTeam: true } } },
          orderBy: { createdAt: 'asc' }
        },
        parts: { orderBy: { createdAt: 'asc' } }
      }
    })

    if (!req) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    if (!canAccessRequest(access, req)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    return NextResponse.json({ request: req })
  } catch (e) {
    console.error('GET /api/maintenance/requests/[id] error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الطلب' }, { status: 500 })
  }
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

    const existing = await prisma.maintenanceRequest.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    if (!canEditRequest(access, existing)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = await request.json()
    const data = patchSchema.parse(body)

    const actorId = access.employee?.id
    if (!actorId) return NextResponse.json({ error: 'تعذر تحديد الموظف الحالي' }, { status: 403 })

    const updated = await prisma.$transaction(async (tx) => {
      const prevAssetId = existing.assetId

      const next = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          category: data.category,
          priority: data.priority as any,
          locationDetails: data.locationDetails,
          description: data.description,
          branchId: data.branchId,
          stageId: data.stageId === undefined ? undefined : (data.stageId ?? null),
          assetId: data.assetId === undefined ? undefined : (data.assetId ?? null)
        }
      })

      if (data.assetId !== undefined && data.assetId !== prevAssetId) {
        await tx.maintenanceHistory.create({
          data: {
            requestId: id,
            assetId: data.assetId ?? null,
            action: (data.assetId ? 'ASSET_LINKED' : 'ASSET_UNLINKED') as MaintenanceHistoryAction,
            oldValue: prevAssetId ?? undefined,
            newValue: data.assetId ?? undefined,
            notes: data.assetId ? 'تم ربط الأصل' : 'تم إزالة ربط الأصل',
            userId: actorId
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
    console.error('PATCH /api/maintenance/requests/[id] error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث الطلب' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const access = await getMaintenanceAccess()

    const existing = await prisma.maintenanceRequest.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const actorId = access.employee?.id

    const canDelete =
      access.isAdmin ||
      (actorId && existing.requestedById === actorId && existing.status === 'SUBMITTED')

    if (!canDelete) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    await prisma.maintenanceRequest.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/maintenance/requests/[id] error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الطلب' }, { status: 500 })
  }
}
