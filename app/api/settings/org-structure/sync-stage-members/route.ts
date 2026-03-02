import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// POST /api/settings/org-structure/sync-stage-members
// Body: { stageOrgUnitId: string }
// Sync employees -> ADMIN/MEMBER assignments for a STAGE org unit based on Employee.stage (legacy).
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const stageOrgUnitId = String(body?.stageOrgUnitId || '')
    if (!stageOrgUnitId) return NextResponse.json({ error: 'stageOrgUnitId is required' }, { status: 400 })

    const stageUnit = await prisma.orgUnit.findUnique({
      where: { id: stageOrgUnitId },
      select: { id: true, name: true, type: true, branchId: true, isActive: true },
    })

    if (!stageUnit) return NextResponse.json({ error: 'Stage org unit not found' }, { status: 404 })
    if (stageUnit.type !== 'STAGE') return NextResponse.json({ error: 'org unit must be STAGE' }, { status: 400 })

    // Find employees whose legacy stage.name matches this STAGE unit name
    const employees = await prisma.employee.findMany({
      where: {
        branchId: stageUnit.branchId,
        status: 'ACTIVE',
        stage: { is: { name: stageUnit.name } },
      },
      select: { id: true },
    })

    const employeeIds = employees.map((e) => e.id)

    // Deactivate existing ADMIN/MEMBER assignments for this STAGE unit
    await prisma.orgUnitAssignment.updateMany({
      where: { orgUnitId: stageUnit.id, assignmentType: 'ADMIN', role: 'MEMBER' },
      data: { active: false },
    })

    if (employeeIds.length) {
      await prisma.orgUnitAssignment.createMany({
        data: employeeIds.map((employeeId) => ({
          employeeId,
          orgUnitId: stageUnit.id,
          assignmentType: 'ADMIN',
          role: 'MEMBER',
          coverageScope: 'BRANCH',
          active: true,
          isPrimary: false,
        })),
        skipDuplicates: true,
      })

      await prisma.orgUnitAssignment.updateMany({
        where: { orgUnitId: stageUnit.id, assignmentType: 'ADMIN', role: 'MEMBER', employeeId: { in: employeeIds } },
        data: { active: true },
      })
    }

    return NextResponse.json({ ok: true, syncedCount: employeeIds.length })
  } catch (e) {
    console.error('sync-stage-members error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
