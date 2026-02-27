/**
 * Task & Request Validation Schemas
 */

import { z } from 'zod'

/**
 * Create task validation
 */
export const createTaskSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  description: z.string().max(5000, 'الوصف طويل جداً').optional(),
  
  assignedTo: z.string().min(1, 'المكلف مطلوب'),
  assignedBy: z.string().min(1, 'المُنشئ مطلوب'),
  
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    errorMap: () => ({ message: 'الأولوية غير صحيحة' }),
  }),
  
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ الاستحقاق غير صحيح').optional(),
  
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10, 'عدد الوسوم كبير جداً').optional(),
  
  attachments: z.array(z.string().max(500)).max(10, 'عدد المرفقات كبير جداً').optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>

/**
 * Update task validation
 */
export const updateTaskSchema = z.object({
  title: z.string().min(1, 'العنوان مطلوب').max(200).optional(),
  description: z.string().max(5000).optional(),
  
  assignedTo: z.string().optional(),
  
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ الاستحقاق غير صحيح').optional().nullable(),
  
  progress: z.number().min(0).max(100).optional(),
  
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
})

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

/**
 * Task comment validation
 */
export const taskCommentSchema = z.object({
  taskId: z.string().min(1, 'معرف المهمة مطلوب'),
  content: z.string().min(1, 'المحتوى مطلوب').max(2000, 'المحتوى طويل جداً'),
  attachments: z.array(z.string().max(500)).max(5).optional(),
})

export type TaskCommentInput = z.infer<typeof taskCommentSchema>

/**
 * Task filter validation
 */
export const taskFilterSchema = z.object({
  search: z.string().max(100).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ALL']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'ALL']).optional(),
  assignedTo: z.string().optional(),
  assignedBy: z.string().optional(),
  category: z.string().optional(),
  dueDateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dueDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
})

export type TaskFilterInput = z.infer<typeof taskFilterSchema>

/**
 * General request validation (HR, Procurement, etc.)
 */
export const createRequestSchema = z.object({
  type: z.enum([
    'LEAVE',
    'PROCUREMENT',
    'MAINTENANCE',
    'TRANSPORT',
    'IT_SUPPORT',
    'HR_DOCUMENT',
    'FINANCE',
    'OTHER'
  ], {
    errorMap: () => ({ message: 'نوع الطلب غير صحيح' }),
  }),
  
  title: z.string().min(1, 'العنوان مطلوب').max(200),
  description: z.string().min(1, 'الوصف مطلوب').max(5000),
  
  requestedBy: z.string().min(1, 'مقدم الطلب مطلوب'),
  
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  
  requiredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ المطلوب غير صحيح').optional(),
  
  attachments: z.array(z.string().max(500)).max(10).optional(),
  
  metadata: z.record(z.any()).optional(), // Custom fields per request type
})

export type CreateRequestInput = z.infer<typeof createRequestSchema>

/**
 * Approve/Reject request validation
 */
export const requestActionSchema = z.object({
  requestId: z.string().min(1, 'معرف الطلب مطلوب'),
  action: z.enum(['APPROVE', 'REJECT', 'PENDING_INFO'], {
    errorMap: () => ({ message: 'الإجراء غير صحيح' }),
  }),
  comments: z.string().max(1000).optional(),
  attachments: z.array(z.string().max(500)).max(5).optional(),
})

export type RequestActionInput = z.infer<typeof requestActionSchema>
