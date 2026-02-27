/**
 * Input Validation Utilities
 * Prevents XSS, SQL Injection, and invalid data
 */

/**
 * Sanitize string input - remove dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .slice(0, 1000); // Max 1000 characters
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate phone number (Saudi format)
 */
export function isValidPhone(phone: string): boolean {
  // Saudi phone: starts with +966 or 05, 10 digits
  const phoneRegex = /^(\+966|966|05)\d{8,9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Validate date string (YYYY-MM-DD)
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate number within range
 */
export function isValidNumber(
  value: any,
  min?: number,
  max?: number
): boolean {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

/**
 * Validate enum value
 */
export function isValidEnum<T>(value: any, enumObj: T): value is T[keyof T] {
  return Object.values(enumObj as any).includes(value);
}

/**
 * Validate username (alphanumeric + underscore, 3-20 chars)
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 * - Min 8 characters
 * - At least one letter
 * - At least one number
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/**
 * Sanitize filename - prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .slice(0, 255); // Max filename length
}

/**
 * Validate file extension
 */
export function isAllowedFileExtension(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
}

/**
 * Allowed file extensions for uploads
 */
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
export const ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
export const ALLOWED_ALL_EXTENSIONS = [
  ...ALLOWED_IMAGE_EXTENSIONS,
  ...ALLOWED_DOCUMENT_EXTENSIONS,
];

/**
 * Validate file size (in bytes)
 */
export function isValidFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxSizeBytes;
}

/**
 * Validate ID format (cuid or uuid)
 */
export function isValidId(id: string): boolean {
  // CUID format (Prisma default)
  const cuidRegex = /^c[a-z0-9]{24}$/;
  // UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  return cuidRegex.test(id) || uuidRegex.test(id);
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page: any,
  limit: any
): { page: number; limit: number } | null {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;

  if (pageNum < 1 || pageNum > 10000) return null;
  if (limitNum < 1 || limitNum > 100) return null;

  return { page: pageNum, limit: limitNum };
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML (basic - for display purposes only)
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
    .replace(/on\w+='[^']*'/g, '');
}
