import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { approvalAudienceForRole } from '@/lib/approvalsPolicy'

// POST /api/procurement/supplier-requests/[id]/reject
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const role = session.user.role
    const audience = approvalAudienceForRole(role)
    if (!audience.canApproveSupplierRequests) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const { id } = await params

    const reqRow = await prisma.supplierRequest.findUnique({ where: { id } })
    if (!reqRow) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    if (reqRow.status !== 'PENDING') {
      return NextResponse.json({ error: 'لا يمكن رفض هذا الطلب' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const reason = body?.reason ? String(body.reason) : null
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'سبب الرفض مطلوب' }, { status: 400 })
    }

    const updated = await prisma.supplierRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedById: session.user.id,
        rejectedAt: new Date(),
        rejectionReason: reason
      },
      include: {
        requestedBy: { select: { id: true, displayName: true, username: true } },
        rejectedBy: { select: { id: true, displayName: true, username: true } }
      }
    })

    return NextResponse.json({ success: true, request: updated })
  } catch (error) {
    console.error('Error rejecting supplier request:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء الرفض' }, { status: 500 })
  }
}
