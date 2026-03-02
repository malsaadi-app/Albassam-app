import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// POST /api/settings/org-structure/ensure-stages
// Body: { branchId }
// Creates STAGE org units for the branch based on existing Stage records.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const branchId = String(body?.branchId || '')
    if (!branchId) return NextResponse.json({ error: 'branchId is required' }, { status: 400 })

    const stages = await prisma.stage.findMany({
      where: { branchId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    if (stages.length === 0) return NextResponse.json({ ok: true, createdCount: 0, note: 'no stages found for branch' })

    // find a root org unit for this branch (SCHOOL). If not found, attach to branch root (null parent)
    const branchRoot = await prisma.orgUnit.findFirst({
      where: { branchId, parentId: null, isActive: true },
      select: { id: true },
    })

    const existingStageUnits = await prisma.orgUnit.findMany({
      where: { branchId, type: 'STAGE', isActive: true },
      select: { id: true, name: true },
    })
    const existingNames = new Set(existingStageUnits.map((u) => u.name.trim()))

    const toCreate = stages.filter((s) => !existingNames.has(String(s.name).trim()))

    if (toCreate.length === 0) return NextResponse.json({ ok: true, createdCount: 0 })

    const created = await prisma.orgUnit.createMany({
      data: toCreate.map((s, idx) => ({
        branchId,
        parentId: branchRoot?.id || null,
        type: 'STAGE',
        name: String(s.name).trim(),
        sortOrder: 10 + idx,
        isActive: true,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({ ok: true, createdCount: created.count })
  } catch (e) {
    console.error('ensure-stages error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
