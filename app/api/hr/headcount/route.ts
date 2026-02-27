import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const rows = await prisma.departmentHeadcount.findMany({
      orderBy: { department: 'asc' },
      select: {
        id: true,
        department: true,
        approvedCount: true,
        currentCount: true,
        approvalDocument: true,
        approvedAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Add computed counts from positions
    const departments = rows.map((r) => r.department)
    const positions = await prisma.organizationalPosition.findMany({
      where: { department: { in: departments } },
      select: { id: true, department: true, status: true },
    })

    const agg = new Map<string, { open: number; vacant: number; filled: number; closed: number }>()
    for (const d of departments) agg.set(d, { open: 0, vacant: 0, filled: 0, closed: 0 })

    for (const p of positions) {
      const a = agg.get(p.department)
      if (!a) continue
      if (p.status === 'CLOSED') a.closed++
      if (p.status === 'VACANT') {
        a.vacant++
        a.open++
      }
      if (p.status === 'FILLED') {
        a.filled++
        a.open++
      }
    }

    const headcount = rows.map((r) => {
      const a = agg.get(r.department) ?? { open: 0, vacant: 0, filled: 0, closed: 0 }
      const available = Math.max(0, r.approvedCount - r.currentCount)
      const availableToOpen = Math.max(0, r.approvedCount - a.open)
      return {
        ...r,
        available,
        openPositionsCount: a.open,
        vacantPositionsCount: a.vacant,
        filledPositionsCount: a.filled,
        closedPositionsCount: a.closed,
        availableToOpen,
      }
    })

    return NextResponse.json({ headcount })
  } catch (error) {
    console.error('Error fetching headcount:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 })
  }
}
