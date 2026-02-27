import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await ctx.params
    const positionId = Number(id)

    if (!Number.isFinite(positionId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 })
    }

    const position = await prisma.organizationalPosition.findUnique({
      where: { id: positionId },
      include: {
        currentEmployee: { select: { id: true, fullNameAr: true, employeeNumber: true, department: true, position: true } },
        openedByUser: { select: { id: true, fullNameAr: true, employeeNumber: true } },
        history: {
          orderBy: { createdAt: 'desc' },
          include: {
            employee: { select: { id: true, fullNameAr: true, employeeNumber: true } },
            performedByUser: { select: { id: true, fullNameAr: true, employeeNumber: true } },
          },
        },
        applications: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            applicationNumber: true,
            applicantName: true,
            department: true,
            status: true,
            createdAt: true,
          },
        },
        createdFromOpeningRequest: {
          select: { id: true, requestNumber: true, status: true, requestedAt: true },
        },
      },
    })

    if (!position) {
      return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ position })
  } catch (error) {
    console.error('Error fetching position:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 })
  }
}
