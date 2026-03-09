import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

/**
 * POST - Add employees to role
 * Updates Employee.systemRoleId for multiple employees
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    // Check if user is ADMIN
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لتعديل الأدوار' },
        { status: 403 }
      );
    }

    const { id: roleId } = await params;
    const body = await request.json();
    const { employeeIds } = body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { error: 'يجب تحديد موظف واحد على الأقل' },
        { status: 400 }
      );
    }

    // Verify role exists
    const role = await prisma.systemRole.findUnique({
      where: { id: roleId },
      select: { id: true, nameAr: true }
    });

    if (!role) {
      return NextResponse.json(
        { error: 'الدور غير موجود' },
        { status: 404 }
      );
    }

    // Update employees
    await prisma.employee.updateMany({
      where: {
        id: { in: employeeIds },
        status: 'ACTIVE'
      },
      data: {
        systemRoleId: roleId
      }
    });

    // Fetch updated list
    const employees = await prisma.employee.findMany({
      where: {
        systemRoleId: roleId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        fullNameAr: true,
        employeeNumber: true,
        position: true,
        department: true
      },
      orderBy: { fullNameAr: 'asc' }
    });

    return NextResponse.json({
      success: true,
      employees,
      message: `تمت إضافة ${employeeIds.length} موظف بنجاح`
    });

  } catch (error) {
    console.error('Error adding employees to role:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة الموظفين' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove employees from role
 * Sets Employee.systemRoleId to null for specified employees
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    // Check if user is ADMIN
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لتعديل الأدوار' },
        { status: 403 }
      );
    }

    const { id: roleId } = await params;
    const body = await request.json();
    const { employeeIds } = body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { error: 'يجب تحديد موظف واحد على الأقل' },
        { status: 400 }
      );
    }

    // Remove role from employees
    await prisma.employee.updateMany({
      where: {
        id: { in: employeeIds },
        systemRoleId: roleId
      },
      data: {
        systemRoleId: null
      }
    });

    // Fetch updated list
    const employees = await prisma.employee.findMany({
      where: {
        systemRoleId: roleId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        fullNameAr: true,
        employeeNumber: true,
        position: true,
        department: true
      },
      orderBy: { fullNameAr: 'asc' }
    });

    return NextResponse.json({
      success: true,
      employees,
      message: `تمت إزالة ${employeeIds.length} موظف بنجاح`
    });

  } catch (error) {
    console.error('Error removing employees from role:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إزالة الموظفين' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get employees for role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'غير مصرح - يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }

    const { id: roleId } = await params;

    const employees = await prisma.employee.findMany({
      where: {
        systemRoleId: roleId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        fullNameAr: true,
        employeeNumber: true,
        position: true,
        department: true
      },
      orderBy: { fullNameAr: 'asc' }
    });

    return NextResponse.json({ employees });

  } catch (error) {
    console.error('Error fetching role employees:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الموظفين' },
      { status: 500 }
    );
  }
}
