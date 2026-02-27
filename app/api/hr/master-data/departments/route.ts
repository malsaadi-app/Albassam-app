import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

const departmentSchema = z.object({
  nameAr: z.string().min(1, 'اسم القسم مطلوب'),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

// GET /api/hr/master-data/departments
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const departments = await prisma.department.findMany({
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }]
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// POST /api/hr/master-data/departments
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(await cookies());
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = departmentSchema.parse(body);

    // Check if department already exists
    const existing = await prisma.department.findFirst({
      where: { nameAr: validatedData.nameAr }
    });

    if (existing) {
      return NextResponse.json({ error: 'القسم موجود مسبقاً' }, { status: 400 });
    }

    // Get max sort order
    const maxOrder = await prisma.department.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });

    const department = await prisma.department.create({
      data: {
        ...validatedData,
        sortOrder: (maxOrder?.sortOrder || 0) + 1
      }
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
