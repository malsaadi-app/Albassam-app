import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { canCreateFinanceRequest, resolveFinanceRouting } from '@/lib/finance/routing'

function requireAuth(session: any) {
  if (!session?.user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  return null
}

function nextNumber(prefix: string, count: number) {
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`
}

// GET /api/finance/requests
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    const unauth = requireAuth(session)
    if (unauth) return unauth
    const user = session.user!

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const userId = user.id

    // Requester sees own + routed users see their queues.
    where.OR = [
      { requesterId: userId },
      { departmentManagerUserId: userId },
      { accountantUserId: userId },
      { financeManagerUserId: userId }
    ]

    const requests = await prisma.financeRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, displayName: true, username: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({ requests })
  } catch (e) {
    console.error('GET /api/finance/requests error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 })
  }
}

// POST /api/finance/requests
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    const unauth = requireAuth(session)
    if (unauth) return unauth
    const user = session.user!

    if (!canCreateFinanceRequest(user.role)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = await request.json()
    const { type, title, description, amount, beneficiaryName, attachments, department } = body

    if (!type || !title || !amount) {
      return NextResponse.json({ error: 'البيانات المطلوبة ناقصة' }, { status: 400 })
    }

    const routing = await resolveFinanceRouting(String(department || 'HR'))

    const year = new Date().getFullYear()
    const count = await prisma.financeRequest.count({
      where: {
        requestNumber: { startsWith: `FIN-${year}-` }
      }
    })

    const requestNumber = nextNumber('FIN', count)

    const fr = await prisma.financeRequest.create({
      data: {
        requestNumber,
        type: String(type),
        title: String(title),
        description: description ? String(description) : null,
        amount: Number(amount),
        beneficiaryName: beneficiaryName ? String(beneficiaryName) : null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        department: department ? String(department) : null,
        requesterId: user.id,
        status: 'PENDING',
        currentStep: 'DEPARTMENT_MANAGER',
        departmentManagerUserId: routing.departmentManagerUserId,
        accountantUserId: routing.accountantUserId,
        financeManagerUserId: routing.financeManagerUserId
      },
      include: {
        requester: { select: { id: true, displayName: true, username: true } }
      }
    })

    return NextResponse.json({ success: true, request: fr })
  } catch (e) {
    console.error('POST /api/finance/requests error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء الإنشاء' }, { status: 500 })
  }
}
