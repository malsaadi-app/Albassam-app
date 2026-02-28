import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/session';


const updateEmployeeSchema = z.object({
  fullNameAr: z.string().min(1).optional(),
  fullNameEn: z.string().optional(),
  nationalId: z.string().min(10).optional(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  systemRoleId: z.string().optional(),
  directManager: z.string().optional(),
  employmentType: z.enum(['PERMANENT', 'TEMPORARY', 'CONTRACT']).optional(),
  contractEndDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED']).optional(),
  basicSalary: z.number().min(0).optional(),
  housingAllowance: z.number().min(0).optional(),
  transportAllowance: z.number().min(0).optional(),
  otherAllowances: z.number().min(0).optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  iban: z.string().optional(),
  education: z.string().optional(),
  certifications: z.string().optional(),
  photoUrl: z.string().optional()
});

// GET /api/hr/employees/[id] - تفاصيل موظف
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

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        branch: true,
        stage: true,
        departmentRef: true,
        jobTitleRef: true,
        leaves: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        leaveBalance: true,
        documents: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}

// PUT /api/hr/employees/[id] - تعديل موظف (ADMIN + HR_EMPLOYEE)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());

    if (!session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};

    // Map fields from form
    if (body.employeeNumber) updateData.employeeNumber = body.employeeNumber;

    // Backward-compatible field names from older forms
    const fullNameAr = body.fullNameAr ?? body.arabicName;
    const fullNameEn = body.fullNameEn ?? body.englishName;

    if (fullNameAr) updateData.fullNameAr = fullNameAr;
    if (fullNameEn !== undefined) updateData.fullNameEn = fullNameEn;
    if (body.nationalId !== undefined) updateData.nationalId = body.nationalId;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.gender) updateData.gender = body.gender;
    if (body.nationality !== undefined) updateData.nationality = body.nationality;
    if (body.dateOfBirth) updateData.dateOfBirth = new Date(body.dateOfBirth);
    if (body.hireDate) updateData.hireDate = new Date(body.hireDate);
    if (body.position !== undefined) updateData.position = body.position;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.systemRoleId !== undefined) updateData.systemRoleId = body.systemRoleId || null;
    if (body.status) updateData.status = body.status;
    if (body.basicSalary !== undefined) updateData.basicSalary = body.basicSalary;
    if (body.housingAllowance !== undefined) updateData.housingAllowance = body.housingAllowance;
    if (body.transportAllowance !== undefined) updateData.transportAllowance = body.transportAllowance;
    if (body.otherAllowances !== undefined) updateData.otherAllowances = body.otherAllowances;
    if (body.bankName !== undefined) updateData.bankName = body.bankName;
    if (body.iban !== undefined) updateData.iban = body.iban;
    if (body.education !== undefined) updateData.education = body.education;
    if (body.certifications !== undefined) updateData.certifications = body.certifications;

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData
    });

    // Update emergency leave balance if provided
    if (body.emergencyLeaveBalance !== undefined) {
      const newEmergencyTotal = parseInt(body.emergencyLeaveBalance) || 0;
      
      // Check if leave balance exists
      const existingBalance = await prisma.leaveBalance.findUnique({
        where: { employeeId: id }
      });

      if (existingBalance) {
        // Calculate remaining based on used
        const emergencyRemaining = Math.max(0, newEmergencyTotal - existingBalance.emergencyUsed);
        
        await prisma.leaveBalance.update({
          where: { employeeId: id },
          data: {
            emergencyTotal: newEmergencyTotal,
            emergencyRemaining: emergencyRemaining
          }
        });
      } else {
        // Create new leave balance if doesn't exist
        const currentYear = new Date().getFullYear();
        await prisma.leaveBalance.create({
          data: {
            employeeId: id,
            year: currentYear,
            emergencyTotal: newEmergencyTotal,
            emergencyUsed: 0,
            emergencyRemaining: newEmergencyTotal
          }
        });
      }
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحديث' },
      { status: 500 }
    );
  }
}

// PATCH /api/hr/employees/[id] - تعديل موظف
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());

    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateEmployeeSchema.parse(body);

    const updateData: any = { ...validatedData };

    if (validatedData.dateOfBirth) {
      updateData.dateOfBirth = new Date(validatedData.dateOfBirth);
    }

    if (validatedData.contractEndDate) {
      updateData.contractEndDate = new Date(validatedData.contractEndDate);
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحديث' },
      { status: 500 }
    );
  }
}

// DELETE /api/hr/employees/[id] - حذف موظف (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());

    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete by setting status to TERMINATED
    await prisma.employee.update({
      where: { id },
      data: { status: 'TERMINATED' }
    });

    return NextResponse.json({ message: 'تم حذف الموظف بنجاح' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الحذف' },
      { status: 500 }
    );
  }
}
