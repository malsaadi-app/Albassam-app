import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

const createSchema = z.object({
  applicantName: z.string().min(1),
  applicantPhone: z.string().optional().nullable(),
  applicantEmail: z.string().email().optional().or(z.literal('')).nullable(),
  department: z.string().min(1),
  positionId: z.number().int(),
  notes: z.string().optional().nullable(),
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

    const applications = await prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        position: { select: { id: true, code: true, title: true, department: true, level: true, status: true } },
        createdByUser: { select: { id: true, fullNameAr: true, employeeNumber: true } },
      },
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Error fetching job applications:', error)
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

    const creator = await prisma.employee.findUnique({ where: { userId: session.user.id } })
    if (!creator) return NextResponse.json({ error: 'لا يوجد موظف مرتبط بحسابك' }, { status: 400 })

    const position = await prisma.organizationalPosition.findUnique({ where: { id: body.positionId } })
    if (!position) return NextResponse.json({ error: 'الوظيفة غير موجودة' }, { status: 400 })

    if (position.department !== body.department) {
      return NextResponse.json({ error: 'القسم لا يتطابق مع الوظيفة المختارة' }, { status: 400 })
    }

    if (position.status !== 'VACANT') {
      return NextResponse.json({ error: 'هذه الوظيفة ليست شاغرة' }, { status: 400 })
    }

    const year = new Date().getFullYear()
    const count = await prisma.jobApplication.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
      },
    })

    const applicationNumber = `APP-${year}-${pad3(count + 1)}`

    const created = await prisma.jobApplication.create({
      data: {
        applicationNumber,
        applicantName: body.applicantName,
        applicantPhone: body.applicantPhone ?? null,
        applicantEmail: body.applicantEmail ? body.applicantEmail : null,
        department: body.department,
        positionId: body.positionId,
        status: 'SUBMITTED',
        notes: body.notes ?? null,
        createdBy: creator.id,
      },
    })

    return NextResponse.json({ application: created }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: error.errors }, { status: 400 })
    }
    console.error('Error creating job application:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الطلب' }, { status: 500 })
  }
}
