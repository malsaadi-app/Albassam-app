import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';


// Helper function to calculate days between dates
function calculateDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end date
}

// GET /api/hr/leave-balance - Get current user's leave balance
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Get employee record
    const employee = await prisma.employee.findFirst({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'لا يوجد سجل موظف لهذا المستخدم' },
        { status: 404 }
      );
    }

    const currentYear = new Date().getFullYear();

    // Get or create leave balance
    let balance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: employee.id,
        year: currentYear
      }
    });

    // If balance doesn't exist, create one with default values
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          year: currentYear,
          annualTotal: 30,
          annualUsed: 0,
          annualRemaining: 30,
          casualTotal: 5,
          casualUsed: 0,
          casualRemaining: 5
        }
      });
    }

    // Calculate used and pending days from HR requests
    const leaveRequests = await prisma.hRRequest.findMany({
      where: {
        // HRRequest.employeeId references Employee.id (not User.id)
        employeeId: employee.id,
        type: 'LEAVE',
        startDate: {
          gte: new Date(currentYear, 0, 1), // Jan 1st
          lte: new Date(currentYear, 11, 31) // Dec 31st
        }
      }
    });

    let approvedDays = 0;
    let pendingDays = 0;

    for (const request of leaveRequests) {
      if (request.startDate && request.endDate) {
        const days = calculateDays(request.startDate, request.endDate);
        
        if (request.status === 'APPROVED') {
          approvedDays += days;
        } else if (request.status === 'PENDING_REVIEW' || request.status === 'PENDING_APPROVAL') {
          pendingDays += days;
        }
      }
    }

    // Update balance if needed
    if (balance.annualUsed !== approvedDays) {
      balance = await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          annualUsed: approvedDays,
          annualRemaining: balance.annualTotal - approvedDays
        }
      });
    }

    // Return balance with calculated values
    return NextResponse.json({
      balance: {
        total: balance.annualTotal,
        used: approvedDays,
        pending: pendingDays,
        remaining: balance.annualTotal - approvedDays,
        availableAfterPending: balance.annualTotal - approvedDays - pendingDays
      },
      employee: {
        fullNameAr: employee.fullNameAr,
        employeeNumber: employee.employeeNumber,
        department: employee.department
      }
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب رصيد الإجازات' },
      { status: 500 }
    );
  }
}
