import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';


// GET /api/procurement/purchase-orders - قائمة أوامر الشراء
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.purchaseOrder.count({ where })
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}

// POST /api/procurement/purchase-orders - إنشاء أمر شراء
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const {
      purchaseRequestId,
      supplierId,
      items,
      expectedDelivery,
      totalAmount,
      tax,
      discount,
      finalAmount,
      paymentTerms,
      deliveryTerms,
      notes,
      attachments
    } = body;

    // التحقق من الحقول المطلوبة
    if (!supplierId || !items || !totalAmount) {
      return NextResponse.json(
        { error: 'الرجاء إدخال جميع البيانات المطلوبة' },
        { status: 400 }
      );
    }

    // إنشاء رقم أمر شراء
    const count = await prisma.purchaseOrder.count();
    const orderNumber = `PO${String(count + 1).padStart(6, '0')}`;

    // إنشاء أمر الشراء
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        purchaseRequestId: purchaseRequestId || '',
        supplierId,
        items: JSON.stringify(items),
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        totalAmount,
        tax: tax || 0,
        discount: discount || 0,
        finalAmount,
        paymentTerms,
        deliveryTerms,
        notes,
        attachments: attachments ? JSON.stringify(attachments) : null,
        createdById: session.user.id,
        status: 'PENDING'
      },
      include: {
        supplier: true
      }
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء أمر الشراء' },
      { status: 500 }
    );
  }
}
