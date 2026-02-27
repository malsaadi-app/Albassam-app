import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

const schema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().optional(),
})

function pad3(n: number) {
  return String(n).padStart(3, '0')
}

function appendNote(prev: string | null, line: string) {
  const p = (prev ?? '').trim()
  return p ? `${p}\n\n${line}` : line
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const { id } = await ctx.params
    const requestId = Number(id)
    if (!Number.isFinite(requestId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 })

    const body = schema.parse(await req.json())

    const reviewer = await prisma.employee.findUnique({ where: { userId: session.user.id } })
    if (!reviewer) return NextResponse.json({ error: 'لا يوجد موظف مرتبط بحسابك' }, { status: 400 })

    const por = await prisma.positionOpeningRequest.findUnique({ where: { id: requestId } })
    if (!por) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })

    const now = new Date()

    if (body.decision === 'REJECT') {
      const noteLine = `❌ رفض (${session.user.role}) — ${now.toISOString()}\n${body.notes ?? ''}`.trim()
      const updated = await prisma.positionOpeningRequest.update({
        where: { id: por.id },
        data: {
          status: 'REJECTED',
          reviewedBy: reviewer.id,
          reviewedAt: now,
          reviewNotes: appendNote(por.reviewNotes ?? null, noteLine),
        },
      })

      return NextResponse.json({ request: updated })
    }

    // APPROVE
    if (por.status === 'PENDING') {
      // First stage: HR
      if (session.user.role === 'HR_EMPLOYEE') {
        const noteLine = `✅ موافقة مبدئية (HR) — ${now.toISOString()}\n${body.notes ?? ''}`.trim()
        const updated = await prisma.positionOpeningRequest.update({
          where: { id: por.id },
          data: {
            status: 'PENDING_FINAL',
            reviewedBy: reviewer.id,
            reviewedAt: now,
            reviewNotes: appendNote(por.reviewNotes ?? null, noteLine),
          },
        })
        return NextResponse.json({ request: updated })
      }

      // Admin can directly finalize
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'يتطلب اعتماد نهائي من الإدارة' }, { status: 403 })
    }

    // Final approval: create VACANT position (headcount validation)
    const department = por.department

    const headcount = await prisma.departmentHeadcount.findUnique({ where: { department } })
    const employeesCount = await prisma.employee.count({ where: { department } })
    const approvedCount = headcount?.approvedCount ?? employeesCount

    const openPositionsCount = await prisma.organizationalPosition.count({
      where: { department, status: { in: ['FILLED', 'VACANT'] } },
    })

    if (openPositionsCount >= approvedCount) {
      return NextResponse.json(
        {
          error: 'لا يوجد مساحة لفتح وظيفة جديدة ضمن الكادر المعتمد',
          details: { approvedCount, openPositionsCount },
        },
        { status: 400 }
      )
    }

    const year = new Date().getFullYear()
    const posCount = await prisma.organizationalPosition.count({
      where: {
        openedAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
      },
    })

    const code = `POS-${year}-${pad3(posCount + 1)}`

    const createdPosition = await prisma.organizationalPosition.create({
      data: {
        code,
        title: por.title,
        titleEn: null,
        department: por.department,
        level: por.level,
        status: 'VACANT',
        currentEmployeeId: null,
        salaryMin: por.salaryMin,
        salaryMax: por.salaryMax,
        description: null,
        requirements: null,
        openedBy: reviewer.id,
        approvalDocument: por.approvalDocument,
        approvalNotes: por.justification,
      },
    })

    await prisma.positionHistory.create({
      data: {
        positionId: createdPosition.id,
        action: 'OPENED',
        employeeId: null,
        performedBy: reviewer.id,
        notes: `Created from ${por.requestNumber}`,
      },
    })

    const noteLine = `✅ اعتماد نهائي (ADMIN) — ${now.toISOString()}\n${body.notes ?? ''}`.trim()

    const updated = await prisma.positionOpeningRequest.update({
      where: { id: por.id },
      data: {
        status: 'APPROVED',
        reviewedBy: reviewer.id,
        reviewedAt: now,
        reviewNotes: appendNote(por.reviewNotes ?? null, noteLine),
        createdPositionId: createdPosition.id,
      },
    })

    return NextResponse.json({ request: updated, createdPosition })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: error.errors }, { status: 400 })
    }
    console.error('Error reviewing POR:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 })
  }
}
