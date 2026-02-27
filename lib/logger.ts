/**
 * Structured Logging System
 * 
 * Winston-based logger with:
 * - Multiple transports (console, file, rotate)
 * - Log levels (error, warn, info, debug)
 * - Structured JSON format
 * - Daily rotation
 * - Contextual metadata
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log colors
const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(LOG_COLORS);

// Custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

// Console format (human-readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// Log directory
const LOG_DIR = path.join(process.cwd(), 'logs');

// Transports
const transports: winston.transport[] = [];

// Console transport (all levels)
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  })
);

// File transport - Error logs (daily rotation)
transports.push(
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d', // Keep 30 days
    maxSize: '20m', // Max 20 MB per file
    format: customFormat,
    auditFile: path.join(LOG_DIR, '.error-audit.json'),
  })
);

// File transport - Combined logs (daily rotation)
transports.push(
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d', // Keep 14 days
    maxSize: '50m', // Max 50 MB per file
    format: customFormat,
    auditFile: path.join(LOG_DIR, '.combined-audit.json'),
  })
);

// File transport - HTTP logs (API requests)
transports.push(
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxFiles: '7d', // Keep 7 days
    maxSize: '100m', // Max 100 MB per file
    format: customFormat,
    auditFile: path.join(LOG_DIR, '.http-audit.json'),
  })
);

// Create logger
const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: {
    service: 'albassam-app',
    environment: process.env.NODE_ENV || 'production',
  },
  transports,
  exitOnError: false,
});

// Logger methods with context
export default {
  /**
   * Log error
   */
  error(message: string, meta?: any) {
    logger.error(message, meta);
  },

  /**
   * Log warning
   */
  warn(message: string, meta?: any) {
    logger.warn(message, meta);
  },

  /**
   * Log info
   */
  info(message: string, meta?: any) {
    logger.info(message, meta);
  },

  /**
   * Log HTTP request
   */
  http(message: string, meta?: any) {
    logger.http(message, meta);
  },

  /**
   * Log debug
   */
  debug(message: string, meta?: any) {
    logger.debug(message, meta);
  },

  /**
   * Log with custom level
   */
  log(level: keyof typeof LOG_LEVELS, message: string, meta?: any) {
    logger.log(level, message, meta);
  },

  /**
   * Create child logger with context
   */
  child(context: any) {
    return logger.child(context);
  },
};

/**
 * Usage Examples:
 * 
 * import logger from '@/lib/logger';
 * 
 * // Simple logs
 * logger.info('User logged in');
 * logger.error('Database connection failed');
 * 
 * // With metadata
 * logger.info('User logged in', {
 *   userId: '123',
 *   username: 'mohammed',
 *   ip: '192.168.1.1'
 * });
 * 
 * logger.error('Payment failed', {
 *   orderId: '456',
 *   amount: 1000,
 *   error: err.message,
 *   stack: err.stack
 * });
 * 
 * // HTTP logs
 * logger.http('GET /api/employees', {
 *   method: 'GET',
 *   url: '/api/employees',
 *   status: 200,
 *   duration: 45,
 *   userId: '123'
 * });
 * 
 * // Child logger with context
 * const requestLogger = logger.child({ requestId: '789' });
 * requestLogger.info('Processing request');
 * requestLogger.error('Request failed');
 */

/**
 * Log directories:
 * 
 * logs/
 * ├── error-2026-02-24.log      (Error logs only)
 * ├── combined-2026-02-24.log   (All logs)
 * ├── http-2026-02-24.log       (HTTP requests)
 * ├── .error-audit.json         (Rotation metadata)
 * ├── .combined-audit.json      (Rotation metadata)
 * └── .http-audit.json          (Rotation metadata)
 */
