import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { assetNumberFor, requestNumberFor } from '@/lib/maintenance/utils'
import { canAccessRequest, getMaintenanceAccess, isMaintenanceManager, isMaintenanceTechnician, teamForType } from '@/lib/maintenance/auth'
import { MaintenanceHistoryAction, MaintenancePriority, MaintenanceStatus, MaintenanceType } from '@prisma/client'

const createRequestSchema = z.object({
  type: z.enum(['BUILDING', 'ELECTRONICS']),
  kind: z.enum(['CORRECTIVE', 'EMERGENCY', 'PREVENTIVE']).optional(),
  category: z.string().min(1),
  priority: z.enum(['NORMAL', 'HIGH', 'EMERGENCY']).optional(),
  branchId: z.string().min(1),
  stageId: z.string().optional().nullable(),
  locationDetails: z.string().min(1),
  description: z.string().min(1),
  assetId: z.string().optional().nullable(),
  images: z.array(z.string().min(1)).optional()
})

// GET /api/maintenance/requests
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const access = await getMaintenanceAccess()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const branchId = searchParams.get('branchId')
    const q = searchParams.get('q')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    if (!access.isAdmin && !access.employee) {
      return NextResponse.json({ error: 'لا يوجد ملف موظف مرتبط بهذا المستخدم' }, { status: 403 })
    }

    const where: any = {}

    // Role-based visibility
    if (!access.isAdmin) {
      const empId = access.employee!.id

      if (isMaintenanceManager(access)) {
        if (access.maintenanceTeam) {
          where.type = access.maintenanceTeam === 'BUILDING' ? 'BUILDING' : 'ELECTRONICS'
        }
      } else if (isMaintenanceTechnician(access)) {
        where.OR = [{ assignedToId: empId }, { requestedById: empId }]
      } else {
        where.requestedById = empId
      }
    }

    if (status) where.status = status
    if (type) where.type = type
    if (priority) where.priority = priority
    if (branchId) where.branchId = branchId

    if (q && q.trim()) {
      const query = q.trim()
      where.AND = where.AND || []
      where.AND.push({
        OR: [
          { requestNumber: { contains: query } },
          { description: { contains: query } },
          { locationDetails: { contains: query } }
        ]
      })
    }

    const [items, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          branch: { select: { id: true, name: true } },
          stage: { select: { id: true, name: true } },
          asset: { select: { id: true, assetNumber: true, name: true } },
          requestedBy: { select: { id: true, fullNameAr: true, fullNameEn: true, employeeNumber: true } },
          assignedTo: { select: { id: true, fullNameAr: true, fullNameEn: true, employeeNumber: true } }
        }
      }),
      prisma.maintenanceRequest.count({ where })
    ])

    return NextResponse.json({
      requests: items,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    })
  } catch (e) {
    console.error('GET /api/maintenance/requests error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب طلبات الصيانة' }, { status: 500 })
  }
}

async function nextRequestNumber() {
  const year = new Date().getFullYear()
  const prefix = `REQ-${year}-`
  const count = await prisma.maintenanceRequest.count({
    where: { requestNumber: { startsWith: prefix } }
  })
  return requestNumberFor(year, count + 1)
}

// POST /api/maintenance/requests
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const access = await getMaintenanceAccess()
    if (!access.employee && !access.isAdmin) {
      return NextResponse.json({ error: 'لا يوجد ملف موظف مرتبط بهذا المستخدم' }, { status: 403 })
    }

    const body = await request.json()
    const data = createRequestSchema.parse(body)

    const requestedById = access.employee?.id
    if (!requestedById) {
      return NextResponse.json({ error: 'تعذر تحديد الموظف الحالي' }, { status: 403 })
    }

    const requestNumber = await nextRequestNumber()

    const created = await prisma.$transaction(async (tx) => {
      const req = await tx.maintenanceRequest.create({
        data: {
          requestNumber,
          type: data.type as MaintenanceType,
          kind: (data.kind as any) ?? 'CORRECTIVE',
          category: data.category,
          priority: (data.priority as MaintenancePriority) ?? 'NORMAL',
          status: 'SUBMITTED',
          branchId: data.branchId,
          stageId: data.stageId ?? null,
          locationDetails: data.locationDetails,
          description: data.description,
          imagesJson: data.images ? JSON.stringify(data.images) : null,
          assetId: data.assetId ?? null,
          requestedById
        }
      })

      await tx.maintenanceHistory.create({
        data: {
          requestId: req.id,
          action: 'CREATED' as MaintenanceHistoryAction,
          notes: 'تم إنشاء الطلب',
          userId: requestedById
        }
      })

      if (req.assetId) {
        await tx.maintenanceHistory.create({
          data: {
            requestId: req.id,
            assetId: req.assetId,
            action: 'ASSET_LINKED' as MaintenanceHistoryAction,
            notes: 'تم ربط أصل بالطلب',
            userId: requestedById
          }
        })
      }

      return req
    })

    return NextResponse.json({ request: created }, { status: 201 })
  } catch (e: any) {
    if (e?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: e.errors }, { status: 400 })
    }
    console.error('POST /api/maintenance/requests error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء طلب الصيانة' }, { status: 500 })
  }
}
