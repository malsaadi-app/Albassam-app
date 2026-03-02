import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// POST /api/settings/org-structure/move-member
// Body: { employeeId, fromOrgUnitId, toOrgUnitId }
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const employeeId = String(body?.employeeId || '')
    const fromOrgUnitId = String(body?.fromOrgUnitId || '')
    const toOrgUnitId = String(body?.toOrgUnitId || '')

    if (!employeeId || !fromOrgUnitId || !toOrgUnitId) {
      return NextResponse.json({ error: 'employeeId, fromOrgUnitId, toOrgUnitId are required' }, { status: 400 })
    }
    if (fromOrgUnitId === toOrgUnitId) return NextResponse.json({ error: 'fromOrgUnitId cannot equal toOrgUnitId' }, { status: 400 })

    const [fromUnit, toUnit] = await Promise.all([
      prisma.orgUnit.findUnique({ where: { id: fromOrgUnitId }, select: { id: true, branchId: true } }),
      prisma.orgUnit.findUnique({ where: { id: toOrgUnitId }, select: { id: true, branchId: true } }),
    ])

    if (!fromUnit || !toUnit) return NextResponse.json({ error: 'Org unit not found' }, { status: 404 })
    if (fromUnit.branchId !== toUnit.branchId) return NextResponse.json({ error: 'Units must be in same branch' }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      // deactivate existing membership in from unit (if exists)
      await tx.orgUnitAssignment.updateMany({
        where: {
          employeeId,
          orgUnitId: fromOrgUnitId,
          assignmentType: 'FUNCTIONAL',
          role: 'MEMBER',
          active: true,
        },
        data: { active: false },
      })

      // upsert membership in target unit
      const existing = await tx.orgUnitAssignment.findFirst({
        where: {
          employeeId,
          orgUnitId: toOrgUnitId,
          assignmentType: 'FUNCTIONAL',
          role: 'MEMBER',
        },
        select: { id: true },
      })

      if (existing) {
        await tx.orgUnitAssignment.update({ where: { id: existing.id }, data: { active: true } })
      } else {
        await tx.orgUnitAssignment.create({
          data: {
            employeeId,
            orgUnitId: toOrgUnitId,
            assignmentType: 'FUNCTIONAL',
            role: 'MEMBER',
            active: true,
          },
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('move-member error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
