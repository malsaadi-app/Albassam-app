import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || undefined

    const stages = await prisma.stage.findMany({
      where: branchId ? { branchId } : undefined,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            type: true,
            latitude: true,
            longitude: true,
            geofenceRadius: true,
            workStartTime: true,
            workEndTime: true,
          }
        },
        _count: { select: { employees: true } }
      },
      orderBy: [
        { branch: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      stages,
      count: stages.length
    });
  } catch (error) {
    console.error('Error fetching stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stages' },
      { status: 500 }
    );
  }
}
