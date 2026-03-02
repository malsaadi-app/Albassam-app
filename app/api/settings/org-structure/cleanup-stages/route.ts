import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// POST /api/settings/org-structure/cleanup-stages
// Body: { branchId }
// Deactivates unwanted STAGE units for boys branch (عام, رياض أطفال) if they exist.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const branchId = String(body?.branchId || '')
    if (!branchId) return NextResponse.json({ error: 'branchId is required' }, { status: 400 })

    const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } })
    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 })

    const BOYS_BRANCH_NAME = 'مجمع البسام الأهلية بنين'
    if (branch.name !== BOYS_BRANCH_NAME) {
      return NextResponse.json({ ok: true, deactivatedCount: 0, note: 'not boys branch; no cleanup applied' })
    }

    const unwanted = ['عام', 'رياض أطفال']

    const res = await prisma.orgUnit.updateMany({
      where: { branchId, type: 'STAGE', isActive: true, name: { in: unwanted } },
      data: { isActive: false },
    })

    return NextResponse.json({ ok: true, deactivatedCount: res.count })
  } catch (e) {
    console.error('cleanup-stages error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
