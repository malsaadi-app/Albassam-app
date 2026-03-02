import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// GET /api/settings/org-structure?branchId=...
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    if (!branchId) return NextResponse.json({ error: 'branchId is required' }, { status: 400 })

    const units = await prisma.orgUnit.findMany({
      where: { branchId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        parentId: true,
        name: true,
        type: true,
        sortOrder: true,
        isActive: true,
      },
    })

    const assignments = await prisma.orgUnitAssignment.findMany({
      where: { orgUnit: { branchId }, active: true },
      select: {
        id: true,
        orgUnitId: true,
        employeeId: true,
        assignmentType: true,
        role: true,
        coverageScope: true,
        coverageBranchIds: true,
        weightPercent: true,
        isPrimary: true,
        active: true,
      },
    })

    const employees = await prisma.employee.findMany({
      where: { branchId },
      select: { id: true, fullNameAr: true, employeeNumber: true, department: true, position: true, specialization: true },
      orderBy: { fullNameAr: 'asc' },
    })

    return NextResponse.json({ units, assignments, employees })
  } catch (e) {
    console.error('org-structure GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/settings/org-structure
// Body: { branchId, parentId?, name, type }
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { branchId, parentId, name, type } = body || {}
    if (!branchId || !name || !type) return NextResponse.json({ error: 'branchId, name, type are required' }, { status: 400 })

    const created = await prisma.orgUnit.create({
      data: {
        branchId,
        parentId: parentId || null,
        name,
        type,
      },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, id: created.id })
  } catch (e: any) {
    console.error('org-structure POST error', e)
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
