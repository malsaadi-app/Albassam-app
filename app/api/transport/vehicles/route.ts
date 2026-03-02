import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'

// GET /api/transport/vehicles?branchId=
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || ''

    const vehicles = await prisma.transportVehicle.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
      },
      select: {
        id: true,
        plateNumber: true,
        vehicleType: true,
        model: true,
        year: true,
        capacity: true,
        status: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    })

    return NextResponse.json({ ok: true, vehicles })
  } catch (e) {
    console.error('vehicles GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/transport/vehicles
// Body: { plateNumber, vehicleType, model?, year?, capacity?, status?, branchId? }
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const plateNumber = String(body?.plateNumber || '').trim()
    const vehicleType = String(body?.vehicleType || '').trim()
    const model = body?.model ? String(body.model).trim() : null
    const year = body?.year !== undefined && body?.year !== null && body?.year !== '' ? Number(body.year) : null
    const capacity = body?.capacity !== undefined && body?.capacity !== null && body?.capacity !== '' ? Number(body.capacity) : null
    const status = body?.status ? String(body.status).trim() : 'ACTIVE'
    const branchId = body?.branchId ? String(body.branchId) : null

    if (!plateNumber || !vehicleType) return NextResponse.json({ error: 'plateNumber and vehicleType are required' }, { status: 400 })

    const created = await prisma.transportVehicle.create({
      data: { plateNumber, vehicleType, model, year, capacity, status, branchId },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, id: created.id })
  } catch (e: any) {
    console.error('vehicles POST error', e)
    // Unique plateNumber
    if (e?.code === 'P2002') return NextResponse.json({ error: 'رقم اللوحة موجود مسبقاً' }, { status: 400 })
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
