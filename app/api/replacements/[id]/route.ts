import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await ctx.params
    const replacementId = Number(id)
    if (!Number.isFinite(replacementId)) return NextResponse.json({ error: 'معرف غير صحيح' }, { status: 400 })

    const replacement = await prisma.replacementRequest.findUnique({
      where: { id: replacementId },
      include: {
        position: { select: { id: true, title: true, code: true, department: true, inReplacement: true, activeReplacementId: true } },
        currentEmployee: { select: { id: true, fullNameAr: true, employeeNumber: true, department: true, position: true, userId: true } },
        newEmployee: { select: { id: true, fullNameAr: true, employeeNumber: true, department: true, position: true, userId: true } },
        requestedByUser: { select: { id: true, displayName: true, username: true, role: true } },
        evaluatedByUser: { select: { id: true, displayName: true, username: true } },
        decisionByUser: { select: { id: true, displayName: true, username: true } },
        performanceReports: { orderBy: { createdAt: 'desc' } },
        timeline: { orderBy: { createdAt: 'desc' } },
        notifications: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    })

    if (!replacement) return NextResponse.json({ error: 'غير موجود' }, { status: 404 })

    return NextResponse.json({ replacement })
  } catch (e) {
    console.error('GET /api/replacements/[id] error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 })
  }
}
