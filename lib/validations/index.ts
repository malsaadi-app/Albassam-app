/**
 * Validation Schemas Export
 * 
 * Centralized export for all validation schemas.
 * 
 * Usage:
 * ```typescript
 * import { loginSchema, createEmployeeSchema } from '@/lib/validations'
 * ```
 */

// Auth
export * from './auth'

// Employee
export * from './employee'

// Attendance
export * from './attendance'

// Tasks & Requests
export * from './task'

// Common utilities
export * from './common'

// Aliases for backward compatibility
export { createEmployeeSchema as employeeCreateSchema } from './employee'
export { manualAttendanceSchema as attendanceSchema } from './attendance'
export { createTaskSchema as taskCreateSchema } from './task'
