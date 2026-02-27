import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { getMaintenanceAccess, isMaintenanceManager, isMaintenanceTechnician } from '@/lib/maintenance/auth'

function buildWhere(access: Awaited<ReturnType<typeof getMaintenanceAccess>>) {
  const where: any = {}
  if (access.isAdmin) return where

  const emp = access.employee
  if (!emp) return { id: '__NO_EMP__' }

  if (isMaintenanceManager(access)) {
    if (access.maintenanceTeam) where.type = access.maintenanceTeam === 'BUILDING' ? 'BUILDING' : 'ELECTRONICS'
    return where
  }

  if (isMaintenanceTechnician(access)) {
    where.OR = [{ assignedToId: emp.id }, { requestedById: emp.id }]
    return where
  }

  where.requestedById = emp.id
  return where
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const access = await getMaintenanceAccess()
    const where = buildWhere(access)

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const rows = await prisma.maintenanceRequest.groupBy({
      by: ['category'],
      where,
      _count: { _all: true }
    })

    const sorted = rows.sort((a, b) => b._count._all - a._count._all).slice(0, 20)

    return NextResponse.json({ commonIssues: sorted.map((r) => ({ category: r.category, count: r._count._all })) })
  } catch (e) {
    console.error('GET /api/maintenance/reports/common-issues error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تقرير الأعطال' }, { status: 500 })
  }
}
