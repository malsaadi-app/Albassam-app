import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/branches/[id]/stages - Get all stages for a branch
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get all stages for this branch
    const stages = await prisma.stage.findMany({
      where: {
        branchId: id,
        status: 'ACTIVE'
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        code: true,
        status: true
      }
    });

    return NextResponse.json(stages);
  } catch (error) {
    console.error('Error fetching stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stages' },
      { status: 500 }
    );
  }
}

// POST /api/branches/[id]/stages - Create new stage for a branch
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create stages
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      code,
      latitude,
      longitude,
      geofenceRadius,
      workStartTime,
      workEndTime,
      managerId,
      copyGpsFrom // Optional: copy GPS from another stage
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Stage name is required' },
        { status: 400 }
      );
    }

    // Check if branch exists
    const branch = await prisma.branch.findUnique({
      where: { id }
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // If copyGpsFrom is provided, get GPS from that stage
    let gpsData: any = {
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      geofenceRadius: geofenceRadius ? parseInt(geofenceRadius) : 100
    };

    if (copyGpsFrom) {
      const sourceStage = await prisma.stage.findUnique({
        where: { id: copyGpsFrom },
        select: { latitude: true, longitude: true, geofenceRadius: true }
      });

      if (sourceStage) {
        gpsData = {
          latitude: sourceStage.latitude,
          longitude: sourceStage.longitude,
          geofenceRadius: sourceStage.geofenceRadius
        };
      }
    }

    // Create stage
    const stage = await prisma.stage.create({
      data: {
        branchId: id,
        name,
        code,
        ...gpsData,
        workStartTime: workStartTime || null,
        workEndTime: workEndTime || null,
        managerId: managerId || null,
        updatedAt: new Date()
      },
      include: {
        branch: true,
        _count: {
          select: { employees: true }
        }
      }
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error: any) {
    console.error('Error creating stage:', error);

    // Check for unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Stage with this name already exists in this branch' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create stage' },
      { status: 500 }
    );
  }
}
