import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { withCache, buildCacheKey, CACHE_PREFIX, CACHE_TTL, invalidateEmployeeCache } from '@/lib/cache';

// Validation schema
const employeeSchema = z.object({
  fullNameAr: z.string().min(1, 'الاسم بالعربي مطلوب'),
  fullNameEn: z.string().optional(),
  nationalId: z.string().min(10, 'رقم الهوية يجب أن يكون 10 أرقام'),
  nationality: z.string().min(1, 'الجنسية مطلوبة'),
  dateOfBirth: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']),
  phone: z.string().min(10, 'رقم الجوال مطلوب'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  employeeNumber: z.string().min(1, 'رقم الموظف مطلوب'),
  department: z.string().min(1, 'القسم مطلوب'),
  position: z.string().min(1, 'المسمى الوظيفي مطلوب'),
  systemRoleId: z.string().optional(),
  branchId: z.string().optional(),
  stageId: z.string().optional(),
  directManager: z.string().optional(),
  hireDate: z.string(),
  employmentType: z.enum(['PERMANENT', 'TEMPORARY', 'CONTRACT']),
  contractEndDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED']).default('ACTIVE'),
  basicSalary: z.number().min(0),
  housingAllowance: z.number().min(0).default(0),
  transportAllowance: z.number().min(0).default(0),
  otherAllowances: z.number().min(0).default(0),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  iban: z.string().optional(),
  education: z.string().optional(),
  certifications: z.string().optional(),
  photoUrl: z.string().optional(),
  organizationalPositionId: z.number().optional()
});

// GET /api/hr/employees - قائمة الموظفين
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};

    if (search) {
      where.OR = [
        { fullNameAr: { contains: search } },
        { fullNameEn: { contains: search } },
        { employeeNumber: { contains: search } },
        { nationalId: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } }
      ];
    }

    if (department) {
      where.department = department;
    }

    if (status) {
      where.status = status;
    }

    // Build cache key based on query params
    const cacheKey = buildCacheKey(
      CACHE_PREFIX.EMPLOYEE,
      'list',
      search,
      department,
      status,
      page.toString(),
      limit.toString()
    );

    // Use cache with 5-minute TTL for list queries
    const result = await withCache(
      cacheKey,
      async () => {
        const [employees, total] = await Promise.all([
          prisma.employee.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              fullNameAr: true,
              fullNameEn: true,
              employeeNumber: true,
              department: true,
              position: true,
              phone: true,
              email: true,
              status: true,
              hireDate: true,
              photoUrl: true,
              basicSalary: true,
              housingAllowance: true,
              transportAllowance: true,
              otherAllowances: true,
              userId: true
            }
          }),
          prisma.employee.count({ where })
        ]);

        return {
          employees,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          }
        };
      },
      CACHE_TTL.LIST_DATA // 10 minutes
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}

// POST /api/hr/employees - إضافة موظف جديد
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = employeeSchema.parse(body);

    // Check if employee number or national ID already exists
    const existing = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeNumber: validatedData.employeeNumber },
          { nationalId: validatedData.nationalId }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'رقم الموظف أو رقم الهوية موجود مسبقاً' },
        { status: 400 }
      );
    }

    const { organizationalPositionId, ...employeeData } = validatedData;

    const employee = await prisma.employee.create({
      data: {
        ...employeeData,
        dateOfBirth: new Date(employeeData.dateOfBirth),
        hireDate: new Date(employeeData.hireDate),
        contractEndDate: employeeData.contractEndDate
          ? new Date(employeeData.contractEndDate)
          : undefined
      }
    });

    // Create leave balance
    // إجازات اضطرارية: 5 أيام للإناث، 0 للذكور (افتراضياً)
    const emergencyLeaveForFemales = validatedData.gender === 'FEMALE' ? 5 : 0;
    
    await prisma.leaveBalance.create({
      data: {
        employeeId: employee.id,
        year: new Date().getFullYear(),
        annualTotal: 30,
        annualUsed: 0,
        annualRemaining: 30,
        casualTotal: 5,
        casualUsed: 0,
        casualRemaining: 5,
        emergencyTotal: emergencyLeaveForFemales,
        emergencyUsed: 0,
        emergencyRemaining: emergencyLeaveForFemales
      }
    });

    // Link to organizational position if provided
    if (organizationalPositionId) {
      await prisma.organizationalPosition.update({
        where: { id: organizationalPositionId },
        data: {
          status: 'FILLED',
          currentEmployeeId: employee.id
        }
      });
    }

    // Invalidate employee list cache
    await invalidateEmployeeCache();

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الموظف' },
      { status: 500 }
    );
  }
}
