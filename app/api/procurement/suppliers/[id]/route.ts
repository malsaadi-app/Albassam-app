import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/procurement/suppliers/[id] - Get supplier by ID
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

    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'المورد غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { error: 'فشل في جلب المورد' },
      { status: 500 }
    );
  }
}

// PUT /api/procurement/suppliers/[id] - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Only ADMIN or HR_EMPLOYEE can update suppliers
    if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
      return NextResponse.json({ error: 'غير مصرح بتعديل موردين' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      category,
      taxNumber,
      rating,
      notes,
      isActive
    } = body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: name || undefined,
        contactPerson: contactPerson !== undefined ? contactPerson : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined,
        category: category !== undefined ? category : undefined,
        taxNumber: taxNumber !== undefined ? taxNumber : undefined,
        rating: rating !== undefined ? parseFloat(rating) : undefined,
        notes: notes !== undefined ? notes : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    return NextResponse.json({
      message: 'تم تحديث المورد بنجاح',
      supplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث المورد' },
      { status: 500 }
    );
  }
}

// DELETE /api/procurement/suppliers/[id] - Delete supplier (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Only ADMIN can delete suppliers
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح بحذف موردين' }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete by setting isActive to false
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({
      message: 'تم حذف المورد بنجاح',
      supplier
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'فشل في حذف المورد' },
      { status: 500 }
    );
  }
}
