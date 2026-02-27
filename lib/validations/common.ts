/**
 * Common Validation Schemas & Utilities
 */

import { z } from 'zod'

/**
 * File upload validation
 */
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'الملف مطلوب' }),
  type: z.enum(['IMAGE', 'DOCUMENT', 'EXCEL', 'PDF', 'ANY']).optional(),
})

/**
 * Validate file type and size
 */
export function validateFile(file: File, options?: {
  maxSizeMB?: number
  allowedTypes?: string[]
}): { valid: boolean; error?: string } {
  const maxSizeMB = options?.maxSizeMB || 5
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  
  // Default allowed types
  const allowedTypes = options?.allowedTypes || [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]
  
  // Check size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `حجم الملف يجب أن يكون أقل من ${maxSizeMB} ميجابايت`,
    }
  }
  
  // Check type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'نوع الملف غير مدعوم',
    }
  }
  
  return { valid: true }
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  filename = filename.replace(/\.\./g, '')
  
  // Remove special characters except dash, underscore, and dot
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  
  // Limit length
  if (filename.length > 255) {
    const ext = filename.split('.').pop()
    const name = filename.slice(0, 200)
    filename = ext ? `${name}.${ext}` : name
  }
  
  return filename
}

/**
 * Pagination validation
 */
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export type PaginationInput = z.infer<typeof paginationSchema>

/**
 * Date range validation
 */
export const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ البداية غير صحيح'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ النهاية غير صحيح'),
}).refine(
  (data) => {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    return start <= end
  },
  {
    message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
    path: ['endDate'],
  }
)

export type DateRangeInput = z.infer<typeof dateRangeSchema>

/**
 * ID validation
 */
export const idSchema = z.string().min(1, 'المعرف مطلوب')

/**
 * Bulk IDs validation
 */
export const bulkIdsSchema = z.object({
  ids: z.array(z.string()).min(1, 'يجب اختيار عنصر واحد على الأقل').max(100, 'عدد العناصر كبير جداً'),
})

export type BulkIdsInput = z.infer<typeof bulkIdsSchema>

/**
 * Search query validation
 */
export const searchSchema = z.object({
  query: z.string().max(200, 'الاستعلام طويل جداً'),
  filters: z.record(z.any()).optional(),
})

export type SearchInput = z.infer<typeof searchSchema>

/**
 * Generic status change validation
 */
export const statusChangeSchema = z.object({
  id: z.string().min(1, 'المعرف مطلوب'),
  status: z.string().min(1, 'الحالة مطلوبة'),
  reason: z.string().max(500).optional(),
})

export type StatusChangeInput = z.infer<typeof statusChangeSchema>

/**
 * API response validation helper
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message,
  }
}

export function createErrorResponse(error: string, code?: string) {
  return {
    success: false,
    error,
    code,
  }
}

/**
 * Validate and parse request body
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body)
  
  if (!result.success) {
    const firstError = result.error.errors[0]
    return {
      success: false,
      error: firstError?.message || 'بيانات غير صحيحة',
    }
  }
  
  return {
    success: true,
    data: result.data,
  }
}
