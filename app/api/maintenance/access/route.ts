import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { getMaintenanceAccess } from '@/lib/maintenance/auth'

// GET /api/maintenance/access
// Returns lightweight access context for UI clients (mobile/web).
export async function GET() {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const access = await getMaintenanceAccess()

    const forwarders = await prisma.maintenanceBranchForwarder.findMany({
      where: { userId: session.user.id },
      select: { branchId: true }
    })

    return NextResponse.json({
      isAdmin: access.isAdmin,
      employee: access.employee
        ? {
            id: access.employee.id,
            fullNameAr: access.employee.fullNameAr,
            fullNameEn: access.employee.fullNameEn,
            employeeNumber: access.employee.employeeNumber,
            maintenanceRole: access.employee.maintenanceRole,
            maintenanceTeam: access.employee.maintenanceTeam,
            branchId: access.employee.branchId,
            stageId: access.employee.stageId
          }
        : null,
      forwarderBranchIds: forwarders.map((f) => f.branchId)
    })
  } catch (e) {
    console.error('GET /api/maintenance/access error', e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
