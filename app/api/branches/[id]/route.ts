import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/branches/[id] - Get single branch
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    
    // Allow unauthenticated read access (same as list endpoint)
    // Users still need auth for update/delete operations
    
    const { id } = await params;
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        stages: {
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' }
        },
        _count: {
          select: {
            employees: true,
            stages: true,
            attendanceRecords: true
          }
        }
      }
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json(branch);
  } catch (error: any) {
    console.error('Error fetching branch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branch' },
      { status: 500 }
    );
  }
}

// PUT /api/branches/[id] - Update branch
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update branches
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
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
      status
    } = body;

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(commercialRegNo !== undefined && { commercialRegNo }),
        ...(buildingNo !== undefined && { buildingNo }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(geofenceRadius !== undefined && { geofenceRadius: parseInt(geofenceRadius) }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(workStartTime && { workStartTime }),
        ...(workEndTime && { workEndTime }),
        ...(workDays !== undefined && { workDays }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      include: {
        stages: true,
        _count: {
          select: { employees: true, stages: true }
        }
      }
    });

    return NextResponse.json(branch);
  } catch (error: any) {
    console.error('Error updating branch:', error);
    return NextResponse.json(
      { error: 'Failed to update branch' },
      { status: 500 }
    );
  }
}

// DELETE /api/branches/[id] - Soft delete branch
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete branches
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    // Soft delete by setting status to INACTIVE
    const branch = await prisma.branch.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ message: 'Branch deleted successfully', branch });
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return NextResponse.json(
      { error: 'Failed to delete branch' },
      { status: 500 }
    );
  }
}
