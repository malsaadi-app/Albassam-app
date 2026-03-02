import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'
import { mapTeacherToDepartmentName, normalizeOrgLabel } from '@/lib/org-structure/teacherMapping'

// POST /api/settings/org-structure/auto-assign-teachers
// Body: { branchId: string, dryRun?: boolean }
// Uses Employee.department + Employee.specialization to assign TEACHER employees to OrgUnits.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id))
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const branchId = String(body?.branchId || '')
    const dryRun = Boolean(body?.dryRun)
    if (!branchId) return NextResponse.json({ error: 'branchId is required' }, { status: 400 })

    const [branch, units, teachers] = await Promise.all([
      prisma.branch.findUnique({ where: { id: branchId }, select: { id: true, name: true } }),
      prisma.orgUnit.findMany({
        where: { branchId, isActive: true },
        select: { id: true, name: true, type: true },
      }),
      prisma.employee.findMany({
        where: { branchId, status: 'ACTIVE', employeeRole: 'TEACHER' },
        select: { id: true, employeeNumber: true, fullNameAr: true, department: true, specialization: true },
      }),
    ])

    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 })

    // Ensure science unit exists (so mapping always has a target)
    const scienceName = 'قسم المواد العلمية'
    let scienceUnit = units.find((u) => normalizeOrgLabel(u.name) === normalizeOrgLabel(scienceName))

    if (!scienceUnit && !dryRun) {
      scienceUnit = await prisma.orgUnit.create({
        data: {
          branchId,
          parentId: null,
          name: scienceName,
          type: 'DEPARTMENT',
          sortOrder: 50,
        },
        select: { id: true, name: true, type: true },
      })
      units.push(scienceUnit)
    }

    const unitByNormName = new Map<string, { id: string; name: string }>()
    for (const u of units) {
      unitByNormName.set(normalizeOrgLabel(u.name), { id: u.id, name: u.name })
    }

    // Current memberships to avoid duplicates
    const existing = await prisma.orgUnitAssignment.findMany({
      where: {
        active: true,
        assignmentType: 'FUNCTIONAL',
        role: 'MEMBER',
        employee: { branchId },
      },
      select: { employeeId: true, orgUnitId: true },
    })
    const existingKey = new Set(existing.map((x) => `${x.employeeId}:${x.orgUnitId}`))

    const plan: Array<{ employeeId: string; employeeNumber: string; employeeName: string; targetUnitId: string; targetUnitName: string; source: string }> = []
    const needsReview: Array<{ employeeId: string; employeeNumber: string; employeeName: string; department: string; specialization: string; reason: string }> = []

    for (const t of teachers) {
      const mappedName = mapTeacherToDepartmentName({ department: t.department, specialization: t.specialization })
      if (!mappedName) {
        needsReview.push({
          employeeId: t.id,
          employeeNumber: t.employeeNumber,
          employeeName: t.fullNameAr,
          department: t.department,
          specialization: t.specialization || '',
          reason: 'no department/specialization',
        })
        continue
      }

      const unit = unitByNormName.get(normalizeOrgLabel(mappedName))
      if (!unit) {
        needsReview.push({
          employeeId: t.id,
          employeeNumber: t.employeeNumber,
          employeeName: t.fullNameAr,
          department: t.department,
          specialization: t.specialization || '',
          reason: `no matching org unit for: ${mappedName}`,
        })
        continue
      }

      const key = `${t.id}:${unit.id}`
      if (existingKey.has(key)) continue

      plan.push({
        employeeId: t.id,
        employeeNumber: t.employeeNumber,
        employeeName: t.fullNameAr,
        targetUnitId: unit.id,
        targetUnitName: unit.name,
        source: normalizeOrgLabel(t.department) ? 'department' : 'specialization',
      })
    }

    if (!dryRun && plan.length) {
      await prisma.orgUnitAssignment.createMany({
        data: plan.map((p) => ({
          employeeId: p.employeeId,
          orgUnitId: p.targetUnitId,
          assignmentType: 'FUNCTIONAL',
          role: 'MEMBER',
          active: true,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({
      ok: true,
      branch: branch.name,
      teacherCount: teachers.length,
      toAssignCount: plan.length,
      dryRun,
      plan: plan.slice(0, 200),
      needsReviewCount: needsReview.length,
      needsReview: needsReview.slice(0, 200),
      note: plan.length > 200 || needsReview.length > 200 ? 'lists truncated to 200' : undefined,
    })
  } catch (e) {
    console.error('auto-assign-teachers error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
