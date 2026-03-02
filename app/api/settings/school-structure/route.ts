import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/permissions'

// GET /api/settings/school-structure
// Returns branches + stages + managers + deputies + VP educational user
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = await isSuperAdmin(session.user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const branches = await prisma.branch.findMany({
      where: { type: 'SCHOOL', status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { employees: true } },
        educationalRouting: { select: { vpEducationalUserId: true } },
        stages: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            status: true,
            managerId: true,
            deputyId: true,
            latitude: true,
            longitude: true,
            geofenceRadius: true,
          },
        },
      },
    })

    // For dropdowns: load employees grouped by branch to keep list manageable
    const employees = await prisma.employee.findMany({
      where: { branch: { type: 'SCHOOL', status: 'ACTIVE' } },
      select: {
        id: true,
        fullNameAr: true,
        employeeNumber: true,
        branchId: true,
        userId: true,
      },
      orderBy: { fullNameAr: 'asc' },
    })

    const users = await prisma.user.findMany({
      select: { id: true, username: true, displayName: true, role: true },
      orderBy: { displayName: 'asc' },
    })

    return NextResponse.json({ branches, employees, users })
  } catch (e) {
    console.error('school-structure GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/settings/school-structure
// Body: { branchId, vpEducationalUserId?, stages?: [{id, managerId?, deputyId?, useBranchLocation?, latitude?, longitude?, geofenceRadius?}] }
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = await isSuperAdmin(session.user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { branchId, vpEducationalUserId, stages } = body || {}

    if (!branchId) return NextResponse.json({ error: 'branchId is required' }, { status: 400 })

    // Update VP routing
    if (vpEducationalUserId !== undefined) {
      await prisma.educationalRoutingSettings.upsert({
        where: { branchId },
        update: { vpEducationalUserId: vpEducationalUserId || null },
        create: { branchId, vpEducationalUserId: vpEducationalUserId || null },
      })
    }

    if (Array.isArray(stages) && stages.length) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { latitude: true, longitude: true, geofenceRadius: true },
      })

      await prisma.$transaction(
        stages.map((s: any) => {
          const useBranchLocation = !!s.useBranchLocation
          return prisma.stage.update({
            where: { id: s.id },
            data: {
              ...(s.managerId !== undefined && { managerId: s.managerId || null }),
              ...(s.deputyId !== undefined && { deputyId: s.deputyId || null }),
              ...(s.geofenceRadius !== undefined && { geofenceRadius: Number(s.geofenceRadius) }),
              ...(useBranchLocation
                ? {
                    latitude: branch?.latitude ?? null,
                    longitude: branch?.longitude ?? null,
                    geofenceRadius: branch?.geofenceRadius ?? 100,
                  }
                : {
                    ...(s.latitude !== undefined && { latitude: s.latitude === '' ? null : Number(s.latitude) }),
                    ...(s.longitude !== undefined && { longitude: s.longitude === '' ? null : Number(s.longitude) }),
                  }),
            },
          })
        })
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('school-structure PUT error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
