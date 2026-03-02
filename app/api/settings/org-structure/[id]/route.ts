import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// PATCH /api/settings/org-structure/:id
// Body: { name?, parentId?, sortOrder?, isActive? }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const { name, parentId, sortOrder, isActive } = body || {}

    const existing = await prisma.orgUnit.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.orgUnit.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: String(name) } : {}),
        ...(parentId !== undefined ? { parentId: parentId ? String(parentId) : null } : {}),
        ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
      select: { id: true },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('org-structure/:id PATCH error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
