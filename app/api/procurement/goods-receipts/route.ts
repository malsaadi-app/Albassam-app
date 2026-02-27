import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET /api/procurement/goods-receipts - list goods receipts (ADMIN)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const purchaseOrderId = searchParams.get('purchaseOrderId')
    const status = searchParams.get('status')

    const where: any = {}
    if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId
    if (status) where.status = status

    const receipts = await prisma.goodsReceipt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        purchaseOrder: {
          include: {
            supplier: true
          }
        }
      }
    })

    const withParsed = receipts.map((r) => ({
      ...r,
      items: JSON.parse(r.items),
      attachments: r.attachments ? JSON.parse(r.attachments) : []
    }))

    return NextResponse.json({ receipts: withParsed })
  } catch (error) {
    console.error('Error fetching goods receipts:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 })
  }
}

// POST /api/procurement/goods-receipts - create goods receipt (ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = await request.json()
    const { purchaseOrderId, receivedBy, items, notes, attachments, qualityCheck, qualityNotes } = body

    if (!purchaseOrderId || !receivedBy || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'البيانات المطلوبة ناقصة' }, { status: 400 })
    }

    // Ensure purchase order exists
    const order = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } })
    if (!order) {
      return NextResponse.json({ error: 'أمر الشراء غير موجود' }, { status: 404 })
    }

    // Generate receipt number GR-YYYY-####
    const year = new Date().getFullYear()
    const count = await prisma.goodsReceipt.count({
      where: {
        receiptNumber: {
          startsWith: `GR-${year}-`
        }
      }
    })
    const receiptNumber = `GR-${year}-${String(count + 1).padStart(4, '0')}`

    const receipt = await prisma.goodsReceipt.create({
      data: {
        receiptNumber,
        purchaseOrderId,
        receivedBy,
        items: JSON.stringify(items),
        status: 'PENDING',
        notes: notes || null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        qualityCheck: qualityCheck === true,
        qualityNotes: qualityNotes || null
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      receipt: {
        ...receipt,
        items: JSON.parse(receipt.items),
        attachments: receipt.attachments ? JSON.parse(receipt.attachments) : []
      }
    })
  } catch (error) {
    console.error('Error creating goods receipt:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء الإنشاء' }, { status: 500 })
  }
}
