import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// GET /api/settings/org-structure/unassigned?branchId=...
// Returns employees in branch that have NO active FUNCTIONAL/MEMBER org assignment.
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    if (!branchId) return NextResponse.json({ error: 'branchId is required' }, { status: 400 })

    // Find employee ids that already have a functional membership in org structure
    const assigned = await prisma.orgUnitAssignment.findMany({
      where: {
        active: true,
        assignmentType: 'FUNCTIONAL',
        role: 'MEMBER',
        employee: { branchId },
      },
      select: { employeeId: true },
    })

    const assignedIds = assigned.map((a) => a.employeeId)

    const employees = await prisma.employee.findMany({
      where: {
        branchId,
        status: 'ACTIVE',
        ...(assignedIds.length ? { id: { notIn: assignedIds } } : {}),
      },
      select: { id: true, fullNameAr: true, employeeNumber: true, department: true, position: true },
      orderBy: { fullNameAr: 'asc' },
    })

    return NextResponse.json({ ok: true, employees })
  } catch (e) {
    console.error('org-structure unassigned GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
