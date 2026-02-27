import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

const jobTitleSchema = z.object({
  nameAr: z.string().min(1, 'المسمى الوظيفي مطلوب'),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  suggestedRoleId: z.string().nullable().optional(),
  isActive: z.boolean().default(true)
});

// GET /api/hr/master-data/job-titles
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const jobTitles = await prisma.jobTitle.findMany({
      include: {
        suggestedRole: {
          select: {
            id: true,
            name: true,
            nameAr: true
          }
        }
      },
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }]
    });

    return NextResponse.json({ jobTitles });
  } catch (error) {
    console.error('Error fetching job titles:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// POST /api/hr/master-data/job-titles
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(await cookies());
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = jobTitleSchema.parse(body);

    // Check if job title already exists
    const existing = await prisma.jobTitle.findFirst({
      where: { nameAr: validatedData.nameAr }
    });

    if (existing) {
      return NextResponse.json({ error: 'المسمى الوظيفي موجود مسبقاً' }, { status: 400 });
    }

    // Get max sort order
    const maxOrder = await prisma.jobTitle.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });

    const jobTitle = await prisma.jobTitle.create({
      data: {
        nameAr: validatedData.nameAr,
        nameEn: validatedData.nameEn || null,
        description: validatedData.description || null,
        category: validatedData.category || null,
        suggestedRoleId: validatedData.suggestedRoleId || null,
        isActive: validatedData.isActive,
        sortOrder: (maxOrder?.sortOrder || 0) + 1
      },
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

    return NextResponse.json(jobTitle, { status: 201 });
  } catch (error) {
    console.error('Error creating job title:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
