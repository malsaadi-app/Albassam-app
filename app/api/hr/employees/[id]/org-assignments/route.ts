import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'

// GET /api/hr/employees/:id/org-assignments
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const canEdit = session.user.role === 'ADMIN' || session.user.role === 'HR_EMPLOYEE'
    if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, branchId: true, stageId: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const assignments = await prisma.orgUnitAssignment.findMany({
      where: { employeeId: id, active: true },
      select: { id: true, orgUnitId: true, assignmentType: true, role: true, coverageScope: true, coverageBranchIds: true, weightPercent: true, isPrimary: true },
    })

    return NextResponse.json({ ok: true, employee, assignments })
  } catch (e) {
    console.error('employee org-assignments GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/hr/employees/:id/org-assignments
// Body:
// {
//   adminStageUnitIds?: string[]
//   functionalUnitIds?: string[]
//   primaryStageId?: string | null  // writes Employee.stageId
// }
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const canEdit = session.user.role === 'ADMIN' || session.user.role === 'HR_EMPLOYEE'
    if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const adminStageUnitIds: string[] | undefined = Array.isArray(body?.adminStageUnitIds) ? body.adminStageUnitIds.map(String) : undefined
    const functionalUnitIds: string[] | undefined = Array.isArray(body?.functionalUnitIds) ? body.functionalUnitIds.map(String) : undefined
    const primaryStageId: string | null | undefined = body?.primaryStageId === undefined ? undefined : body.primaryStageId ? String(body.primaryStageId) : null

    const employee = await prisma.employee.findUnique({ where: { id }, select: { id: true, branchId: true } })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      // ADMIN stage assignments
      if (adminStageUnitIds !== undefined) {
        await tx.orgUnitAssignment.updateMany({
          where: { employeeId: id, assignmentType: 'ADMIN', role: 'MEMBER' },
          data: { active: false },
        })

        if (adminStageUnitIds.length) {
          // Ensure stages belong to same branch
          const stages = await tx.orgUnit.findMany({
            where: { id: { in: adminStageUnitIds }, branchId: employee.branchId, type: 'STAGE', isActive: true },
            select: { id: true },
          })
          const validStageIds = stages.map((s) => s.id)

          if (validStageIds.length) {
            await tx.orgUnitAssignment.createMany({
              data: validStageIds.map((orgUnitId) => ({
                employeeId: id,
                orgUnitId,
                assignmentType: 'ADMIN',
                role: 'MEMBER',
                coverageScope: 'BRANCH',
                active: true,
                isPrimary: false,
              })),
              skipDuplicates: true,
            })

            await tx.orgUnitAssignment.updateMany({
              where: { employeeId: id, orgUnitId: { in: validStageIds }, assignmentType: 'ADMIN' },
              data: { active: true, role: 'MEMBER' },
            })
          }
        }
      }

      // FUNCTIONAL department memberships
      if (functionalUnitIds !== undefined) {
        await tx.orgUnitAssignment.updateMany({
          where: { employeeId: id, assignmentType: 'FUNCTIONAL', role: 'MEMBER' },
          data: { active: false },
        })

        if (functionalUnitIds.length) {
          const units = await tx.orgUnit.findMany({
            where: { id: { in: functionalUnitIds }, branchId: employee.branchId, isActive: true, type: { in: ['DEPARTMENT', 'SUB_DEPARTMENT'] } },
            select: { id: true },
          })
          const validIds = units.map((u) => u.id)

          if (validIds.length) {
            await tx.orgUnitAssignment.createMany({
              data: validIds.map((orgUnitId) => ({
                employeeId: id,
                orgUnitId,
                assignmentType: 'FUNCTIONAL',
                role: 'MEMBER',
                coverageScope: 'BRANCH',
                active: true,
                isPrimary: false,
              })),
              skipDuplicates: true,
            })

            await tx.orgUnitAssignment.updateMany({
              where: { employeeId: id, orgUnitId: { in: validIds }, assignmentType: 'FUNCTIONAL' },
              data: { active: true, role: 'MEMBER' },
            })
          }
        }
      }

      // Primary stage (legacy field)
      if (primaryStageId !== undefined) {
        await tx.employee.update({ where: { id }, data: { stageId: primaryStageId } })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('employee org-assignments PUT error', e)
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
