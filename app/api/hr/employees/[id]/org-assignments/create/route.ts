import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const canEdit = session.user.role === 'ADMIN' || session.user.role === 'HR_EMPLOYEE'
    if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { orgUnitId, assignmentType = 'FUNCTIONAL', role = 'MEMBER', coverageScope = 'BRANCH', isPrimary = false } = body
    if (!orgUnitId) return NextResponse.json({ error: 'orgUnitId required' }, { status: 400 })

    // ensure orgUnit belongs to same branch as employee
    const employee = await prisma.employee.findUnique({ where: { id }, select: { id: true, branchId: true } })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const unit = await prisma.orgUnit.findUnique({ where: { id: orgUnitId }, select: { id: true, branchId: true, type: true, isActive: true } })
    if (!unit || !unit.isActive) return NextResponse.json({ error: 'OrgUnit not found or inactive' }, { status: 404 })
    // allow creation only if unit.branchId matches employee.branchId
    if (unit.branchId !== employee.branchId) return NextResponse.json({ error: 'OrgUnit does not belong to employee branch' }, { status: 400 })

    const created = await prisma.orgUnitAssignment.create({ data: {
      employeeId: id,
      orgUnitId,
      assignmentType,
      role,
      coverageScope,
      isPrimary,
      active: true
    }})

    return NextResponse.json({ ok: true, created })
  } catch (e: any) {
    console.error('employee org-assignments CREATE error', e)
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
