/**
 * Authentication & User Validation Schemas
 */

import { z } from 'zod'

/**
 * Login validation
 */
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'اسم المستخدم مطلوب')
    .max(50, 'اسم المستخدم طويل جداً')
    .regex(/^[a-zA-Z0-9_-]+$/, 'اسم المستخدم يجب أن يحتوي على حروف وأرقام فقط'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .max(200, 'كلمة المرور طويلة جداً'),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Password change validation
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z
    .string()
    .min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
    .max(100, 'كلمة المرور طويلة جداً')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم'
    ),
  confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

/**
 * User creation validation
 */
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(50, 'اسم المستخدم طويل جداً')
    .regex(/^[a-zA-Z0-9_-]+$/, 'اسم المستخدم يجب أن يحتوي على حروف وأرقام فقط'),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .max(100, 'كلمة المرور طويلة جداً')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم'
    ),
  displayName: z
    .string()
    .min(1, 'الاسم مطلوب')
    .max(100, 'الاسم طويل جداً'),
  email: z
    .string()
    .email('البريد الإلكتروني غير صحيح')
    .optional()
    .or(z.literal('')),
  role: z.enum(['USER', 'ADMIN', 'HR'], {
    errorMap: () => ({ message: 'الدور غير صحيح' }),
  }),
  systemRoleId: z.string().optional(),
  employeeId: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

/**
 * User update validation
 */
export const updateUserSchema = z.object({
  displayName: z.string().min(1, 'الاسم مطلوب').max(100, 'الاسم طويل جداً').optional(),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  role: z.enum(['USER', 'ADMIN', 'HR']).optional(),
  systemRoleId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
