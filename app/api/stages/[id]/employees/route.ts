import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// GET /api/stages/[id]/employees - List employees in a stage
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id: stageId } = await params

    const employees = await prisma.employee.findMany({
      where: { stageId },
      select: {
        id: true,
        fullNameAr: true,
        employeeNumber: true,
        department: true,
        position: true,
      },
      orderBy: { fullNameAr: 'asc' },
    })

    return NextResponse.json({ employees }, { status: 200 })
  } catch (error: any) {
    console.error('Error listing stage employees:', error)
    return NextResponse.json({ error: 'Failed to list stage employees' }, { status: 500 })
  }
}
