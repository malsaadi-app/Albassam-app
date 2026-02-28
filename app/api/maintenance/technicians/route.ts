import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import prisma from '@/lib/prisma'
import { getMaintenanceAccess, isMaintenanceManager } from '@/lib/maintenance/auth'

// GET /api/maintenance/technicians
// For maintenance managers (and admins) to pick a technician for assignment.
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const access = await getMaintenanceAccess()
    const canList = access.isAdmin || isMaintenanceManager(access)
    if (!canList) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()

    const where: any = {
      maintenanceRole: 'TECHNICIAN'
    }

    // If manager has a team, limit to same team.
    if (!access.isAdmin && access.maintenanceTeam) {
      where.maintenanceTeam = access.maintenanceTeam
    }

    if (q) {
      where.OR = [
        { fullNameAr: { contains: q } },
        { fullNameEn: { contains: q } },
        { employeeNumber: { contains: q } }
      ]
    }

    const technicians = await prisma.employee.findMany({
      where,
      orderBy: [{ fullNameAr: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        fullNameAr: true,
        fullNameEn: true,
        employeeNumber: true,
        maintenanceTeam: true
      }
    })

    return NextResponse.json({ technicians })
  } catch (e) {
    console.error('GET /api/maintenance/technicians error', e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
