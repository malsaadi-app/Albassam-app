import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const publicApplicationSchema = z.object({
  fullNameAr: z.string().min(1, 'الاسم مطلوب'),
  fullNameEn: z.string().optional(),
  nationalId: z.string().min(10, 'رقم الهوية يجب أن يكون 10 أرقام'),
  nationality: z.string().min(1, 'الجنسية مطلوبة'),
  dateOfBirth: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']),
  phone: z.string().min(10, 'رقم الجوال مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  address: z.string().min(1, 'العنوان مطلوب'),
  city: z.string().min(1, 'المدينة مطلوبة'),
  education: z.string().min(1, 'المؤهل العلمي مطلوب'),
  certifications: z.string().optional(),
  experience: z.string().optional(),
  coverLetter: z.string().optional(),
  source: z.string().default('PUBLIC_FORM'),
  status: z.string().default('PENDING')
});

// POST /api/hr/job-applications/public - Public endpoint (no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = publicApplicationSchema.parse(body);

    // Check if application with same nationalId already exists
    const existing = await prisma.jobApplication.findFirst({
      where: {
        nationalId: validatedData.nationalId,
        status: {
          in: ['PENDING', 'REVIEWING', 'INTERVIEWED']
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'يوجد طلب سابق بنفس رقم الهوية قيد المراجعة' },
        { status: 400 }
      );
    }

    // Generate application number
    const count = await prisma.jobApplication.count();
    const applicationNumber = `APP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const application = await prisma.jobApplication.create({
      data: {
        ...validatedData,
        applicationNumber,
        applicantName: validatedData.fullNameAr, // Required field
        dateOfBirth: new Date(validatedData.dateOfBirth),
        applicationDate: new Date(),
        status: 'PENDING',
        source: 'PUBLIC_FORM'
      }
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'تم إرسال طلبك بنجاح',
        applicationId: application.id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating public application:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}
