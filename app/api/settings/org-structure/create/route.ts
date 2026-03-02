import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// POST /api/settings/org-structure/create
// Body: { branchId, parentId?, name, type, headEmployeeId? }
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const branchId = String(body?.branchId || '')
    const parentId = body?.parentId ? String(body.parentId) : null
    const name = String(body?.name || '').trim()
    const type = String(body?.type || '')
    const headEmployeeId = body?.headEmployeeId ? String(body.headEmployeeId) : null

    if (!branchId || !name || !type) return NextResponse.json({ error: 'branchId, name, type are required' }, { status: 400 })

    const created = await prisma.$transaction(async (tx) => {
      const unit = await tx.orgUnit.create({
        data: {
          branchId,
          parentId,
          name,
          type: type as any,
        },
        select: { id: true },
      })

      if (headEmployeeId) {
        await tx.orgUnitAssignment.create({
          data: {
            employeeId: headEmployeeId,
            orgUnitId: unit.id,
            assignmentType: 'FUNCTIONAL',
            role: 'HEAD',
            active: true,
            isPrimary: true,
          },
        })
      }

      return unit
    })

    return NextResponse.json({ ok: true, id: created.id })
  } catch (e: any) {
    console.error('org-structure create error', e)
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
