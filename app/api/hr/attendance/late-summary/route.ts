import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

function parseDateParam(v: string | null) {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

// GET /api/hr/attendance/late-summary?start=YYYY-MM-DD&end=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    // Allow HR_EMPLOYEE + ADMIN
    const role = session.user.role
    if (role !== 'ADMIN' && role !== 'HR_EMPLOYEE') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const start = parseDateParam(searchParams.get('start'))
    const end = parseDateParam(searchParams.get('end'))

    if (!start || !end || start > end) {
      return NextResponse.json({ error: 'نطاق التاريخ غير صحيح' }, { status: 400 })
    }

    const records = await prisma.attendanceRecord.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        status: 'LATE',
      },
      select: {
        id: true,
        date: true,
        userId: true,
        minutesLate: true,
        user: { select: { id: true, displayName: true, username: true } },
      },
      orderBy: [{ date: 'asc' }],
    })

    const byDateMap = new Map<string, number>()
    const byUserMap = new Map<string, { userId: string; name: string; lateCount: number; totalLateMinutes: number }>()

    for (const r of records) {
      const key = r.date.toISOString().slice(0, 10)
      byDateMap.set(key, (byDateMap.get(key) || 0) + 1)

      const uKey = r.userId
      const existing = byUserMap.get(uKey) || {
        userId: uKey,
        name: r.user?.displayName || r.user?.username || uKey,
        lateCount: 0,
        totalLateMinutes: 0,
      }
      existing.lateCount += 1
      existing.totalLateMinutes += r.minutesLate || 0
      byUserMap.set(uKey, existing)
    }

    const by_date = Array.from(byDateMap.entries()).map(([date, lateCount]) => ({ date, lateCount }))
    const top_offenders = Array.from(byUserMap.values())
      .sort((a, b) => b.lateCount - a.lateCount)
      .slice(0, 10)

    const totalLateCount = records.length
    const uniqueLateUsers = byUserMap.size
    const avgLateMinutes = totalLateCount
      ? Math.round((records.reduce((s, r) => s + (r.minutesLate || 0), 0) / totalLateCount) * 10) / 10
      : 0

    return NextResponse.json({
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      totalLateCount,
      uniqueLateUsers,
      averageLateMinutes: avgLateMinutes,
      topOffenders: top_offenders,
      byDate: by_date,
    })
  } catch (e) {
    console.error('late-summary error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب ملخص التأخيرات' }, { status: 500 })
  }
}
