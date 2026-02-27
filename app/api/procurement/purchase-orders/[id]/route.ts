import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';


// GET /api/procurement/purchase-orders/[id] - تفاصيل أمر شراء
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        goodsReceipts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'أمر الشراء غير موجود' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}

// PUT /api/procurement/purchase-orders/[id] - تحديث أمر شراء
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.expectedDelivery) updateData.expectedDelivery = new Date(body.expectedDelivery);
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.cancelledReason !== undefined) updateData.cancelledReason = body.cancelledReason;
    if (body.approvedById) {
      updateData.approvedById = body.approvedById;
      updateData.approvedAt = new Date();
    }

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحديث' },
      { status: 500 }
    );
  }
}

// DELETE /api/procurement/purchase-orders/[id] - حذف أمر شراء
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete: تغيير الحالة إلى CANCELLED
    await prisma.purchaseOrder.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        cancelledReason: 'تم الحذف من قبل المسؤول'
      }
    });

    return NextResponse.json({ message: 'تم حذف أمر الشراء' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الحذف' },
      { status: 500 }
    );
  }
}
