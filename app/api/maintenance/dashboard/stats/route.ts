import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { getMaintenanceAccess, isMaintenanceManager, isMaintenanceTechnician } from '@/lib/maintenance/auth'
import { MaintenanceStatus } from '@prisma/client'

function buildWhere(access: Awaited<ReturnType<typeof getMaintenanceAccess>>) {
  const where: any = {}

  if (access.isAdmin) return where

  const emp = access.employee
  if (!emp) return { id: '__NO_EMP__' }

  if (isMaintenanceManager(access)) {
    if (access.maintenanceTeam) {
      where.type = access.maintenanceTeam === 'BUILDING' ? 'BUILDING' : 'ELECTRONICS'
    }
    return where
  }

  if (isMaintenanceTechnician(access)) {
    where.OR = [{ assignedToId: emp.id }, { requestedById: emp.id }]
    return where
  }

  where.requestedById = emp.id
  return where
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const access = await getMaintenanceAccess()
    const where = buildWhere(access)

    const now = new Date()
    const overdueThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const upcomingThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const [grouped, overdueCount, dueSoonAssets, recentRequests, recentHistory] = await Promise.all([
      prisma.maintenanceRequest.groupBy({
        by: ['status'],
        where,
        _count: { _all: true }
      }),
      prisma.maintenanceRequest.count({
        where: {
          ...where,
          createdAt: { lt: overdueThreshold },
          status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'REOPENED'] as MaintenanceStatus[] }
        }
      }),
      prisma.asset.count({
        where: {
          nextMaintenanceDate: { gte: now, lte: upcomingThreshold }
        }
      }),
      prisma.maintenanceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          requestNumber: true,
          status: true,
          priority: true,
          type: true,
          category: true,
          createdAt: true
        }
      }),
      prisma.maintenanceHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, fullNameAr: true, employeeNumber: true } },
          request: { select: { id: true, requestNumber: true } },
          asset: { select: { id: true, assetNumber: true, name: true } }
        }
      })
    ])

    const byStatus: Record<string, number> = {}
    for (const g of grouped) {
      byStatus[g.status] = g._count._all
    }

    return NextResponse.json({
      byStatus,
      overdueCount,
      dueSoonAssets,
      recentRequests,
      recentHistory
    })
  } catch (e) {
    console.error('GET /api/maintenance/dashboard/stats error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الإحصائيات' }, { status: 500 })
  }
}
