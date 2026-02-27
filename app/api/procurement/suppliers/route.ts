import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/procurement/suppliers - Get all suppliers
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الموردين' },
      { status: 500 }
    );
  }
}

// POST /api/procurement/suppliers - Create new supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Only ADMIN or HR_EMPLOYEE can create suppliers directly.
    // Procurement officer should create a SupplierRequest instead.
    if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
      return NextResponse.json({ error: 'غير مصرح بإنشاء موردين مباشرة. ارفع طلب إضافة مورد.' }, { status: 403 });
    }

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

    if (!name) {
      return NextResponse.json(
        { error: 'اسم المورد مطلوب' },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        category: category || null,
        taxNumber: taxNumber || null,
        rating: rating !== undefined ? parseFloat(rating) : 0,
        notes: notes || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({
      message: 'تم إنشاء المورد بنجاح',
      supplier
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء المورد' },
      { status: 500 }
    );
  }
}
