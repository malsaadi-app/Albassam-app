import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

const schema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().optional(),
})

function appendNote(prev: string | null, line: string) {
  const p = (prev ?? '').trim()
  return p ? `${p}\n\n${line}` : line
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'يتطلب اعتماد من الإدارة' }, { status: 403 })
    }

    const { id } = await ctx.params
    const requestId = Number(id)
    if (!Number.isFinite(requestId)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 })

    const body = schema.parse(await req.json())

    const reviewer = await prisma.employee.findUnique({ where: { userId: session.user.id } })
    if (!reviewer) return NextResponse.json({ error: 'لا يوجد موظف مرتبط بحسابك' }, { status: 400 })

    const hcr = await prisma.headcountChangeRequest.findUnique({
      where: { id: requestId },
      include: { departmentHeadcount: true },
    })

    if (!hcr) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })

    const now = new Date()

    if (body.decision === 'REJECT') {
      const noteLine = `❌ رفض (ADMIN) — ${now.toISOString()}\n${body.notes ?? ''}`.trim()
      const updated = await prisma.headcountChangeRequest.update({
        where: { id: hcr.id },
        data: {
          status: 'REJECTED',
          reviewedBy: reviewer.id,
          reviewedAt: now,
          reviewNotes: appendNote(hcr.reviewNotes ?? null, noteLine),
        },
      })

      return NextResponse.json({ request: updated })
    }

    // APPROVE: update department headcount approvedCount
    const noteLine = `✅ موافقة (ADMIN) — ${now.toISOString()}\n${body.notes ?? ''}`.trim()

    await prisma.departmentHeadcount.update({
      where: { id: hcr.departmentHeadcountId },
      data: {
        approvedCount: hcr.requestedCount,
        approvalDocument: hcr.approvalDocument,
        approvedBy: reviewer.id,
        approvedAt: now,
        notes: appendNote(hcr.departmentHeadcount.notes ?? null, `Updated via ${hcr.requestNumber}`),
      },
    })

    const updated = await prisma.headcountChangeRequest.update({
      where: { id: hcr.id },
      data: {
        status: 'APPROVED',
        reviewedBy: reviewer.id,
        reviewedAt: now,
        reviewNotes: appendNote(hcr.reviewNotes ?? null, noteLine),
      },
    })

    return NextResponse.json({ request: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: error.errors }, { status: 400 })
    }
    console.error('Error reviewing HCR:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 })
  }
}
