import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/procurement/quotations/[id] - Get quotation by ID
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

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        supplier: true
      }
    });

    if (!quotation) {
      return NextResponse.json(
        { error: 'عرض السعر غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json(
      { error: 'فشل في جلب عرض السعر' },
      { status: 500 }
    );
  }
}

// PUT /api/procurement/quotations/[id] - Update quotation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const {
      quotedItems,
      totalAmount,
      validUntil,
      paymentTerms,
      deliveryTime,
      notes,
      status,
      attachments
    } = body;

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        quotedItems: quotedItems ? JSON.stringify(quotedItems) : undefined,
        totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        paymentTerms: paymentTerms !== undefined ? paymentTerms : undefined,
        deliveryTime: deliveryTime !== undefined ? deliveryTime : undefined,
        notes: notes !== undefined ? notes : undefined,
        status: status || undefined,
        attachments: attachments ? JSON.stringify(attachments) : undefined
      },
      include: {
        supplier: true
      }
    });

    return NextResponse.json({
      message: 'تم تحديث عرض السعر بنجاح',
      quotation
    });
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث عرض السعر' },
      { status: 500 }
    );
  }
}

// DELETE /api/procurement/quotations/[id] - Delete quotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Only ADMIN can delete quotations
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح بحذف عروض الأسعار' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.quotation.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'تم حذف عرض السعر بنجاح'
    });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json(
      { error: 'فشل في حذف عرض السعر' },
      { status: 500 }
    );
  }
}
