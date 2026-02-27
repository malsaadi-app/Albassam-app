/**
 * Attendance Validation Schemas
 */

import { z } from 'zod'

/**
 * Check-in validation
 */
export const checkInSchema = z.object({
  employeeId: z.string().min(1, 'معرف الموظف مطلوب'),
  method: z.enum(['QR', 'RFID', 'MANUAL', 'FACIAL'], {
    errorMap: () => ({ message: 'طريقة التسجيل غير صحيحة' }),
  }),
  location: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
})

export type CheckInInput = z.infer<typeof checkInSchema>

/**
 * Check-out validation
 */
export const checkOutSchema = z.object({
  attendanceId: z.string().min(1, 'معرف الحضور مطلوب'),
  notes: z.string().max(500).optional(),
})

export type CheckOutInput = z.infer<typeof checkOutSchema>

/**
 * Manual attendance entry validation (HR/Admin only)
 */
export const manualAttendanceSchema = z.object({
  employeeId: z.string().min(1, 'معرف الموظف مطلوب'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ غير صحيح'),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/, 'وقت الدخول غير صحيح'),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/, 'وقت الخروج غير صحيح').optional(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'SICK_LEAVE', 'VACATION']),
  reason: z.string().max(500).optional(),
})

export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>

/**
 * Attendance report filter validation
 */
export const attendanceReportSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ البداية غير صحيح'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ النهاية غير صحيح'),
  employeeId: z.string().optional(),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'SICK_LEAVE', 'VACATION', 'ALL']).optional(),
})

export type AttendanceReportInput = z.infer<typeof attendanceReportSchema>

/**
 * Leave request validation
 */
export const leaveRequestSchema = z.object({
  employeeId: z.string().min(1, 'معرف الموظف مطلوب'),
  leaveType: z.enum(['ANNUAL', 'SICK', 'EMERGENCY', 'UNPAID', 'MATERNITY', 'OTHER'], {
    errorMap: () => ({ message: 'نوع الإجازة غير صحيح' }),
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ البداية غير صحيح'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ النهاية غير صحيح'),
  reason: z.string().min(1, 'السبب مطلوب').max(1000, 'السبب طويل جداً'),
  attachment: z.string().max(500).optional(), // File path
})

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>

/**
 * Approve/Reject leave validation
 */
export const leaveActionSchema = z.object({
  leaveId: z.string().min(1, 'معرف الإجازة مطلوب'),
  action: z.enum(['APPROVE', 'REJECT'], {
    errorMap: () => ({ message: 'الإجراء غير صحيح' }),
  }),
  comments: z.string().max(500).optional(),
})

export type LeaveActionInput = z.infer<typeof leaveActionSchema>
