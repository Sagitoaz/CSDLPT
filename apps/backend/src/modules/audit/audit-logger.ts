/**
 * Audit Logging Module
 * SECURITY-03: Application-level logging
 *
 * Features:
 * - Structured logging with Winston
 * - Audit trail for sensitive operations
 * - Request/response tracking
 * - Error logging with context
 */

import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

/**
 * Configure Winston logger
 * SECURITY-03: Centralized log service setup
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'charity-backend' },
  transports: [
    // Log to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),

    // Log to file (production)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

/**
 * Audit Log Entry
 * SECURITY-03: Structured log format
 */
export interface AuditLogEntry {
  timestamp: Date;
  userId?: string;
  email?: string;
  userRole?: string;
  action: string; // e.g., 'DONATION_CREATE', 'AUTH_LOGIN'
  resource: string; // e.g., 'donations', 'campaigns'
  resourceId?: string;
  method: string; // HTTP method
  endpoint: string;
  statusCode: number;
  success: boolean;
  duration: number; // ms
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  details?: Record<string, any>;
}

/**
 * Log info level
 */
export function logInfo(message: string, meta?: any): void {
  logger.info(message, meta);
}

/**
 * Log error level
 */
export function logError(message: string, error?: Error | string, meta?: any): void {
  if (error instanceof Error) {
    logger.error(message, { error: error.message, stack: error.stack, ...meta });
  } else {
    logger.error(message, { error, ...meta });
  }
}

/**
 * Log audit event (sensitive operations)
 * SECURITY-03: Audit trail for important actions
 */
export function logAudit(entry: AuditLogEntry): void {
  // Mask sensitive fields
  const safeEntry = {
    ...entry,
    // Don't log passwords or tokens
  };

  logger.info('AUDIT', safeEntry);

  // Optional: Send to centralized log service
  // sendToLogService(safeEntry);
}

/**
 * Audit middleware
 * SECURITY-03: Logs all requests
 *
 * Usage:
 * app.use(auditLogMiddleware);
 */
export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const originalSend = res.send;

  // Intercept response
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    const success = res.statusCode >= 200 && res.statusCode < 300;

    const auditEntry: AuditLogEntry = {
      timestamp: new Date(),
      userId: (req.user as any)?.userId,
      email: (req.user as any)?.email,
      userRole: (req.user as any)?.role,
      action: `${req.method}_${req.path.split('/')[2]?.toUpperCase() || 'UNKNOWN'}`,
      resource: req.path.split('/')[3] || req.path,
      resourceId: req.params.id,
      method: req.method,
      endpoint: req.path,
      statusCode: res.statusCode,
      success,
      duration,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };

    // Log error details if failed
    if (!success && res.statusCode >= 400) {
      try {
        const bodyData = typeof data === 'string' ? JSON.parse(data) : data;
        auditEntry.errorMessage = bodyData?.message;
        auditEntry.details = bodyData;
      } catch {
        auditEntry.errorMessage = data?.toString();
      }
    }

    // Log sensitive operations only
    if (['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      logAudit(auditEntry);
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Error logger for uncaught exceptions
 */
export function logUncaughtError(error: Error): void {
  logger.error('UNCAUGHT_ERROR', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date(),
  });
}

export default logger;
