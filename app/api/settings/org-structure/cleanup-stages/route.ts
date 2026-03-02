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
    if (String(branch.name).trim() !== BOYS_BRANCH_NAME) {
      return NextResponse.json({ ok: true, deactivatedCount: 0, note: 'not boys branch; no cleanup applied' })
    }

    // Keep only these stages for boys branch (support multiple spellings)
    const allowed = ['ابتدائي', 'متوسط', 'ثانوي', 'ابتدائية', 'متوسطة', 'ثانوية']

    // Deactivate unwanted
    const deactivated = await prisma.orgUnit.updateMany({
      where: { branchId, type: 'STAGE', isActive: true, name: { notIn: allowed } },
      data: { isActive: false },
    })

    // Reactivate allowed (in case previous cleanup disabled them)
    const activated = await prisma.orgUnit.updateMany({
      where: { branchId, type: 'STAGE', name: { in: allowed } },
      data: { isActive: true },
    })

    return NextResponse.json({ ok: true, deactivatedCount: deactivated.count, activatedCount: activated.count })
  } catch (e) {
    console.error('cleanup-stages error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
