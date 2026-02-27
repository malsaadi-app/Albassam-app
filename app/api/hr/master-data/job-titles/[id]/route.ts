import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

const jobTitleSchema = z.object({
  nameAr: z.string().min(1).optional(),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  suggestedRoleId: z.string().nullable().optional(),
  isActive: z.boolean().optional()
});

// PATCH /api/hr/master-data/job-titles/[id]
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
    const validatedData = jobTitleSchema.parse(body);

    const jobTitle = await prisma.jobTitle.update({
      where: { id },
      data: validatedData,
      include: {
        suggestedRole: {
          select: {
            id: true,
            name: true,
            nameAr: true
          }
        }
      }
    });

    return NextResponse.json(jobTitle);
  } catch (error) {
    console.error('Error updating job title:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// DELETE /api/hr/master-data/job-titles/[id]
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

    await prisma.jobTitle.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job title:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
