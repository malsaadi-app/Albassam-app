import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { searchParams } = new URL(req.url)

    const department = (searchParams.get('department') ?? '').trim()
    const status = (searchParams.get('status') ?? '').trim()
    const level = (searchParams.get('level') ?? '').trim()
    const search = (searchParams.get('search') ?? '').trim()

    const where: any = {}
    if (department) where.department = department
    if (status) where.status = status
    if (level) where.level = level
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { title: { contains: search } },
        { titleEn: { contains: search } },
      ]
    }

    const [positions, stats] = await Promise.all([
      prisma.organizationalPosition.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          code: true,
          title: true,
          titleEn: true,
          department: true,
          level: true,
          status: true,
          openedAt: true,
          closedAt: true,
          currentEmployee: {
            select: { id: true, fullNameAr: true, employeeNumber: true, department: true, position: true },
          },
        },
      }),
      prisma.organizationalPosition.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ])

    const map: Record<string, number> = {}
    for (const row of stats) map[row.status] = row._count._all

    return NextResponse.json({
      positions,
      stats: {
        total: positions.length,
        FILLED: map['FILLED'] ?? 0,
        VACANT: map['VACANT'] ?? 0,
        CLOSED: map['CLOSED'] ?? 0,
      },
    })
  } catch (error) {
    console.error('Error fetching positions:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 })
  }
}

const createSchema = z.object({
  // currently not supported; kept for future
})

export async function POST() {
  return NextResponse.json({ error: 'غير مدعوم' }, { status: 405 })
}
