import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

function isBlank(v: any) {
  return v === undefined || v === null || String(v).trim() === '';
}

function parseOptionalFloat(v: any) {
  if (isBlank(v)) return null;
  const n = Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(v: any, fallback: number) {
  if (isBlank(v)) return fallback;
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : NaN;
}

// GET /api/branches - List all branches
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    
    console.log('[Branches API] Session check:', {
      hasUser: !!session.user,
      username: session.user?.username,
      role: session.user?.role
    });
    
    // Allow unauthenticated read access to branches (public data)
    // Users still need auth for create/update/delete operations

    const branches = await prisma.branch.findMany({
      where: { status: 'ACTIVE' },
      include: {
        stages: {
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' }
        },
        _count: {
          select: {
            employees: true,
            stages: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`[Branches API] Returning ${branches.length} branches`);
    return NextResponse.json(branches);
  } catch (error: any) {
    console.error('[Branches API] Error fetching branches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

// POST /api/branches - Create new branch
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create branches
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      type,
      commercialRegNo,
      buildingNo,
      address,
      city,
      postalCode,
      latitude,
      longitude,
      geofenceRadius,
      phone,
      email,
      workStartTime,
      workEndTime,
      workDays,
      stages
    } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const parsedLatitude = parseOptionalFloat(latitude);
    const parsedLongitude = parseOptionalFloat(longitude);
    const parsedGeofenceRadius = parseOptionalInt(geofenceRadius, 100);

    if (!isBlank(latitude) && parsedLatitude === null) {
      return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 });
    }
    if (!isBlank(longitude) && parsedLongitude === null) {
      return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 });
    }
    if (!Number.isFinite(parsedGeofenceRadius)) {
      return NextResponse.json({ error: 'Invalid geofenceRadius' }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        type,
        commercialRegNo,
        buildingNo,
        address,
        city,
        postalCode,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        geofenceRadius: parsedGeofenceRadius,
        phone,
        email,
        workStartTime: workStartTime || '07:00',
        workEndTime: workEndTime || '14:00',
        workDays: workDays || '0,1,2,3,4',
        updatedAt: new Date(),
        // Create stages if provided
        ...(stages && Array.isArray(stages) && stages.length > 0 && {
          stages: {
            create: stages.map((stageName: string) => ({
              name: stageName,
              status: 'ACTIVE'
            }))
          }
        })
      },
      include: {
        stages: true,
        _count: {
          select: { employees: true, stages: true }
        }
      }
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
    );
  }
}
