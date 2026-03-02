import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// POST /api/settings/org-structure/bulk-move-members
// Body: { branchId: string, employeeIds: string[], toOrgUnitId: string }
// Move = deactivate all active FUNCTIONAL/MEMBER assignments for these employees within the branch, then add membership to target unit.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const branchId = String(body?.branchId || '')
    const employeeIds = Array.isArray(body?.employeeIds) ? body.employeeIds.map(String) : []
    const toOrgUnitId = String(body?.toOrgUnitId || '')

    if (!branchId || !toOrgUnitId || employeeIds.length === 0) {
      return NextResponse.json({ error: 'branchId, employeeIds and toOrgUnitId are required' }, { status: 400 })
    }

    const toUnit = await prisma.orgUnit.findUnique({ where: { id: toOrgUnitId }, select: { id: true, branchId: true } })
    if (!toUnit) return NextResponse.json({ error: 'Target org unit not found' }, { status: 404 })
    if (toUnit.branchId !== branchId) return NextResponse.json({ error: 'Target unit must be in same branch' }, { status: 400 })

    // Only allow employees from same branch
    const employees = await prisma.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true, branchId: true } })
    const validIds = employees.filter((e) => e.branchId === branchId).map((e) => e.id)

    if (validIds.length === 0) return NextResponse.json({ ok: true, movedCount: 0 })

    await prisma.$transaction(async (tx) => {
      await tx.orgUnitAssignment.updateMany({
        where: {
          employeeId: { in: validIds },
          active: true,
          assignmentType: 'FUNCTIONAL',
          role: 'MEMBER',
          orgUnit: { branchId },
        },
        data: { active: false },
      })

      await tx.orgUnitAssignment.createMany({
        data: validIds.map((employeeId) => ({
          employeeId,
          orgUnitId: toOrgUnitId,
          assignmentType: 'FUNCTIONAL',
          role: 'MEMBER',
          active: true,
        })),
        skipDuplicates: true,
      })

      // ensure target memberships are active (if existed inactive)
      await tx.orgUnitAssignment.updateMany({
        where: {
          employeeId: { in: validIds },
          orgUnitId: toOrgUnitId,
          assignmentType: 'FUNCTIONAL',
          role: 'MEMBER',
        },
        data: { active: true },
      })
    })

    return NextResponse.json({ ok: true, movedCount: validIds.length })
  } catch (e) {
    console.error('bulk-move-members error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
