import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params

    const fr = await prisma.financeRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, displayName: true, username: true, role: true, systemRole: true } },
        departmentManager: { select: { id: true, displayName: true, username: true, role: true, systemRole: true } },
        accountant: { select: { id: true, displayName: true, username: true, role: true, systemRole: true } },
        financeManager: { select: { id: true, displayName: true, username: true, role: true, systemRole: true } }
      }
    })

    if (!fr) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const uid = session.user.id
    const canSee =
      fr.requesterId === uid ||
      fr.departmentManagerUserId === uid ||
      fr.accountantUserId === uid ||
      fr.financeManagerUserId === uid ||
      session.user.role === 'ADMIN'

    if (!canSee) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    return NextResponse.json({
      ...fr,
      attachments: fr.attachments ? JSON.parse(fr.attachments) : []
    })
  } catch (e) {
    console.error('GET /api/finance/requests/[id] error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الطلب' }, { status: 500 })
  }
}
