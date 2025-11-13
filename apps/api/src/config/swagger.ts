import swaggerJSDoc from 'swagger-jsdoc';
import type { Options } from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI Configuration for Carcosa API
 *
 * This configuration generates comprehensive API documentation covering:
 * - Authentication endpoints
 * - File upload and management
 * - Image transformations
 * - Organization/Team/Project management
 * - Real-time WebSocket system
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Carcosa API',
    version: '1.0.0',
    description: `
# Carcosa API Documentation

**Carcosa** is a developer-first, storage-agnostic media control plane for uploads, transforms, and multi-tenancy.
It's built as a self-hosted alternative to services like UploadThing, giving developers complete control over their storage infrastructure.

## Features

- 🚀 **Multi-Provider Storage**: Support for AWS S3, Cloudflare R2, and MinIO
- 📸 **Image Transformations**: On-demand image resizing, format conversion, and optimization
- 🔐 **Authentication**: JWT-based authentication with API keys
- 👥 **Multi-Tenancy**: Organization → Team → Project hierarchy
- ⚡ **Real-time**: WebSocket support for upload progress tracking
- 📊 **Analytics**: Usage tracking and audit logs
- 🎯 **Type-Safe**: Full TypeScript support with Zod validation
- 💾 **Database**: PostgreSQL with Prisma ORM

## Authentication

All protected endpoints require either:

1. **JWT Token** (Cookie or Bearer):
   \`\`\`
   Authorization: Bearer <token>
   \`\`\`
   Or set via cookie: \`carcosa_token\`

2. **API Key** (Header):
   \`\`\`
   x-api-key: carcosa_<project_id>_<random>
   \`\`\`

## Rate Limiting

All endpoints are rate-limited based on your project configuration:
- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour
- Enterprise: Custom limits

Rate limit information is returned in response headers:
- \`X-RateLimit-Limit\`: Total requests allowed
- \`X-RateLimit-Remaining\`: Requests remaining
- \`X-RateLimit-Reset\`: Unix timestamp when limit resets

## Error Responses

All errors follow a standard format:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "statusCode": 400,
    "timestamp": "2025-11-13T10:30:00.000Z",
    "path": "/api/v1/endpoint",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Invalid email format",
          "code": "invalid_string"
        }
      ]
    }
  }
}
\`\`\`

## Real-time WebSocket

Connect to real-time events via Socket.IO:

\`\`\`javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

// Subscribe to upload progress
socket.on('upload.progress', (data) => {
  console.log('Upload progress:', data);
});

// Subscribe to upload completion
socket.on('upload.completed', (data) => {
  console.log('Upload complete:', data);
});
\`\`\`

## Base URL

Development: \`http://localhost:4000/api/v1\`
Production: \`https://your-domain.com/api/v1\`
    `,
    contact: {
      name: 'Carcosa Team',
      url: 'https://github.com/Seganation/carcosa',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://api.carcosa.dev/api/v1',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication endpoints (register, login, logout)',
    },
    {
      name: 'File Upload',
      description: 'File upload endpoints using the file-router system',
    },
    {
      name: 'Image Transforms',
      description: 'On-demand image transformation and optimization',
    },
    {
      name: 'Files',
      description: 'File management (list, delete, metadata)',
    },
    {
      name: 'Organizations',
      description: 'Organization management',
    },
    {
      name: 'Teams',
      description: 'Team management and collaboration',
    },
    {
      name: 'Projects',
      description: 'Project management',
    },
    {
      name: 'Buckets',
      description: 'Storage bucket configuration',
    },
    {
      name: 'API Keys',
      description: 'API key management',
    },
    {
      name: 'Audit Logs',
      description: 'Audit log retrieval',
    },
    {
      name: 'Usage',
      description: 'Usage statistics and analytics',
    },
    {
      name: 'Real-time',
      description: 'WebSocket real-time event system',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /auth/login',
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'carcosa_token',
        description: 'JWT token stored in HTTP-only cookie',
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Project API key for programmatic access',
      },
    },
    schemas: {
      // Common Types
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VAL_001',
              },
              message: {
                type: 'string',
                example: 'Request validation failed',
              },
              statusCode: {
                type: 'integer',
                example: 400,
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
              path: {
                type: 'string',
                example: '/api/v1/auth/register',
              },
              details: {
                type: 'object',
                properties: {
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string' },
                        message: { type: 'string' },
                        code: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // User/Auth Types
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          name: {
            type: 'string',
            example: 'John Doe',
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },

      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
          token: {
            type: 'string',
            description: 'JWT token for authentication',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          message: {
            type: 'string',
            example: 'Login successful',
          },
        },
      },

      // File Upload Types
      UploadInitRequest: {
        type: 'object',
        required: ['fileName', 'fileSize', 'contentType'],
        properties: {
          fileName: {
            type: 'string',
            example: 'profile-picture.jpg',
            description: 'Name of the file to upload',
          },
          fileSize: {
            type: 'integer',
            example: 2048576,
            description: 'Size of the file in bytes',
          },
          contentType: {
            type: 'string',
            example: 'image/jpeg',
            description: 'MIME type of the file',
          },
          routeName: {
            type: 'string',
            enum: ['imageUpload', 'videoUpload', 'documentUpload'],
            default: 'imageUpload',
            description: 'Upload route to use',
          },
        },
      },

      UploadInitResponse: {
        type: 'object',
        properties: {
          uploadId: {
            type: 'string',
            example: 'upload_1731499800000_abc123',
            description: 'Unique upload identifier',
          },
          fileName: {
            type: 'string',
            example: 'profile-picture.jpg',
          },
          fileSize: {
            type: 'integer',
            example: 2048576,
          },
          contentType: {
            type: 'string',
            example: 'image/jpeg',
          },
          presignedUrl: {
            type: 'string',
            format: 'uri',
            description: 'Presigned URL for direct upload to storage',
            example: 'https://s3.amazonaws.com/bucket/key?...',
          },
          fields: {
            type: 'object',
            description: 'Additional fields for multipart upload (if applicable)',
            nullable: true,
          },
          status: {
            type: 'string',
            enum: ['initialized'],
            example: 'initialized',
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'When the presigned URL expires',
          },
          message: {
            type: 'string',
            example: 'Upload initialized successfully',
          },
        },
      },

      UploadCompleteRequest: {
        type: 'object',
        required: ['uploadId', 'fileKey'],
        properties: {
          uploadId: {
            type: 'string',
            example: 'upload_1731499800000_abc123',
            description: 'Upload ID from init response',
          },
          fileKey: {
            type: 'string',
            example: 'profile-picture.jpg',
            description: 'File key/path in storage',
          },
          routeName: {
            type: 'string',
            enum: ['imageUpload', 'videoUpload', 'documentUpload'],
            default: 'imageUpload',
          },
        },
      },

      UploadCompleteResponse: {
        type: 'object',
        properties: {
          uploadId: {
            type: 'string',
            example: 'upload_1731499800000_abc123',
          },
          fileKey: {
            type: 'string',
            example: 'profile-picture.jpg',
          },
          status: {
            type: 'string',
            enum: ['completed'],
            example: 'completed',
          },
          message: {
            type: 'string',
            example: 'Upload completed successfully',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },

      // File Types
      File: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          projectId: {
            type: 'string',
            format: 'uuid',
          },
          filename: {
            type: 'string',
            example: 'profile-picture.jpg',
          },
          path: {
            type: 'string',
            example: 'org/team/project/profile-picture.jpg',
          },
          size: {
            type: 'string',
            example: '2048576',
            description: 'File size in bytes (as string for BigInt)',
          },
          mimeType: {
            type: 'string',
            example: 'image/jpeg',
          },
          metadata: {
            type: 'object',
            description: 'Additional file metadata',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          lastAccessed: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
        },
      },

      // Transform Types
      TransformRequest: {
        description: 'Query parameters for image transformation',
        type: 'object',
        properties: {
          w: {
            type: 'integer',
            example: 800,
            description: 'Target width in pixels',
          },
          h: {
            type: 'integer',
            example: 600,
            description: 'Target height in pixels',
          },
          fit: {
            type: 'string',
            enum: ['cover', 'contain', 'fill', 'inside', 'outside'],
            default: 'cover',
            description: 'How the image should be resized',
          },
          format: {
            type: 'string',
            enum: ['jpeg', 'jpg', 'png', 'webp', 'avif'],
            description: 'Output format (defaults to input format)',
          },
          quality: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 80,
            description: 'Quality for lossy formats (1-100)',
          },
          blur: {
            type: 'number',
            minimum: 0.3,
            maximum: 1000,
            description: 'Blur radius (0.3 to 1000)',
          },
          grayscale: {
            type: 'boolean',
            description: 'Convert to grayscale',
          },
        },
      },

      // Health Check
      HealthCheck: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ok'],
            example: 'ok',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          version: {
            type: 'string',
            example: '1.0.0',
          },
          features: {
            type: 'object',
            properties: {
              upload: { type: 'boolean' },
              storage: { type: 'boolean' },
              realtime: { type: 'boolean' },
              multiProvider: { type: 'boolean' },
            },
          },
          storage: {
            type: 'object',
            properties: {
              providers: {
                type: 'array',
                items: { type: 'string' },
                example: ['s3-primary', 'r2-primary'],
              },
              defaultProvider: {
                type: 'string',
                example: 's3-primary',
              },
            },
          },
          realtime: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              maxConnections: { type: 'integer' },
            },
          },
          routes: {
            type: 'object',
            properties: {
              imageUpload: { type: 'string' },
              videoUpload: { type: 'string' },
              documentUpload: { type: 'string' },
            },
          },
          message: {
            type: 'string',
            example: 'Carcosa file-router system fully operational! 🚀',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Unauthorized - Missing or invalid authentication',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'AUTH_001',
                message: 'Authentication required',
                statusCode: 401,
                timestamp: '2025-11-13T10:30:00.000Z',
                path: '/api/v1/files',
              },
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'AUTH_002',
                message: 'Insufficient permissions',
                statusCode: 403,
                timestamp: '2025-11-13T10:30:00.000Z',
                path: '/api/v1/projects/123',
              },
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation Error - Invalid request data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'VAL_001',
                message: 'Request validation failed',
                statusCode: 400,
                timestamp: '2025-11-13T10:30:00.000Z',
                path: '/api/v1/auth/register',
                details: {
                  errors: [
                    {
                      field: 'body.email',
                      message: 'Invalid email address',
                      code: 'invalid_string',
                    },
                  ],
                },
              },
            },
          },
        },
      },
      NotFoundError: {
        description: 'Not Found - Resource does not exist',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'NOT_FOUND',
                message: 'Resource not found',
                statusCode: 404,
                timestamp: '2025-11-13T10:30:00.000Z',
                path: '/api/v1/files/123',
              },
            },
          },
        },
      },
      RateLimitError: {
        description: 'Rate Limit Exceeded - Too many requests',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Rate limit exceeded. Please try again later.',
                statusCode: 429,
                timestamp: '2025-11-13T10:30:00.000Z',
                path: '/api/v1/uploads',
                details: {
                  limit: 100,
                  remaining: 0,
                  resetAt: '2025-11-13T11:00:00.000Z',
                },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
    {
      CookieAuth: [],
    },
    {
      ApiKeyAuth: [],
    },
  ],
};

const options: Options = {
  swaggerDefinition,
  // Path to the API docs (routes with JSDoc comments)
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/docs/*.yaml', // For additional YAML documentation
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
