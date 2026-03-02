import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// POST /api/settings/org-structure/merge
// Body: { fromOrgUnitId, toOrgUnitId }
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const { fromOrgUnitId, toOrgUnitId } = body || {}
    if (!fromOrgUnitId || !toOrgUnitId) {
      return NextResponse.json({ error: 'fromOrgUnitId and toOrgUnitId are required' }, { status: 400 })
    }
    if (fromOrgUnitId === toOrgUnitId) {
      return NextResponse.json({ error: 'Cannot merge a unit into itself' }, { status: 400 })
    }

    const [fromUnit, toUnit] = await Promise.all([
      prisma.orgUnit.findUnique({ where: { id: String(fromOrgUnitId) } }),
      prisma.orgUnit.findUnique({ where: { id: String(toOrgUnitId) } }),
    ])

    if (!fromUnit || !toUnit) return NextResponse.json({ error: 'Org unit not found' }, { status: 404 })
    if (fromUnit.branchId !== toUnit.branchId) return NextResponse.json({ error: 'Units must be in same branch' }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      // move children
      await tx.orgUnit.updateMany({ where: { parentId: fromUnit.id }, data: { parentId: toUnit.id } })

      // move assignments
      await tx.orgUnitAssignment.updateMany({ where: { orgUnitId: fromUnit.id }, data: { orgUnitId: toUnit.id } })

      // deactivate source unit
      await tx.orgUnit.update({ where: { id: fromUnit.id }, data: { isActive: false } })
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('org-structure merge error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
