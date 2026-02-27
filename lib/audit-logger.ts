/**
 * Audit Logger
 * 
 * Logs security-critical and business-critical events:
 * - User authentication (login, logout, failed attempts)
 * - Authorization (permission denials)
 * - Data modifications (create, update, delete)
 * - Configuration changes
 * - System events
 */

import logger from './logger';
import prisma from './prisma';

/**
 * Audit event types
 */
export enum AuditEventType {
  // Authentication
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',

  // Authorization
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',

  // Data operations
  EMPLOYEE_CREATED = 'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED = 'EMPLOYEE_UPDATED',
  EMPLOYEE_DELETED = 'EMPLOYEE_DELETED',
  
  LEAVE_CREATED = 'LEAVE_CREATED',
  LEAVE_APPROVED = 'LEAVE_APPROVED',
  LEAVE_REJECTED = 'LEAVE_REJECTED',

  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',

  // HR Requests
  HR_REQUEST_CREATED = 'HR_REQUEST_CREATED',
  HR_REQUEST_REVIEWED = 'HR_REQUEST_REVIEWED',
  HR_REQUEST_APPROVED = 'HR_REQUEST_APPROVED',
  HR_REQUEST_REJECTED = 'HR_REQUEST_REJECTED',

  // System
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  BACKUP_RESTORED = 'BACKUP_RESTORED',
  
  // Security
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
}

/**
 * Audit event interface
 */
interface AuditEvent {
  eventType: AuditEventType;
  userId?: string;
  username?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}

/**
 * Log audit event
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    // Log to Winston (file + console)
    logger.info('Audit Event', {
      audit: true,
      ...event,
      timestamp: new Date().toISOString(),
    });

    // Store in database (optional - if AuditLog model exists)
    // await prisma.auditLog.create({
    //   data: {
    //     eventType: event.eventType,
    //     userId: event.userId,
    //     action: event.action,
    //     resourceType: event.resourceType,
    //     resourceId: event.resourceId,
    //     changes: JSON.stringify(event.changes),
    //     ipAddress: event.ipAddress,
    //     userAgent: event.userAgent,
    //     success: event.success,
    //     errorMessage: event.errorMessage,
    //     metadata: JSON.stringify(event.metadata),
    //   },
    // });
  } catch (error) {
    logger.error('Failed to log audit event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      event,
    });
  }
}

/**
 * Predefined audit loggers
 */
export const AuditLogger = {
  /**
   * Log successful login
   */
  async loginSuccess(userId: string, username: string, ipAddress?: string, userAgent?: string) {
    await logAuditEvent({
      eventType: AuditEventType.LOGIN_SUCCESS,
      userId,
      username,
      action: 'User logged in',
      ipAddress,
      userAgent,
      success: true,
    });
  },

  /**
   * Log failed login attempt
   */
  async loginFailed(username: string, ipAddress?: string, userAgent?: string, reason?: string) {
    await logAuditEvent({
      eventType: AuditEventType.LOGIN_FAILED,
      username,
      action: 'Login attempt failed',
      ipAddress,
      userAgent,
      success: false,
      errorMessage: reason,
    });
  },

  /**
   * Log logout
   */
  async logout(userId: string, username: string) {
    await logAuditEvent({
      eventType: AuditEventType.LOGOUT,
      userId,
      username,
      action: 'User logged out',
      success: true,
    });
  },

  /**
   * Log password change
   */
  async passwordChanged(userId: string, username: string, ipAddress?: string) {
    await logAuditEvent({
      eventType: AuditEventType.PASSWORD_CHANGED,
      userId,
      username,
      action: 'Password changed',
      ipAddress,
      success: true,
    });
  },

  /**
   * Log access denied
   */
  async accessDenied(
    userId: string | undefined,
    username: string | undefined,
    resource: string,
    ipAddress?: string
  ) {
    await logAuditEvent({
      eventType: AuditEventType.ACCESS_DENIED,
      userId,
      username,
      action: `Access denied to ${resource}`,
      resourceType: resource,
      ipAddress,
      success: false,
    });
  },

  /**
   * Log employee created
   */
  async employeeCreated(
    userId: string,
    username: string,
    employeeId: string,
    employeeData: any
  ) {
    await logAuditEvent({
      eventType: AuditEventType.EMPLOYEE_CREATED,
      userId,
      username,
      resourceType: 'employee',
      resourceId: employeeId,
      action: 'Employee created',
      changes: employeeData,
      success: true,
    });
  },

  /**
   * Log employee updated
   */
  async employeeUpdated(
    userId: string,
    username: string,
    employeeId: string,
    changes: any
  ) {
    await logAuditEvent({
      eventType: AuditEventType.EMPLOYEE_UPDATED,
      userId,
      username,
      resourceType: 'employee',
      resourceId: employeeId,
      action: 'Employee updated',
      changes,
      success: true,
    });
  },

  /**
   * Log HR request approved
   */
  async hrRequestApproved(
    userId: string,
    username: string,
    requestId: string,
    requestType: string
  ) {
    await logAuditEvent({
      eventType: AuditEventType.HR_REQUEST_APPROVED,
      userId,
      username,
      resourceType: 'hr_request',
      resourceId: requestId,
      action: `HR request approved: ${requestType}`,
      success: true,
    });
  },

  /**
   * Log suspicious activity
   */
  async suspiciousActivity(
    userId: string | undefined,
    username: string | undefined,
    description: string,
    ipAddress?: string,
    metadata?: any
  ) {
    await logAuditEvent({
      eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
      userId,
      username,
      action: description,
      ipAddress,
      success: false,
      metadata,
    });
  },

  /**
   * Log brute force attempt
   */
  async bruteForceAttempt(username: string, ipAddress: string, attemptCount: number) {
    await logAuditEvent({
      eventType: AuditEventType.BRUTE_FORCE_ATTEMPT,
      username,
      action: `Brute force detected: ${attemptCount} attempts`,
      ipAddress,
      success: false,
      metadata: { attemptCount },
    });
  },
};

/**
 * Usage Examples:
 * 
 * 1. Login success:
 * await AuditLogger.loginSuccess(
 *   user.id,
 *   user.username,
 *   request.headers.get('x-forwarded-for'),
 *   request.headers.get('user-agent')
 * );
 * 
 * 2. Access denied:
 * await AuditLogger.accessDenied(
 *   session.user?.id,
 *   session.user?.username,
 *   '/api/admin/users',
 *   request.headers.get('x-forwarded-for')
 * );
 * 
 * 3. Employee created:
 * await AuditLogger.employeeCreated(
 *   session.user.id,
 *   session.user.username,
 *   employee.id,
 *   { fullNameAr: employee.fullNameAr, department: employee.department }
 * );
 * 
 * 4. Suspicious activity:
 * await AuditLogger.suspiciousActivity(
 *   undefined,
 *   undefined,
 *   'SQL injection attempt detected',
 *   request.headers.get('x-forwarded-for'),
 *   { query: suspiciousQuery }
 * );
 */
