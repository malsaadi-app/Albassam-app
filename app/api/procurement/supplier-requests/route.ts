import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { canCreateSupplierRequest, approvalAudienceForRole } from '@/lib/approvalsPolicy'

// GET /api/procurement/supplier-requests
// - Procurement officer: sees own requests
// - Approver roles: see pending
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const role = session.user.role
    const audience = approvalAudienceForRole(role)

    if (audience.canApproveSupplierRequests) {
      // approver can see all (default: pending)
      if (!status) where.status = 'PENDING'
    } else {
      // requester sees only own
      where.requestedById = session.user.id
    }

    const requests = await prisma.supplierRequest.findMany({
      where,
      include: {
        requestedBy: { select: { id: true, displayName: true, username: true } },
        approvedBy: { select: { id: true, displayName: true, username: true } },
        rejectedBy: { select: { id: true, displayName: true, username: true } },
        createdSupplier: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching supplier requests:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 })
  }
}

// POST /api/procurement/supplier-requests
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    if (!canCreateSupplierRequest(session.user.role)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      category,
      taxNumber,
      rating,
      notes
    } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'اسم المورد مطلوب' }, { status: 400 })
    }

    const reqRow = await prisma.supplierRequest.create({
      data: {
        requestedById: session.user.id,
        name: name.trim(),
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        category: category || null,
        taxNumber: taxNumber || null,
        rating: rating !== undefined && rating !== null ? parseFloat(String(rating)) : 0,
        notes: notes || null,
        status: 'PENDING'
      },
      include: {
        requestedBy: { select: { id: true, displayName: true, username: true } }
      }
    })

    return NextResponse.json({ success: true, request: reqRow })
  } catch (error) {
    console.error('Error creating supplier request:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء الإنشاء' }, { status: 500 })
  }
}
