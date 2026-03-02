import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'

// GET /api/transport/drivers?branchId=
// Returns employees whose position contains "سائق".
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId') || ''

    const drivers = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        position: { contains: 'سائق' },
        ...(branchId ? { branchId } : {}),
      },
      select: {
        id: true,
        fullNameAr: true,
        employeeNumber: true,
        phone: true,
        branchId: true,
        department: true,
        position: true,
      },
      orderBy: { fullNameAr: 'asc' },
    })

    return NextResponse.json({ ok: true, drivers })
  } catch (e) {
    console.error('drivers GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
