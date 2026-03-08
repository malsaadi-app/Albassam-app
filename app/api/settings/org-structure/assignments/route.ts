import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { isSuperAdmin } from '@/lib/permissions';

// GET assignments for an orgUnit
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const session = await getSession(await cookies());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const orgUnitId = searchParams.get('orgUnitId');
    
    if (!orgUnitId) {
      return NextResponse.json({ error: 'orgUnitId required' }, { status: 400 });
    }

    const assignments = await prisma.orgUnitAssignment.findMany({
      where: { orgUnitId, active: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ assignments });
  } catch (err) {
    console.error('[assignments/GET] error:', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

// Save new assignments (create HEAD, SUPERVISOR, MEMBER records)
export async function POST(req: NextRequest) {
  console.log('[assignments/POST] received request');
  try {
    // Auth check
    const session = await getSession(await cookies());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    console.log('[assignments/POST] body:', JSON.stringify(body));
    
    const {
      orgUnitId,
      headEmployeeId,
      supervisorEmployeeId,
      memberEmployeeIds,
      headCoverageScope,
      supervisorCoverageScope,
      headCoverageBranchIds,
      supervisorCoverageBranchIds,
    } = body;

    if (!orgUnitId) {
      return NextResponse.json({ error: 'orgUnitId required' }, { status: 400 });
    }

    // Transaction: deactivate existing, create new
    await prisma.$transaction(async (tx) => {
      // Deactivate all existing assignments for this unit
      await tx.orgUnitAssignment.updateMany({
        where: { orgUnitId, active: true },
        data: { active: false }
      });

      // Create HEAD assignment
      if (headEmployeeId) {
        await tx.orgUnitAssignment.create({
          data: {
            orgUnitId,
            employeeId: headEmployeeId,
            assignmentType: 'ADMIN',
            role: 'HEAD',
            active: true,
            coverageScope: headCoverageScope || 'BRANCH',
            coverageBranchIds: headCoverageBranchIds ? JSON.stringify(headCoverageBranchIds) : null,
          }
        });
      }

      // Create SUPERVISOR assignment
      if (supervisorEmployeeId) {
        await tx.orgUnitAssignment.create({
          data: {
            orgUnitId,
            employeeId: supervisorEmployeeId,
            assignmentType: 'ADMIN',
            role: 'SUPERVISOR',
            active: true,
            coverageScope: supervisorCoverageScope || 'BRANCH',
            coverageBranchIds: supervisorCoverageBranchIds ? JSON.stringify(supervisorCoverageBranchIds) : null,
          }
        });
      }

      // Create MEMBER assignments
      if (memberEmployeeIds && Array.isArray(memberEmployeeIds)) {
        for (const empId of memberEmployeeIds) {
          await tx.orgUnitAssignment.create({
            data: {
              orgUnitId,
              employeeId: empId,
              assignmentType: 'ADMIN',
              role: 'MEMBER',
              active: true,
            }
          });
        }
      }
    });

    console.log('[assignments/POST] success');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[assignments/POST] error:', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

// PUT is alias for POST (create/replace assignments)
export async function PUT(req: NextRequest) {
  console.log('[assignments/PUT] delegating to POST');
  return POST(req);
}

// PATCH for updating coverage scope on existing assignment
export async function PATCH(req: NextRequest) {
  try {
    // Auth check
    const session = await getSession(await cookies());
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const isAdmin = session.user.role === 'ADMIN' || (await isSuperAdmin(session.user.id));
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    // expected: { assignmentId, coverageScope, coverageBranchIds }
    const { assignmentId, coverageScope, coverageBranchIds } = body;
    if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 });

    const updated = await prisma.orgUnitAssignment.update({
      where: { id: assignmentId },
      data: {
        coverageScope,
        coverageBranchIds: coverageBranchIds ? JSON.stringify(coverageBranchIds) : null,
      }
    });

    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
