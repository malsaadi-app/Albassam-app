import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

const createSchema = z.object({
  title: z.string().min(1),
  department: z.string().min(1),
  level: z.string().min(1),
  justification: z.string().min(5),
  approvalDocument: z.string().min(1),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
})

function pad3(n: number) {
  return String(n).padStart(3, '0')
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = (searchParams.get('status') ?? '').trim()
    const department = (searchParams.get('department') ?? '').trim()

    const where: any = {}
    if (status) where.status = status
    if (department) where.department = department

    const requests = await prisma.positionOpeningRequest.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      include: {
        requestedByUser: { select: { id: true, fullNameAr: true, employeeNumber: true, department: true } },
        reviewedByUser: { select: { id: true, fullNameAr: true, employeeNumber: true } },
        createdPosition: { select: { id: true, code: true, status: true } },
      },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching position opening requests:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = createSchema.parse(await req.json())

    const requester = await prisma.employee.findUnique({ where: { userId: session.user.id } })
    if (!requester) {
      return NextResponse.json({ error: 'لا يوجد موظف مرتبط بحسابك' }, { status: 400 })
    }

    const year = new Date().getFullYear()
    const count = await prisma.positionOpeningRequest.count({
      where: {
        requestedAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
      },
    })

    const requestNumber = `POR-${year}-${pad3(count + 1)}`

    const created = await prisma.positionOpeningRequest.create({
      data: {
        requestNumber,
        title: body.title,
        department: body.department,
        level: body.level,
        justification: body.justification,
        approvalDocument: body.approvalDocument,
        salaryMin: body.salaryMin ?? null,
        salaryMax: body.salaryMax ?? null,
        requestedBy: requester.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ request: created }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: error.errors }, { status: 400 })
    }
    console.error('Error creating position opening request:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الطلب' }, { status: 500 })
  }
}
