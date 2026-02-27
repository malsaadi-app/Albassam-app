import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'
import { getMaintenanceAccess, isMaintenanceManager } from '@/lib/maintenance/auth'
import { Prisma } from '@prisma/client'

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const access = await getMaintenanceAccess()
    if (!access.isAdmin && !isMaintenanceManager(access)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const conditions: Prisma.Sql[] = [Prisma.sql`status = 'COMPLETED'`]
    if (access.maintenanceTeam && !access.isAdmin) {
      const type = access.maintenanceTeam === 'BUILDING' ? 'BUILDING' : 'ELECTRONICS'
      conditions.push(Prisma.sql`type = ${type}`)
    }

    const whereSql = Prisma.sql`${Prisma.join(conditions, ' AND ')}`

    const rows = await prisma.$queryRaw<Array<{ ym: string; total: number; count: number }>>(Prisma.sql`
      SELECT
        strftime('%Y-%m', createdAt) AS ym,
        SUM(COALESCE(totalCost, 0)) AS total,
        COUNT(*) AS count
      FROM MaintenanceRequest
      WHERE ${whereSql}
      GROUP BY ym
      ORDER BY ym DESC
      LIMIT 12
    `)

    return NextResponse.json({ costs: rows.reverse() })
  } catch (e) {
    console.error('GET /api/maintenance/reports/costs error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تقرير التكاليف' }, { status: 500 })
  }
}
