import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const department = (searchParams.get('department') ?? '').trim()
    const status = (searchParams.get('status') ?? 'VACANT').trim()

    if (!department) {
      return NextResponse.json({ error: 'القسم مطلوب' }, { status: 400 })
    }

    const [positions, headcountRow, employeesCount, openPositionsCount, vacantCount, filledCount] = await Promise.all([
      prisma.organizationalPosition.findMany({
        where: { department, status },
        orderBy: [{ openedAt: 'desc' }],
        select: { id: true, code: true, title: true, level: true, department: true, status: true },
      }),
      prisma.departmentHeadcount.findUnique({ where: { department } }),
      prisma.employee.count({ where: { department } }),
      prisma.organizationalPosition.count({
        where: { department, status: { in: ['FILLED', 'VACANT'] } },
      }),
      prisma.organizationalPosition.count({
        where: { department, status: 'VACANT' },
      }),
      prisma.organizationalPosition.count({
        where: { department, status: 'FILLED' },
      }),
    ])

    const approvedCount = headcountRow?.approvedCount ?? employeesCount
    const currentCount = headcountRow?.currentCount ?? employeesCount

    const availableToOpen = Math.max(0, approvedCount - openPositionsCount)

    return NextResponse.json({
      positions,
      headcount: {
        department,
        approvedCount,
        currentCount,
        employeesCount,
        openPositionsCount,
        filledPositionsCount: filledCount,
        vacantPositionsCount: vacantCount,
        availableToOpen,
      },
    })
  } catch (error) {
    console.error('Error fetching vacant positions:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 })
  }
}
