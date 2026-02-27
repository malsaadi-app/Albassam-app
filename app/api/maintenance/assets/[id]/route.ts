import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { getMaintenanceAccess, isMaintenanceManager } from '@/lib/maintenance/auth'

const patchSchema = z.object({
  type: z.string().min(1).optional(),
  category: z.enum(['ELECTRONICS', 'BUILDING_EQUIPMENT']).optional(),
  name: z.string().min(1).optional(),
  serialNumber: z.string().optional().nullable(),
  branchId: z.string().min(1).optional(),
  stageId: z.string().optional().nullable(),
  locationDetails: z.string().min(1).optional(),
  purchaseDate: z.string().optional().nullable(),
  warrantyStart: z.string().optional().nullable(),
  warrantyEnd: z.string().optional().nullable(),
  purchasePrice: z.number().optional().nullable(),
  status: z.enum(['GOOD', 'NEEDS_MAINTENANCE', 'BROKEN', 'OUT_OF_SERVICE']).optional(),
  maintenanceInterval: z.number().int().positive().optional().nullable(),
  nextMaintenanceDate: z.string().optional().nullable()
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const access = await getMaintenanceAccess()
    if (!access.isAdmin && !access.employee) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            requestedBy: { select: { id: true, fullNameAr: true, employeeNumber: true } },
            assignedTo: { select: { id: true, fullNameAr: true, employeeNumber: true } }
          }
        },
        maintenanceHistory: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: { user: { select: { id: true, fullNameAr: true, employeeNumber: true } } }
        }
      }
    })

    if (!asset) return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 })

    return NextResponse.json({ asset })
  } catch (e) {
    console.error('GET /api/maintenance/assets/[id] error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الأصل' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const access = await getMaintenanceAccess()
    if (!access.isAdmin && !isMaintenanceManager(access)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = await request.json()
    const data = patchSchema.parse(body)

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        type: data.type,
        category: data.category as any,
        name: data.name,
        serialNumber: data.serialNumber === undefined ? undefined : (data.serialNumber ?? null),
        branchId: data.branchId,
        stageId: data.stageId === undefined ? undefined : (data.stageId ?? null),
        locationDetails: data.locationDetails,
        purchaseDate: data.purchaseDate === undefined ? undefined : (data.purchaseDate ? new Date(data.purchaseDate) : null),
        warrantyStart: data.warrantyStart === undefined ? undefined : (data.warrantyStart ? new Date(data.warrantyStart) : null),
        warrantyEnd: data.warrantyEnd === undefined ? undefined : (data.warrantyEnd ? new Date(data.warrantyEnd) : null),
        purchasePrice: data.purchasePrice === undefined ? undefined : (data.purchasePrice ?? null),
        status: data.status as any,
        maintenanceInterval: data.maintenanceInterval === undefined ? undefined : (data.maintenanceInterval ?? null),
        nextMaintenanceDate: data.nextMaintenanceDate === undefined ? undefined : (data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : null)
      }
    })

    return NextResponse.json({ asset })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: e.errors }, { status: 400 })
    }
    console.error('PATCH /api/maintenance/assets/[id] error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث الأصل' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const access = await getMaintenanceAccess()
    if (!access.isAdmin && !isMaintenanceManager(access)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    await prisma.asset.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/maintenance/assets/[id] error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الأصل' }, { status: 500 })
  }
}
