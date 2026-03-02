import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// POST /api/settings/org-structure/bulk-add-members
// Body: { employeeIds: string[], toOrgUnitId: string }
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const employeeIds = Array.isArray(body?.employeeIds) ? body.employeeIds.map(String) : []
    const toOrgUnitId = String(body?.toOrgUnitId || '')

    if (!toOrgUnitId || employeeIds.length === 0) {
      return NextResponse.json({ error: 'employeeIds and toOrgUnitId are required' }, { status: 400 })
    }

    const toUnit = await prisma.orgUnit.findUnique({ where: { id: toOrgUnitId }, select: { id: true, branchId: true } })
    if (!toUnit) return NextResponse.json({ error: 'Target org unit not found' }, { status: 404 })

    // Only allow employees from same branch
    const employees = await prisma.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true, branchId: true } })
    const validIds = employees.filter((e) => e.branchId === toUnit.branchId).map((e) => e.id)

    if (validIds.length === 0) return NextResponse.json({ ok: true, addedCount: 0 })

    const result = await prisma.orgUnitAssignment.createMany({
      data: validIds.map((employeeId) => ({
        employeeId,
        orgUnitId: toOrgUnitId,
        assignmentType: 'FUNCTIONAL',
        role: 'MEMBER',
        active: true,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({ ok: true, addedCount: result.count })
  } catch (e) {
    console.error('bulk-add-members error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
