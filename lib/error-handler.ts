/**
 * Centralized Error Handler
 * 
 * Provides consistent error handling across the application:
 * - Error logging
 * - User-friendly messages
 * - Error categorization
 * - Stack trace management
 */

import { NextResponse } from 'next/server';
import logger from './logger';

/**
 * Error types
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

/**
 * Application error class
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: any;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);
    
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined error factories
 */
export const ErrorFactory = {
  validation(message: string, details?: any) {
    return new AppError(message, ErrorType.VALIDATION, 400, true, details);
  },

  authentication(message: string = 'غير مصرح') {
    return new AppError(message, ErrorType.AUTHENTICATION, 401, true);
  },

  authorization(message: string = 'ممنوع') {
    return new AppError(message, ErrorType.AUTHORIZATION, 403, true);
  },

  notFound(resource: string) {
    return new AppError(`${resource} غير موجود`, ErrorType.NOT_FOUND, 404, true);
  },

  database(message: string, context?: any) {
    return new AppError(message, ErrorType.DATABASE, 500, true, context);
  },

  externalApi(service: string, message: string) {
    return new AppError(
      `خطأ في ${service}: ${message}`,
      ErrorType.EXTERNAL_API,
      502,
      true
    );
  },

  internal(message: string, context?: any) {
    return new AppError(message, ErrorType.INTERNAL, 500, false, context);
  },
};

/**
 * Handle error and return NextResponse
 */
export function handleError(error: unknown, context?: any): NextResponse {
  // Convert to AppError if needed
  const appError = error instanceof AppError
    ? error
    : new AppError(
        error instanceof Error ? error.message : 'خطأ غير معروف',
        ErrorType.INTERNAL,
        500,
        false,
        { originalError: error, ...context }
      );

  // Log error
  logger.error(appError.message, {
    type: appError.type,
    statusCode: appError.statusCode,
    isOperational: appError.isOperational,
    context: appError.context,
    stack: appError.stack,
    ...context,
  });

  // User-friendly message for production
  const message =
    process.env.NODE_ENV === 'production' && !appError.isOperational
      ? 'حدث خطأ داخلي'
      : appError.message;

  // Return response
  return NextResponse.json(
    {
      error: message,
      type: appError.type,
      ...(process.env.NODE_ENV === 'development' && {
        stack: appError.stack,
        context: appError.context,
      }),
    },
    { status: appError.statusCode }
  );
}

/**
 * Try-catch wrapper for async functions
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context?: any
): Promise<NextResponse | T> {
  try {
    return await fn();
  } catch (error) {
    return handleError(error, context);
  }
}

/**
 * Usage Examples:
 * 
 * 1. Throw specific error:
 * 
 * if (!employee) {
 *   throw ErrorFactory.notFound('الموظف');
 * }
 * 
 * if (!session.user) {
 *   throw ErrorFactory.authentication();
 * }
 * 
 * if (session.user.role !== 'ADMIN') {
 *   throw ErrorFactory.authorization();
 * }
 * 
 * 2. Handle error in API route:
 * 
 * export async function GET(request: NextRequest) {
 *   try {
 *     // ... your code
 *     return NextResponse.json(data);
 *   } catch (error) {
 *     return handleError(error, { endpoint: '/api/employees' });
 *   }
 * }
 * 
 * 3. Use tryCatch wrapper:
 * 
 * export async function GET(request: NextRequest) {
 *   return tryCatch(async () => {
 *     const employees = await prisma.employee.findMany();
 *     return NextResponse.json(employees);
 *   }, { endpoint: '/api/employees' });
 * }
 * 
 * 4. Validation error:
 * 
 * try {
 *   const data = employeeSchema.parse(body);
 * } catch (error) {
 *   throw ErrorFactory.validation('بيانات غير صحيحة', error.errors);
 * }
 */

/**
 * Global error handler setup
 * Call this in your main entry point
 */
export function setupGlobalErrorHandler() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });

    // Give time to flush logs before exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
    });
  });

  // Log process exit
  process.on('exit', (code) => {
    logger.info(`Process exiting with code: ${code}`);
  });

  // Log SIGTERM (graceful shutdown)
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
  });

  // Log SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down');
    process.exit(0);
  });
}
