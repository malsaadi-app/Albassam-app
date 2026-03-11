/**
 * Attendance Deductions Integration with Payroll System
 * 
 * This module handles automatic deduction management based on attendance corrections.
 */

import prisma from '@/lib/prisma';

interface AttendanceRecord {
  id: string;
  date: Date;
  status: string;
  workHours: number | null;
  checkIn: Date | null;
  checkOut: Date | null;
}

/**
 * Calculate deduction amount for an attendance issue
 */
export function calculateAttendanceDeduction(
  record: AttendanceRecord,
  dailySalary: number = 300,
  requiredHours: number = 8
): number {
  if (record.status === 'ABSENT') {
    return dailySalary; // Full day deduction
  }
  
  if (record.status === 'LATE') {
    return dailySalary * 0.25; // 25% for late arrival
  }
  
  if (!record.checkOut && record.checkIn) {
    return dailySalary * 0.25; // 25% for missing checkout
  }
  
  if (!record.checkIn) {
    return dailySalary; // Full day if no checkin
  }
  
  if (record.workHours && record.workHours < requiredHours) {
    const missingHours = requiredHours - record.workHours;
    return (dailySalary / requiredHours) * missingHours; // Proportional deduction
  }
  
  return 0;
}

/**
 * Get deduction title based on attendance issue
 */
function getDeductionTitle(record: AttendanceRecord): string {
  const dateStr = record.date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  if (record.status === 'ABSENT') {
    return `خصم غياب - ${dateStr}`;
  }
  
  if (record.status === 'LATE') {
    return `خصم تأخير - ${dateStr}`;
  }
  
  if (!record.checkOut && record.checkIn) {
    return `خصم عدم تسجيل انصراف - ${dateStr}`;
  }
  
  if (record.workHours) {
    return `خصم ساعات ناقصة - ${dateStr}`;
  }
  
  return `خصم حضور - ${dateStr}`;
}

/**
 * Create attendance deduction (when excuse is rejected or no excuse provided)
 */
export async function createAttendanceDeduction(
  employeeId: string,
  attendanceRecordId: string,
  amount: number,
  attendanceRecord: AttendanceRecord
): Promise<void> {
  try {
    const title = getDeductionTitle(attendanceRecord);
    
    // Check if deduction already exists
    const existing = await prisma.payrollRecurringItem.findFirst({
      where: {
        employeeId,
        title: {
          contains: attendanceRecord.date.toISOString().split('T')[0]
        },
        kind: 'DEDUCTION'
      }
    });
    
    if (existing) {
      // Update existing deduction
      await prisma.payrollRecurringItem.update({
        where: { id: existing.id },
        data: {
          amount,
          active: true,
          startAt: attendanceRecord.date,
          endAt: new Date(attendanceRecord.date.getTime() + 30 * 24 * 60 * 60 * 1000) // Valid for 30 days
        }
      });
    } else {
      // Create new deduction
      await prisma.payrollRecurringItem.create({
        data: {
          employeeId,
          kind: 'DEDUCTION',
          title,
          amount,
          active: true,
          startAt: attendanceRecord.date,
          endAt: new Date(attendanceRecord.date.getTime() + 30 * 24 * 60 * 60 * 1000) // Valid for 30 days
        }
      });
    }
    
    console.log(`✅ Created attendance deduction: ${amount} SAR for employee ${employeeId}`);
  } catch (error) {
    console.error('Error creating attendance deduction:', error);
    throw error;
  }
}

/**
 * Remove attendance deduction (when excuse is approved)
 */
export async function removeAttendanceDeduction(
  employeeId: string,
  attendanceDate: Date
): Promise<void> {
  try {
    const dateStr = attendanceDate.toISOString().split('T')[0];
    
    // Find and deactivate the deduction
    const deduction = await prisma.payrollRecurringItem.findFirst({
      where: {
        employeeId,
        title: {
          contains: dateStr
        },
        kind: 'DEDUCTION',
        active: true
      }
    });
    
    if (deduction) {
      await prisma.payrollRecurringItem.update({
        where: { id: deduction.id },
        data: { active: false }
      });
      
      console.log(`✅ Removed attendance deduction for date ${dateStr}`);
    } else {
      console.log(`ℹ️  No active deduction found for date ${dateStr}`);
    }
  } catch (error) {
    console.error('Error removing attendance deduction:', error);
    throw error;
  }
}

/**
 * Process excuse request status change
 * Called when an attendance excuse request is approved or rejected
 */
export async function processExcuseStatusChange(
  requestId: string,
  newStatus: 'APPROVED' | 'REJECTED',
  userId: string
): Promise<void> {
  try {
    // Get the attendance request
    const request = await prisma.attendanceRequest.findUnique({
      where: { id: requestId }
    });
    
    if (!request || !request.attendanceRecordId) {
      throw new Error('Attendance request not found or no attendance record linked');
    }
    
    // Get the attendance record
    const attendanceRecord = await prisma.attendanceRecord.findUnique({
      where: { id: request.attendanceRecordId },
      select: { 
        id: true,
        date: true, 
        status: true, 
        workHours: true,
        checkIn: true,
        checkOut: true
      }
    });
    
    if (!attendanceRecord) {
      throw new Error('Attendance record not found');
    }
    
    // Get employee ID from user ID
    const employee = await prisma.employee.findUnique({
      where: { userId },
      select: { id: true }
    });
    
    if (!employee) {
      console.error(`Employee not found for user ${userId}`);
      return; // Don't throw - just skip
    }
    
    const employeeId = employee.id;
    
    if (newStatus === 'APPROVED') {
      // Remove deduction if excuse is approved
      await removeAttendanceDeduction(employeeId, request.requestDate);
    } else if (newStatus === 'REJECTED') {
      // Create deduction if excuse is rejected
      const dailySalary = 300; // TODO: Get from employee.basicSalary
      const requiredHours = 8;
      
      const deductionAmount = calculateAttendanceDeduction(
        attendanceRecord,
        dailySalary,
        requiredHours
      );
      
      if (deductionAmount > 0) {
        await createAttendanceDeduction(
          employeeId,
          request.attendanceRecordId!,
          deductionAmount,
          attendanceRecord
        );
      }
    }
    
    console.log(`✅ Processed excuse status change: ${newStatus} for request ${requestId}`);
  } catch (error) {
    console.error('Error processing excuse status change:', error);
    // Don't throw - we don't want to block the request approval/rejection
    // Just log the error
  }
}

/**
 * Bulk process multiple attendance dates
 * Used when submitting excuse for multiple days
 */
export async function bulkProcessAttendanceDeductions(
  employeeId: string,
  dates: Date[],
  action: 'CREATE' | 'REMOVE'
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  
  for (const date of dates) {
    try {
      if (action === 'REMOVE') {
        await removeAttendanceDeduction(employeeId, date);
      } else {
        // For CREATE, we need to fetch the attendance record first
        const record = await prisma.attendanceRecord.findFirst({
          where: {
            userId: employeeId, // Note: This assumes userId, might need to adjust
            date: {
              gte: new Date(date.toISOString().split('T')[0]),
              lt: new Date(new Date(date.toISOString().split('T')[0]).getTime() + 24 * 60 * 60 * 1000)
            }
          }
        });
        
        if (record) {
          const amount = calculateAttendanceDeduction(record);
          if (amount > 0) {
            await createAttendanceDeduction(employeeId, record.id, amount, record);
          }
        }
      }
      success++;
    } catch (error) {
      console.error(`Failed to process date ${date}:`, error);
      failed++;
    }
  }
  
  return { success, failed };
}
