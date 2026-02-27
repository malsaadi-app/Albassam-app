import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';


// POST /api/hr/employees/bulk-update - تعديل جماعي للموظفين
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { employeeIds, field, value } = body;

    // Validation
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ error: 'يجب اختيار موظف واحد على الأقل' }, { status: 400 });
    }

    if (!field) {
      return NextResponse.json({ error: 'يجب اختيار الحقل المراد تعديله' }, { status: 400 });
    }

    // Handle different field types
    let updateData: any = {};
    let leaveBalanceUpdate: any = null;

    switch (field) {
      case 'annualLeaveBalance':
        leaveBalanceUpdate = {
          annualTotal: parseInt(value) || 0,
          annualRemaining: parseInt(value) || 0  // Reset remaining to new total
        };
        break;

      case 'casualLeaveBalance':
        leaveBalanceUpdate = {
          casualTotal: parseInt(value) || 0,
          casualRemaining: parseInt(value) || 0
        };
        break;

      case 'emergencyLeaveBalance':
        leaveBalanceUpdate = {
          emergencyTotal: parseInt(value) || 0,
          emergencyRemaining: parseInt(value) || 0
        };
        break;

      case 'status':
        updateData.status = value;
        break;

      case 'department':
        updateData.department = value;
        break;

      case 'position':
        updateData.position = value;
        break;

      case 'basicSalary':
        updateData.basicSalary = parseFloat(value) || 0;
        break;

      case 'housingAllowance':
        updateData.housingAllowance = parseFloat(value) || 0;
        break;

      case 'transportAllowance':
        updateData.transportAllowance = parseFloat(value) || 0;
        break;

      default:
        return NextResponse.json({ error: 'حقل غير مدعوم' }, { status: 400 });
    }

    let updatedCount = 0;

    // Update employees
    if (Object.keys(updateData).length > 0) {
      const result = await prisma.employee.updateMany({
        where: {
          id: { in: employeeIds }
        },
        data: updateData
      });
      updatedCount = result.count;
    }

    // Update leave balances if needed
    if (leaveBalanceUpdate) {
      const currentYear = new Date().getFullYear();

      for (const employeeId of employeeIds) {
        const existingBalance = await prisma.leaveBalance.findUnique({
          where: { employeeId }
        });

        if (existingBalance) {
          // Calculate remaining based on existing used
          if (field === 'annualLeaveBalance') {
            leaveBalanceUpdate.annualRemaining = Math.max(0, leaveBalanceUpdate.annualTotal - existingBalance.annualUsed);
          } else if (field === 'casualLeaveBalance') {
            leaveBalanceUpdate.casualRemaining = Math.max(0, leaveBalanceUpdate.casualTotal - existingBalance.casualUsed);
          } else if (field === 'emergencyLeaveBalance') {
            leaveBalanceUpdate.emergencyRemaining = Math.max(0, leaveBalanceUpdate.emergencyTotal - existingBalance.emergencyUsed);
          }

          await prisma.leaveBalance.update({
            where: { employeeId },
            data: leaveBalanceUpdate
          });
        } else {
          // Create new leave balance
          await prisma.leaveBalance.create({
            data: {
              employeeId,
              year: currentYear,
              annualTotal: field === 'annualLeaveBalance' ? leaveBalanceUpdate.annualTotal : 30,
              annualUsed: 0,
              annualRemaining: field === 'annualLeaveBalance' ? leaveBalanceUpdate.annualRemaining : 30,
              casualTotal: field === 'casualLeaveBalance' ? leaveBalanceUpdate.casualTotal : 5,
              casualUsed: 0,
              casualRemaining: field === 'casualLeaveBalance' ? leaveBalanceUpdate.casualRemaining : 5,
              emergencyTotal: field === 'emergencyLeaveBalance' ? leaveBalanceUpdate.emergencyTotal : 0,
              emergencyUsed: 0,
              emergencyRemaining: field === 'emergencyLeaveBalance' ? leaveBalanceUpdate.emergencyRemaining : 0
            }
          });
        }
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم تحديث ${updatedCount} موظف بنجاح`,
      updatedCount
    });
  } catch (error) {
    console.error('Error bulk updating employees:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحديث الجماعي' },
      { status: 500 }
    );
  }
}
