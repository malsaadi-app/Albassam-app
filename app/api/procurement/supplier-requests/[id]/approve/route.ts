import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { approvalAudienceForRole } from '@/lib/approvalsPolicy'

// POST /api/procurement/supplier-requests/[id]/approve
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
      return NextResponse.json({ error: 'لا يمكن اعتماد هذا الطلب' }, { status: 400 })
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: reqRow.name,
        contactPerson: reqRow.contactPerson,
        email: reqRow.email,
        phone: reqRow.phone,
        address: reqRow.address,
        category: reqRow.category,
        taxNumber: reqRow.taxNumber,
        rating: reqRow.rating,
        notes: reqRow.notes,
        isActive: true
      }
    })

    const updated = await prisma.supplierRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: session.user.id,
        approvedAt: new Date(),
        createdSupplierId: supplier.id
      },
      include: {
        requestedBy: { select: { id: true, displayName: true, username: true } },
        approvedBy: { select: { id: true, displayName: true, username: true } },
        createdSupplier: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({ success: true, supplier, request: updated })
  } catch (error) {
    console.error('Error approving supplier request:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء الاعتماد' }, { status: 500 })
  }
}
