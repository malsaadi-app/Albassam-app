/**
 * Employee Validation Schemas
 */

import { z } from 'zod'

/**
 * Common validations
 */
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
const nationalIdRegex = /^[0-9]{10}$/
const iqamaRegex = /^[12][0-9]{9}$/

/**
 * Create employee validation
 */
export const createEmployeeSchema = z.object({
  // Basic Info
  firstNameAr: z.string().min(1, 'الاسم الأول مطلوب').max(50, 'الاسم طويل جداً'),
  fatherNameAr: z.string().min(1, 'اسم الأب مطلوب').max(50, 'الاسم طويل جداً'),
  grandFatherNameAr: z.string().min(1, 'اسم الجد مطلوب').max(50, 'الاسم طويل جداً'),
  lastNameAr: z.string().min(1, 'اسم العائلة مطلوب').max(50, 'الاسم طويل جداً'),
  
  firstNameEn: z.string().max(50, 'الاسم طويل جداً').optional(),
  fatherNameEn: z.string().max(50, 'الاسم طويل جداً').optional(),
  grandFatherNameEn: z.string().max(50, 'الاسم طويل جداً').optional(),
  lastNameEn: z.string().max(50, 'الاسم طويل جداً').optional(),

  // Employment
  employeeNumber: z
    .string()
    .min(1, 'رقم الموظف مطلوب')
    .max(20, 'رقم الموظف طويل جداً')
    .regex(/^[A-Z0-9-]+$/, 'رقم الموظف يجب أن يحتوي على أحرف وأرقام فقط'),
  
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED'], {
    errorMap: () => ({ message: 'الحالة غير صحيحة' }),
  }),
  
  jobTitleId: z.string().min(1, 'المسمى الوظيفي مطلوب'),
  branchId: z.string().min(1, 'الفرع مطلوب'),
  departmentId: z.string().optional(),
  
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ التعيين غير صحيح'),
  
  // Identity
  nationalId: z
    .string()
    .regex(nationalIdRegex, 'رقم الهوية يجب أن يكون 10 أرقام')
    .optional()
    .or(z.literal('')),
  
  iqamaNumber: z
    .string()
    .regex(iqamaRegex, 'رقم الإقامة يجب أن يبدأ بـ 1 أو 2 ويتكون من 10 أرقام')
    .optional()
    .or(z.literal('')),
  
  passportNumber: z.string().max(20, 'رقم الجواز طويل جداً').optional(),
  
  // Contact
  email: z
    .string()
    .email('البريد الإلكتروني غير صحيح')
    .optional()
    .or(z.literal('')),
  
  phone: z
    .string()
    .regex(phoneRegex, 'رقم الجوال غير صحيح')
    .optional()
    .or(z.literal('')),
  
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z
    .string()
    .regex(phoneRegex, 'رقم الطوارئ غير صحيح')
    .optional()
    .or(z.literal('')),
  
  // Personal
  gender: z.enum(['MALE', 'FEMALE'], {
    errorMap: () => ({ message: 'الجنس غير صحيح' }),
  }).optional(),
  
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ الميلاد غير صحيح')
    .optional(),
  
  nationality: z.string().max(50).optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  
  // Contract
  contractType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).optional(),
  salary: z.number().min(0, 'الراتب يجب أن يكون موجباً').optional(),
  
  // Other
  notes: z.string().max(1000, 'الملاحظات طويلة جداً').optional(),
})

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>

/**
 * Update employee validation (all fields optional except ID)
 */
export const updateEmployeeSchema = createEmployeeSchema.partial()

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>

/**
 * Employee search/filter validation
 */
export const employeeFilterSchema = z.object({
  search: z.string().max(100).optional(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED', 'ALL']).optional(),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  jobTitleId: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
})

export type EmployeeFilterInput = z.infer<typeof employeeFilterSchema>

/**
 * Bulk employee action validation
 */
export const bulkEmployeeActionSchema = z.object({
  action: z.enum(['ACTIVATE', 'SUSPEND', 'TERMINATE', 'ASSIGN_BRANCH', 'ASSIGN_DEPARTMENT']),
  employeeIds: z.array(z.string()).min(1, 'يجب اختيار موظف واحد على الأقل').max(100, 'عدد الموظفين كبير جداً'),
  branchId: z.string().optional(), // For ASSIGN_BRANCH
  departmentId: z.string().optional(), // For ASSIGN_DEPARTMENT
  reason: z.string().max(500).optional(),
})

export type BulkEmployeeActionInput = z.infer<typeof bulkEmployeeActionSchema>
