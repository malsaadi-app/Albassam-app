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
    const { searchParams } = new URL(request.url)

    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const branchId = searchParams.get('branchId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const where: any = buildWhere(access)
    if (branchId) where.branchId = branchId
    if (type) where.type = type
    if (status) where.status = status

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        branch: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, fullNameAr: true, employeeNumber: true } },
        assignedTo: { select: { id: true, fullNameAr: true, employeeNumber: true } }
      }
    })

    return NextResponse.json({ requests })
  } catch (e) {
    console.error('GET /api/maintenance/reports/requests error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تقرير الطلبات' }, { status: 500 })
  }
}
