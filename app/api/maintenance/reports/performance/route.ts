import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { getMaintenanceAccess, isMaintenanceManager } from '@/lib/maintenance/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const access = await getMaintenanceAccess()
    if (!access.isAdmin && !isMaintenanceManager(access)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: any = {
      assignedToId: { not: null }
    }

    if (access.maintenanceTeam && !access.isAdmin) {
      where.type = access.maintenanceTeam === 'BUILDING' ? 'BUILDING' : 'ELECTRONICS'
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const grouped = await prisma.maintenanceRequest.groupBy({
      by: ['assignedToId'],
      where,
      _count: { _all: true },
      _avg: { laborHours: true, rating: true, totalCost: true }
    })

    const techIds = grouped.map((g) => g.assignedToId!).filter(Boolean)

    const techs = await prisma.employee.findMany({
      where: { id: { in: techIds } },
      select: { id: true, fullNameAr: true, employeeNumber: true, maintenanceRole: true, maintenanceTeam: true }
    })

    const byId = new Map(techs.map((t) => [t.id, t]))

    const rows = grouped
      .filter((g) => g.assignedToId)
      .map((g) => ({
        technician: byId.get(g.assignedToId!) ?? { id: g.assignedToId!, fullNameAr: 'غير معروف', employeeNumber: '-' },
        assignedRequests: g._count._all,
        avgLaborHours: g._avg.laborHours,
        avgRating: g._avg.rating,
        avgTotalCost: g._avg.totalCost
      }))
      .sort((a, b) => b.assignedRequests - a.assignedRequests)

    return NextResponse.json({ performance: rows })
  } catch (e) {
    console.error('GET /api/maintenance/reports/performance error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تقرير الأداء' }, { status: 500 })
  }
}
