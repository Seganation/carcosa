/**
 * Comprehensive Request Validation Schemas
 *
 * Provides Zod validation schemas for all API endpoints with:
 * - Type-safe validation
 * - Custom error messages
 * - Reusable schema components
 * - File upload validation
 * - Transform parameter validation
 * - Auth flow validation
 */

import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errors.js';

/**
 * Common validation schemas
 */

// UUID validation
export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

// Email validation
export const emailSchema = z
  .string()
  .email({ message: 'Invalid email address' })
  .min(3, { message: 'Email must be at least 3 characters' })
  .max(255, { message: 'Email must not exceed 255 characters' })
  .toLowerCase()
  .trim();

// Password validation
export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(128, { message: 'Password must not exceed 128 characters' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' });

// URL validation
export const urlSchema = z
  .string()
  .url({ message: 'Invalid URL format' })
  .max(2048, { message: 'URL must not exceed 2048 characters' });

// Slug validation (lowercase, alphanumeric, hyphens)
export const slugSchema = z
  .string()
  .min(3, { message: 'Slug must be at least 3 characters' })
  .max(63, { message: 'Slug must not exceed 63 characters' })
  .regex(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  .trim();

// Name validation
export const nameSchema = z
  .string()
  .min(1, { message: 'Name is required' })
  .max(255, { message: 'Name must not exceed 255 characters' })
  .trim();

// Optional description
export const descriptionSchema = z
  .string()
  .max(2000, { message: 'Description must not exceed 2000 characters' })
  .trim()
  .optional();

/**
 * Pagination schemas
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().min(1).max(1000).default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().positive().min(1).max(100).default(50)),
});

/**
 * Authentication Schemas
 */

// User registration
export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
    confirmPassword: z.string().optional(),
  }).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// User login
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, { message: 'Password is required' }),
    rememberMe: z.boolean().optional(),
  }),
});

// Password reset request
export const resetPasswordRequestSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

// Password reset confirmation
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, { message: 'Reset token is required' }),
    password: passwordSchema,
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

/**
 * File Upload Schemas
 */

// Supported MIME types
const imageMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
] as const;

const videoMimeTypes = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
] as const;

const documentMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
] as const;

// File upload initialization
export const uploadInitSchema = z.object({
  body: z.object({
    fileName: z
      .string()
      .min(1, { message: 'File name is required' })
      .max(255, { message: 'File name must not exceed 255 characters' })
      .regex(/^[a-zA-Z0-9._-]+$/, { message: 'File name contains invalid characters' }),
    fileSize: z
      .number()
      .int()
      .positive()
      .max(100 * 1024 * 1024, { message: 'File size must not exceed 100MB' }), // 100MB max
    contentType: z
      .string()
      .min(1, { message: 'Content type is required' }),
    routeName: z
      .string()
      .optional()
      .default('default'),
    metadata: z.record(z.any()).optional(),
  }),
  params: z.object({
    projectId: uuidSchema,
  }),
});

// Upload completion
export const uploadCompleteSchema = z.object({
  body: z.object({
    uploadId: z.string().min(1, { message: 'Upload ID is required' }),
    fileUrl: z.string().url({ message: 'Invalid file URL' }).optional(),
    etag: z.string().optional(),
  }),
});

// File deletion
export const deleteFileSchema = z.object({
  params: z.object({
    projectId: uuidSchema,
    fileId: uuidSchema,
  }),
});

// List files
export const listFilesSchema = z.object({
  params: z.object({
    projectId: uuidSchema,
  }),
  query: paginationSchema.extend({
    search: z.string().max(255).optional(),
    mimeType: z.string().optional(),
    tenantId: uuidSchema.optional(),
  }),
});

/**
 * Transform Schemas
 */

// Image transform query parameters
export const transformSchema = z.object({
  params: z.object({
    version: z
      .string()
      .regex(/^\d+$/, { message: 'Version must be a number' })
      .transform(Number)
      .pipe(z.number().int().positive()),
    projectId: uuidSchema,
    path: z.string().min(1, { message: 'File path is required' }),
  }),
  query: z.object({
    w: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .pipe(z.number().int().positive().min(1).max(10000).optional()),
    h: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .pipe(z.number().int().positive().min(1).max(10000).optional()),
    q: z
      .string()
      .optional()
      .default('80')
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(100).default(80)),
    f: z
      .enum(['jpeg', 'jpg', 'png', 'webp', 'avif'])
      .optional(),
    fit: z
      .enum(['cover', 'contain', 'fill', 'inside', 'outside'])
      .optional()
      .default('cover'),
  }),
});

// List transforms
export const listTransformsSchema = z.object({
  params: z.object({
    id: uuidSchema, // projectId
  }),
  query: paginationSchema.extend({
    status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    search: z.string().max(255).optional(),
  }),
});

// Retry transform
export const retryTransformSchema = z.object({
  params: z.object({
    id: uuidSchema, // projectId
    transformId: uuidSchema,
  }),
});

// Delete transform
export const deleteTransformSchema = z.object({
  params: z.object({
    id: uuidSchema, // projectId
    transformId: uuidSchema,
  }),
});

/**
 * Project Schemas
 */

// Create project
export const createProjectSchema = z.object({
  body: z.object({
    name: nameSchema,
    slug: slugSchema,
    description: descriptionSchema,
    teamId: uuidSchema.optional(),
    bucketId: uuidSchema.optional(),
    settings: z.record(z.any()).optional(),
  }),
});

// Update project
export const updateProjectSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: nameSchema.optional(),
    description: descriptionSchema,
    settings: z.record(z.any()).optional(),
  }),
});

// Delete project
export const deleteProjectSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

/**
 * API Key Schemas
 */

// Create API key
export const createApiKeySchema = z.object({
  body: z.object({
    projectId: uuidSchema,
    label: nameSchema,
    expiresAt: z
      .string()
      .datetime({ message: 'Invalid expiration date' })
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    permissions: z.array(z.string()).optional(),
  }),
});

// Revoke API key
export const revokeApiKeySchema = z.object({
  params: z.object({
    id: uuidSchema, // keyId
  }),
});

/**
 * Bucket Schemas
 */

// Create bucket
export const createBucketSchema = z.object({
  body: z.object({
    name: nameSchema,
    provider: z.enum(['s3', 'r2'], { message: 'Provider must be either "s3" or "r2"' }),
    region: z.string().min(1, { message: 'Region is required' }),
    bucketName: z.string().min(1, { message: 'Bucket name is required' }),
    endpoint: urlSchema.optional(),
    accessKeyId: z.string().min(1, { message: 'Access key ID is required' }),
    secretAccessKey: z.string().min(1, { message: 'Secret access key is required' }),
    publicUrlTemplate: urlSchema.optional(),
  }),
});

// Update bucket
export const updateBucketSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: nameSchema.optional(),
    publicUrlTemplate: urlSchema.optional(),
    settings: z.record(z.any()).optional(),
  }),
});

/**
 * Team Schemas
 */

// Create team
export const createTeamSchema = z.object({
  body: z.object({
    name: nameSchema,
    slug: slugSchema,
    description: descriptionSchema,
    organizationId: uuidSchema,
  }),
});

// Add team member
export const addTeamMemberSchema = z.object({
  params: z.object({
    id: uuidSchema, // teamId
  }),
  body: z.object({
    userId: uuidSchema,
    role: z.enum(['owner', 'admin', 'member', 'viewer'], {
      message: 'Role must be one of: owner, admin, member, viewer',
    }),
  }),
});

/**
 * Organization Schemas
 */

// Create organization
export const createOrganizationSchema = z.object({
  body: z.object({
    name: nameSchema,
    slug: slugSchema,
    description: descriptionSchema,
    settings: z.record(z.any()).optional(),
  }),
});

/**
 * Validation Middleware Factory
 *
 * Creates Express middleware that validates incoming requests against Zod schemas
 */
export function validate(schema: z.ZodSchema<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate the request
      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace request data with validated & transformed data
      req.body = validatedData.body || req.body;
      req.query = validatedData.query || req.query;
      req.params = validatedData.params || req.params;

      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return next(new ValidationError('Request validation failed', {
          errors: validationErrors,
          details: error.flatten(),
        }));
      }

      // Re-throw other errors
      next(error);
    }
  };
}

/**
 * Body-only validation (for simple cases)
 */
export function validateBody(schema: z.ZodSchema<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBody = await schema.parseAsync(req.body);
      req.body = validatedBody;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        throw new ValidationError('Request body validation failed', {
          errors: validationErrors,
        });
      }
      next(error);
    }
  };
}

/**
 * Query-only validation (for simple cases)
 */
export function validateQuery(schema: z.ZodSchema<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = await schema.parseAsync(req.query);
      req.query = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        throw new ValidationError('Query parameter validation failed', {
          errors: validationErrors,
        });
      }
      next(error);
    }
  };
}

/**
 * Params-only validation (for simple cases)
 */
export function validateParams(schema: z.ZodSchema<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = await schema.parseAsync(req.params);
      req.params = validatedParams;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        throw new ValidationError('Path parameter validation failed', {
          errors: validationErrors,
        });
      }
      next(error);
    }
  };
}
