import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/procurement/quotations - Get all quotations
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const purchaseRequestId = searchParams.get('purchaseRequestId');
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status');

    const where: any = {};

    if (purchaseRequestId) {
      where.purchaseRequestId = purchaseRequestId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status;
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            email: true,
            phone: true,
            rating: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ quotations });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { error: 'فشل في جلب عروض الأسعار' },
      { status: 500 }
    );
  }
}

// POST /api/procurement/quotations - Create new quotation
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const {
      purchaseRequestId,
      supplierId,
      quotedItems,
      totalAmount,
      validUntil,
      paymentTerms,
      deliveryTime,
      notes,
      attachments
    } = body;

    if (!purchaseRequestId || !supplierId || !quotedItems || !totalAmount) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة ناقصة' },
        { status: 400 }
      );
    }

    // Generate quotation number (Q-YYYY-####)
    const year = new Date().getFullYear();
    const count = await prisma.quotation.count({
      where: {
        quotationNumber: {
          startsWith: `Q-${year}-`
        }
      }
    });
    const quotationNumber = `Q-${year}-${String(count + 1).padStart(4, '0')}`;

    const quotation = await prisma.quotation.create({
      data: {
        purchaseRequestId,
        supplierId,
        quotationNumber,
        quotedItems: JSON.stringify(quotedItems),
        totalAmount: parseFloat(totalAmount),
        validUntil: validUntil ? new Date(validUntil) : null,
        paymentTerms: paymentTerms || null,
        deliveryTime: deliveryTime || null,
        notes: notes || null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        status: 'PENDING'
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'تم إنشاء عرض السعر بنجاح',
      quotation
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء عرض السعر' },
      { status: 500 }
    );
  }
}
