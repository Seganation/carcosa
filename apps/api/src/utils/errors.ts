/**
 * Standardized Error Handling System
 *
 * Provides consistent error responses across the API with:
 * - Unique error codes for debugging
 * - User-friendly messages
 * - Detailed error information (dev only)
 * - HTTP status codes
 * - Error logging integration
 */

import type { Request, Response, NextFunction } from 'express';
import { env } from '../env.js';

/**
 * Standard error codes for API responses
 */
export const ErrorCode = {
  // Authentication errors (1xxx)
  UNAUTHORIZED: 'AUTH_001',
  INVALID_CREDENTIALS: 'AUTH_002',
  TOKEN_EXPIRED: 'AUTH_003',
  INVALID_API_KEY: 'AUTH_004',
  INSUFFICIENT_PERMISSIONS: 'AUTH_005',

  // Validation errors (2xxx)
  VALIDATION_ERROR: 'VAL_001',
  MISSING_REQUIRED_FIELD: 'VAL_002',
  INVALID_FORMAT: 'VAL_003',
  INVALID_FILE_TYPE: 'VAL_004',
  FILE_TOO_LARGE: 'VAL_005',
  INVALID_DIMENSIONS: 'VAL_006',

  // Resource errors (3xxx)
  NOT_FOUND: 'RES_001',
  PROJECT_NOT_FOUND: 'RES_002',
  FILE_NOT_FOUND: 'RES_003',
  BUCKET_NOT_FOUND: 'RES_004',
  USER_NOT_FOUND: 'RES_005',
  ORGANIZATION_NOT_FOUND: 'RES_006',
  TEAM_NOT_FOUND: 'RES_007',

  // Permission errors (4xxx)
  ACCESS_DENIED: 'PERM_001',
  RESOURCE_FORBIDDEN: 'PERM_002',
  TEAM_ACCESS_REQUIRED: 'PERM_003',
  OWNER_ONLY: 'PERM_004',

  // Rate limiting errors (5xxx)
  RATE_LIMITED: 'RATE_001',
  QUOTA_EXCEEDED: 'RATE_002',
  CONCURRENT_LIMIT: 'RATE_003',

  // Storage errors (6xxx)
  STORAGE_ERROR: 'STOR_001',
  UPLOAD_FAILED: 'STOR_002',
  DOWNLOAD_FAILED: 'STOR_003',
  STORAGE_FULL: 'STOR_004',
  INVALID_STORAGE_CONFIG: 'STOR_005',

  // Transform errors (7xxx)
  TRANSFORM_FAILED: 'TRNS_001',
  INVALID_TRANSFORM_OPTIONS: 'TRNS_002',
  UNSUPPORTED_FORMAT: 'TRNS_003',
  IMAGE_TOO_LARGE: 'TRNS_004',

  // Database errors (8xxx)
  DATABASE_ERROR: 'DB_001',
  QUERY_FAILED: 'DB_002',
  CONSTRAINT_VIOLATION: 'DB_003',
  DUPLICATE_ENTRY: 'DB_004',

  // External service errors (9xxx)
  EXTERNAL_SERVICE_ERROR: 'EXT_001',
  S3_ERROR: 'EXT_002',
  REDIS_ERROR: 'EXT_003',
  PAYMENT_ERROR: 'EXT_004',

  // Internal errors (9999)
  INTERNAL_ERROR: 'INT_001',
  UNKNOWN_ERROR: 'INT_999',
} as const;

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ErrorCode.INTERNAL_ERROR,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Maintain proper stack trace (only available on V8)
    Error.captureStackTrace(this, this.constructor);

    // Set prototype explicitly for TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Specific error classes for common scenarios
 */

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', code: string = ErrorCode.UNAUTHORIZED) {
    super(message, 401, code, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', code: string = ErrorCode.ACCESS_DENIED) {
    super(message, 403, code, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', code: string = ErrorCode.NOT_FOUND) {
    super(`${resource} not found`, 404, code, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, ErrorCode.RATE_LIMITED, true, { retryAfter });
  }
}

export class StorageError extends AppError {
  constructor(message: string, code: string = ErrorCode.STORAGE_ERROR, details?: any) {
    super(message, 500, code, true, details);
  }
}

export class TransformError extends AppError {
  constructor(message: string, code: string = ErrorCode.TRANSFORM_FAILED, details?: any) {
    super(message, 500, code, true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, code: string = ErrorCode.DATABASE_ERROR, details?: any) {
    super(message, 500, code, false, details); // Database errors are not operational
  }
}

/**
 * Error response formatter
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    details?: any;
    stack?: string;
  };
}

/**
 * Format error for API response
 */
export function formatErrorResponse(
  err: Error | AppError,
  req?: Request
): ErrorResponse {
  const isDevelopment = env.NODE_ENV === 'development';
  const isAppError = err instanceof AppError;

  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : ErrorCode.INTERNAL_ERROR;
  const message = isAppError ? err.message : 'An unexpected error occurred';
  const details = isAppError ? err.details : undefined;

  return {
    error: {
      code,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req?.path,
      details: isDevelopment ? details : undefined,
      stack: isDevelopment ? err.stack : undefined,
    },
  };
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logError(err, req);

  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Format and send error response
  const errorResponse = formatErrorResponse(err, req);
  const statusCode = errorResponse.error.statusCode;

  res.status(statusCode).json(errorResponse);
}

/**
 * Error logging function
 */
function logError(err: Error | AppError, req?: Request): void {
  const isAppError = err instanceof AppError;
  const isOperational = isAppError ? err.isOperational : false;

  // Build log context
  const context = {
    error: {
      name: err.name,
      message: err.message,
      code: isAppError ? err.code : ErrorCode.UNKNOWN_ERROR,
      statusCode: isAppError ? err.statusCode : 500,
      stack: err.stack,
      isOperational,
    },
    request: req ? {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    } : undefined,
    timestamp: new Date().toISOString(),
  };

  // Log based on severity
  if (!isOperational || (isAppError && err.statusCode >= 500)) {
    // Critical/unexpected errors
    console.error('❌ [ERROR]', JSON.stringify(context, null, 2));

    // TODO: Send to Sentry or error tracking service
    // Sentry.captureException(err, { extra: context });
  } else {
    // Operational errors (expected, like validation failures)
    console.warn('⚠️  [WARN]', JSON.stringify(context, null, 2));
  }
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error middleware
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  const error = new NotFoundError('Endpoint');
  const errorResponse = formatErrorResponse(error, req);

  res.status(404).json(errorResponse);
}

/**
 * Utility to check if error is operational
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * User-friendly error messages for common codes
 */
export const ErrorMessages = {
  [ErrorCode.UNAUTHORIZED]: 'You must be logged in to access this resource',
  [ErrorCode.INVALID_CREDENTIALS]: 'The email or password you entered is incorrect',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again',
  [ErrorCode.INVALID_API_KEY]: 'The API key provided is invalid or has been revoked',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action',

  [ErrorCode.VALIDATION_ERROR]: 'The data you provided is invalid',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCode.INVALID_FORMAT]: 'The format of the data is invalid',
  [ErrorCode.INVALID_FILE_TYPE]: 'This file type is not supported',
  [ErrorCode.FILE_TOO_LARGE]: 'The file you uploaded is too large',
  [ErrorCode.INVALID_DIMENSIONS]: 'The image dimensions are invalid',

  [ErrorCode.NOT_FOUND]: 'The requested resource was not found',
  [ErrorCode.PROJECT_NOT_FOUND]: 'Project not found',
  [ErrorCode.FILE_NOT_FOUND]: 'File not found',
  [ErrorCode.BUCKET_NOT_FOUND]: 'Storage bucket not found',

  [ErrorCode.ACCESS_DENIED]: 'You do not have access to this resource',
  [ErrorCode.RESOURCE_FORBIDDEN]: 'Access to this resource is forbidden',

  [ErrorCode.RATE_LIMITED]: 'You have made too many requests. Please try again later',
  [ErrorCode.QUOTA_EXCEEDED]: 'You have exceeded your usage quota',

  [ErrorCode.STORAGE_ERROR]: 'A storage error occurred',
  [ErrorCode.UPLOAD_FAILED]: 'File upload failed',
  [ErrorCode.TRANSFORM_FAILED]: 'Image transformation failed',

  [ErrorCode.INTERNAL_ERROR]: 'An internal server error occurred',
} as const;
