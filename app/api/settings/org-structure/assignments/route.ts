import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// PUT /api/settings/org-structure/assignments
// Body:
// {
//   orgUnitId,
//   headEmployeeId?, headCoverageScope?, headCoverageBranchIds?,
//   supervisorEmployeeId?, supervisorCoverageScope?, supervisorCoverageBranchIds?,
//   memberEmployeeIds?
// }
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const {
      orgUnitId,
      headEmployeeId,
      headCoverageScope,
      headCoverageBranchIds,
      supervisorEmployeeId,
      supervisorCoverageScope,
      supervisorCoverageBranchIds,
      memberEmployeeIds,
    } = body || {}

    if (!orgUnitId) return NextResponse.json({ error: 'orgUnitId is required' }, { status: 400 })

    // Upsert head/manager (FUNCTIONAL + HEAD)
    if (headEmployeeId !== undefined || headCoverageScope !== undefined || headCoverageBranchIds !== undefined) {
      // Deactivate existing heads for this unit
      await prisma.orgUnitAssignment.updateMany({
        where: { orgUnitId, assignmentType: 'FUNCTIONAL', role: 'HEAD' },
        data: { active: false },
      })

      if (headEmployeeId) {
        const scope = (headCoverageScope || 'BRANCH') as any
        const branchIdsJson = Array.isArray(headCoverageBranchIds) ? JSON.stringify(headCoverageBranchIds) : null

        await prisma.orgUnitAssignment.upsert({
          where: {
            employeeId_orgUnitId_assignmentType: {
              employeeId: headEmployeeId,
              orgUnitId,
              assignmentType: 'FUNCTIONAL',
            },
          },
          update: {
            active: true,
            role: 'HEAD',
            coverageScope: scope,
            coverageBranchIds: scope === 'MULTI_BRANCH' ? branchIdsJson : null,
          },
          create: {
            employeeId: headEmployeeId,
            orgUnitId,
            assignmentType: 'FUNCTIONAL',
            role: 'HEAD',
            coverageScope: scope,
            coverageBranchIds: scope === 'MULTI_BRANCH' ? branchIdsJson : null,
            isPrimary: true,
            active: true,
          },
        })
      }
    }

    // Upsert supervisor (FUNCTIONAL + SUPERVISOR)
    if (supervisorEmployeeId !== undefined || supervisorCoverageScope !== undefined || supervisorCoverageBranchIds !== undefined) {
      // Deactivate existing supervisor assignments for this unit
      await prisma.orgUnitAssignment.updateMany({
        where: { orgUnitId, assignmentType: 'FUNCTIONAL', role: 'SUPERVISOR' },
        data: { active: false },
      })

      if (supervisorEmployeeId) {
        const scope = (supervisorCoverageScope || 'BRANCH') as any
        const branchIdsJson = Array.isArray(supervisorCoverageBranchIds) ? JSON.stringify(supervisorCoverageBranchIds) : null

        await prisma.orgUnitAssignment.upsert({
          where: {
            employeeId_orgUnitId_assignmentType: {
              employeeId: supervisorEmployeeId,
              orgUnitId,
              assignmentType: 'FUNCTIONAL',
            },
          },
          update: {
            active: true,
            role: 'SUPERVISOR',
            coverageScope: scope,
            coverageBranchIds: scope === 'MULTI_BRANCH' ? branchIdsJson : null,
          },
          create: {
            employeeId: supervisorEmployeeId,
            orgUnitId,
            assignmentType: 'FUNCTIONAL',
            role: 'SUPERVISOR',
            coverageScope: scope,
            coverageBranchIds: scope === 'MULTI_BRANCH' ? branchIdsJson : null,
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
