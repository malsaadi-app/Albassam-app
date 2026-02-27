import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * PUT /api/branches/[id]/location
 * Update branch location and geofence
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { latitude, longitude, geofenceRadius } = body;

    // Validation
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude' },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180' },
        { status: 400 }
      );
    }

    if (geofenceRadius && (geofenceRadius < 10 || geofenceRadius > 5000)) {
      return NextResponse.json(
        { error: 'Geofence radius must be between 10 and 5000 meters' },
        { status: 400 }
      );
    }

    // Update branch
    const branch = await prisma.branch.update({
      where: { id },
      data: {
        latitude,
        longitude,
        geofenceRadius: geofenceRadius || 100
      }
    });

    return NextResponse.json({
      message: 'Location updated successfully',
      branch
    });
  } catch (error: any) {
    console.error('Error updating branch location:', error);
    return NextResponse.json(
      { error: 'Failed to update location', details: error?.message },
      { status: 500 }
    );
  }
}
