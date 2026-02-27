import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { assetNumberFor } from '@/lib/maintenance/utils'
import { getMaintenanceAccess, isMaintenanceManager } from '@/lib/maintenance/auth'
import { AssetCategory, AssetStatus } from '@prisma/client'

const createSchema = z.object({
  type: z.string().min(1),
  category: z.enum(['ELECTRONICS', 'BUILDING_EQUIPMENT']),
  name: z.string().min(1),
  serialNumber: z.string().optional().nullable(),
  branchId: z.string().min(1),
  stageId: z.string().optional().nullable(),
  locationDetails: z.string().min(1),
  purchaseDate: z.string().optional().nullable(),
  warrantyStart: z.string().optional().nullable(),
  warrantyEnd: z.string().optional().nullable(),
  purchasePrice: z.number().optional().nullable(),
  status: z.enum(['GOOD', 'NEEDS_MAINTENANCE', 'BROKEN', 'OUT_OF_SERVICE']).optional(),
  maintenanceInterval: z.number().int().positive().optional().nullable(),
  nextMaintenanceDate: z.string().optional().nullable()
})

async function nextAssetNumber() {
  const year = new Date().getFullYear()
  const prefix = `AST-${year}-`
  const count = await prisma.asset.count({ where: { assetNumber: { startsWith: prefix } } })
  return assetNumberFor(year, count + 1)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const access = await getMaintenanceAccess()

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const branchId = searchParams.get('branchId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Assets: managers/admin can view; regular employees can still view for autocomplete
    if (!access.isAdmin && !access.employee) {
      return NextResponse.json({ error: 'لا يوجد ملف موظف مرتبط' }, { status: 403 })
    }

    const where: any = {}
    if (branchId) where.branchId = branchId
    if (category) where.category = category
    if (status) where.status = status

    if (q && q.trim()) {
      const query = q.trim()
      where.OR = [
        { assetNumber: { contains: query } },
        { name: { contains: query } },
        { serialNumber: { contains: query } }
      ]
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          branch: { select: { id: true, name: true } },
          stage: { select: { id: true, name: true } }
        }
      }),
      prisma.asset.count({ where })
    ])

    return NextResponse.json({ assets, pagination: { total, page, limit, pages: Math.ceil(total / limit) } })
  } catch (e) {
    console.error('GET /api/maintenance/assets error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الأصول' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const access = await getMaintenanceAccess()
    if (!access.isAdmin && !isMaintenanceManager(access)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = await request.json()
    const data = createSchema.parse(body)

    const assetNumber = await nextAssetNumber()

    const asset = await prisma.asset.create({
      data: {
        assetNumber,
        type: data.type,
        category: data.category as AssetCategory,
        name: data.name,
        serialNumber: data.serialNumber ?? null,
        branchId: data.branchId,
        stageId: data.stageId ?? null,
        locationDetails: data.locationDetails,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        warrantyStart: data.warrantyStart ? new Date(data.warrantyStart) : null,
        warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : null,
        purchasePrice: data.purchasePrice ?? null,
        status: (data.status as AssetStatus) ?? 'GOOD',
        maintenanceInterval: data.maintenanceInterval ?? null,
        nextMaintenanceDate: data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : null
      }
    })

    return NextResponse.json({ asset }, { status: 201 })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: e.errors }, { status: 400 })
    }
    console.error('POST /api/maintenance/assets error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الأصل' }, { status: 500 })
  }
}
