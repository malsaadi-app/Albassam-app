import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

const departmentSchema = z.object({
  nameAr: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

// PATCH /api/hr/master-data/departments/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = departmentSchema.parse(body);

    const department = await prisma.department.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// DELETE /api/hr/master-data/departments/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.department.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
