import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// PUT /api/settings/org-structure/assignments
// Body: { branchId, orgUnitId, supervisorEmployeeId?, memberEmployeeIds? }
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { orgUnitId, supervisorEmployeeId, memberEmployeeIds } = body || {}

    if (!orgUnitId) return NextResponse.json({ error: 'orgUnitId is required' }, { status: 400 })

    // Upsert supervisor (FUNCTIONAL + SUPERVISOR)
    if (supervisorEmployeeId !== undefined) {
      // Deactivate existing supervisor assignments for this unit
      await prisma.orgUnitAssignment.updateMany({
        where: { orgUnitId, assignmentType: 'FUNCTIONAL', role: 'SUPERVISOR' },
        data: { active: false },
      })

      if (supervisorEmployeeId) {
        await prisma.orgUnitAssignment.upsert({
          where: {
            employeeId_orgUnitId_assignmentType: {
              employeeId: supervisorEmployeeId,
              orgUnitId,
              assignmentType: 'FUNCTIONAL',
            },
          },
          update: { active: true, role: 'SUPERVISOR' },
          create: {
            employeeId: supervisorEmployeeId,
            orgUnitId,
            assignmentType: 'FUNCTIONAL',
            role: 'SUPERVISOR',
            coverageScope: 'BRANCH',
            isPrimary: false,
            active: true,
          },
        })
      }
    }

    // Replace members list (FUNCTIONAL + MEMBER)
    if (Array.isArray(memberEmployeeIds)) {
      await prisma.orgUnitAssignment.updateMany({
        where: { orgUnitId, assignmentType: 'FUNCTIONAL', role: 'MEMBER' },
        data: { active: false },
      })

      for (const empId of memberEmployeeIds) {
        await prisma.orgUnitAssignment.upsert({
          where: {
            employeeId_orgUnitId_assignmentType: {
              employeeId: empId,
              orgUnitId,
              assignmentType: 'FUNCTIONAL',
            },
          },
          update: { active: true, role: 'MEMBER' },
          create: {
            employeeId: empId,
            orgUnitId,
            assignmentType: 'FUNCTIONAL',
            role: 'MEMBER',
            coverageScope: 'BRANCH',
            isPrimary: false,
            active: true,
          },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('org-structure assignments PUT error', e)
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
