import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET /api/procurement/goods-receipts/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const { id } = await params

    const receipt = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            supplier: true
          }
        }
      }
    })

    if (!receipt) {
      return NextResponse.json({ error: 'سند الاستلام غير موجود' }, { status: 404 })
    }

    return NextResponse.json({
      receipt: {
        ...receipt,
        items: JSON.parse(receipt.items),
        attachments: receipt.attachments ? JSON.parse(receipt.attachments) : []
      }
    })
  } catch (error) {
    console.error('Error fetching goods receipt:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 })
  }
}

// PUT /api/procurement/goods-receipts/[id] - update status/notes/quality
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.status) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.qualityCheck !== undefined) updateData.qualityCheck = body.qualityCheck
    if (body.qualityNotes !== undefined) updateData.qualityNotes = body.qualityNotes
    if (body.damageReport !== undefined) updateData.damageReport = body.damageReport
    if (body.attachments) updateData.attachments = JSON.stringify(body.attachments)
    if (body.items) updateData.items = JSON.stringify(body.items)

    const receipt = await prisma.goodsReceipt.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating goods receipt:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء التحديث' }, { status: 500 })
  }
}
