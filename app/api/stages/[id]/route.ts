import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// PUT /api/stages/[id] - Update stage
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

    // Only admins can update stages
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
      deputyId,
      status
    } = body;

    const stage = await prisma.stage.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code !== undefined && { code }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(geofenceRadius !== undefined && { geofenceRadius: parseInt(geofenceRadius) }),
        ...(workStartTime !== undefined && { workStartTime }),
        ...(workEndTime !== undefined && { workEndTime }),
        ...(managerId !== undefined && { managerId }),
        ...(deputyId !== undefined && { deputyId }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      include: {
        branch: true,
        _count: {
          select: { employees: true }
        }
      }
    });

    return NextResponse.json(stage);
  } catch (error: any) {
    console.error('Error updating stage:', error);

    // Check for unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Stage with this name already exists in this branch' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update stage' },
      { status: 500 }
    );
  }
}

// DELETE /api/stages/[id] - Delete stage (hard delete if no employees, soft otherwise)
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

    // Only admins can delete stages
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    // Check if stage has employees
    const stage = await prisma.stage.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });

    if (!stage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    if (stage._count.employees > 0) {
      // Soft delete if has employees
      const updated = await prisma.stage.update({
        where: { id },
        data: {
          status: 'INACTIVE',
          updatedAt: new Date()
        }
      });
      return NextResponse.json({
        message: 'Stage deactivated (has employees)',
        stage: updated
      });
    } else {
      // Hard delete if no employees
      await prisma.stage.delete({
        where: { id }
      });
      return NextResponse.json({ message: 'Stage deleted successfully' });
    }
  } catch (error: any) {
    console.error('Error deleting stage:', error);
    return NextResponse.json(
      { error: 'Failed to delete stage' },
      { status: 500 }
    );
  }
}
