import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { createReplacementRequest } from '@/lib/replacementService'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = (searchParams.get('status') ?? '').trim()
    const department = (searchParams.get('department') ?? '').trim()
    const endingSoon = (searchParams.get('endingSoon') ?? '').trim() // "7" days

    const where: any = {}
    if (status) where.status = status
    if (department) where.position = { department }

    if (endingSoon) {
      const days = Number(endingSoon)
      if (Number.isFinite(days) && days > 0) {
        const now = new Date()
        const limit = new Date(now)
        limit.setDate(limit.getDate() + days)
        where.probationEndDate = { lte: limit, gte: now }
        where.status = { in: ['ACTIVE', 'EXTENDED'] }
      }
    }

    const replacements = await prisma.replacementRequest.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        position: { select: { id: true, title: true, code: true, department: true } },
        currentEmployee: { select: { id: true, fullNameAr: true, employeeNumber: true, userId: true } },
        newEmployee: { select: { id: true, fullNameAr: true, employeeNumber: true, userId: true } },
      },
      take: 200,
    })

    return NextResponse.json({ replacements })
  } catch (e) {
    console.error('GET /api/replacements error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 })
  }
}

const createSchema = z.object({
  positionId: z.number().int().positive(),
  newEmployeeId: z.string().min(1),
  probationStartDate: z.string().datetime().optional(),
  probationMonths: z.number().int().min(1).max(3),
  replacementReason: z.string().min(3),
  expectedImprovement: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: parsed.error.flatten() }, { status: 400 })
    }

    const r = await createReplacementRequest({
      positionId: parsed.data.positionId,
      newEmployeeId: parsed.data.newEmployeeId,
      probationStartDate: parsed.data.probationStartDate ? new Date(parsed.data.probationStartDate) : undefined,
      probationMonths: parsed.data.probationMonths,
      replacementReason: parsed.data.replacementReason,
      expectedImprovement: parsed.data.expectedImprovement ?? null,
      requestedByUserId: session.user.id,
    })

    return NextResponse.json({ replacement: r })
  } catch (e: any) {
    const statusCode = e?.statusCode && Number.isFinite(e.statusCode) ? e.statusCode : 500
    console.error('POST /api/replacements error', e)
    return NextResponse.json({ error: e?.message ?? 'حدث خطأ أثناء إنشاء الطلب' }, { status: statusCode })
  }
}
