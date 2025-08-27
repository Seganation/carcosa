# @carcosa/file-router

**Typed file upload router system for Carcosa - The UploadThing Killer! 🚀**

This package provides a type-safe, middleware-driven file upload system that matches UploadThing's developer experience while giving you complete control over your storage infrastructure.

## ✨ Features

- **🚀 Type-Safe Routes** - Full TypeScript support with inference
- **🔒 Middleware Support** - Custom validation, auth, and business logic
- **📁 File Constraints** - Size, count, and type validation
- **🎯 Upload Completion** - Handle post-upload processing
- **🌐 Framework Agnostic** - Works with Express, Next.js, Fastify, and more
- **⚡ Zero Dependencies** - Lightweight and fast

## 🚀 Quick Start

### 1. Install the Package

```bash
npm install @carcosa/file-router
```

### 2. Create Your Upload Router

```typescript
import { createUploadRouter, f } from '@carcosa/file-router';

export const uploadRouter = createUploadRouter<{
  userId: string;
  projectId: string;
}>();

// Define your routes
uploadRouter.addRoute(
  'profileImage',
  f.imageUploader({ maxFileSize: '2MB', maxFileCount: 1 })
    .middleware(async ({ req, metadata }) => {
      // Custom auth logic
      const userId = req.headers['x-user-id'];
      if (!userId) throw new Error('Authentication required');
      
      return { userId, projectId: 'default' };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Post-upload processing
      console.log(`Profile image uploaded for user ${metadata.userId}`);
      return { success: true };
    })
);
```

### 3. Use with Express

```typescript
import express from 'express';
import { createUploadMiddleware } from '@carcosa/file-router';
import { uploadRouter } from './upload-router';

const app = express();
const uploadMiddleware = createUploadMiddleware(uploadRouter);

app.post('/api/upload/init', uploadMiddleware.handleUploadInit.bind(uploadMiddleware));
app.post('/api/upload/complete', uploadMiddleware.handleUploadComplete.bind(uploadMiddleware));
```

### 4. Use with Next.js

```typescript
// pages/api/upload/init.ts
import { uploadRouter } from '../../../upload-router';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { routeName, metadata } = req.body;
    const route = uploadRouter.getRoute(routeName);
    
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Handle upload initialization
    // ... implementation details
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## 🎯 API Reference

### File Type Builders

#### `f.imageUploader(config?)`
Creates an image uploader with constraints.

```typescript
f.imageUploader({
  maxFileSize: '4MB',
  maxFileCount: 5,
  maxWidth: 1920,
  maxHeight: 1080
})
```

#### `f.videoUploader(config?)`
Creates a video uploader with constraints.

```typescript
f.videoUploader({
  maxFileSize: '128MB',
  maxFileCount: 1,
  maxDuration: 300 // 5 minutes
})
```

#### `f.audioUploader(config?)`
Creates an audio uploader with constraints.

```typescript
f.audioUploader({
  maxFileSize: '32MB',
  maxFileCount: 10,
  maxDuration: 600 // 10 minutes
})
```

#### `f.documentUploader(config?)`
Creates a document uploader for PDFs, etc.

```typescript
f.documentUploader({
  maxFileSize: '16MB',
  maxFileCount: 20
})
```

#### `f.fileUploader(config?)`
Creates a general file uploader.

```typescript
f.fileUploader({
  maxFileSize: '64MB',
  maxFileCount: 50
})
```

### Route Methods

#### `.middleware(fn)`
Add custom middleware for validation, auth, or business logic.

```typescript
.middleware(async ({ req, metadata }) => {
  // Verify user authentication
  const token = req.headers.authorization;
  const user = await verifyToken(token);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return { userId: user.id, projectId: user.defaultProject };
})
```

#### `.onUploadComplete(fn)`
Handle post-upload processing.

```typescript
.onUploadComplete(async ({ metadata, file }) => {
  // Save to database
  await db.files.create({
    key: file.key,
    name: file.name,
    userId: metadata.userId,
    projectId: metadata.projectId
  });
  
  // Trigger image processing
  await processImage(file.key);
  
  return { saved: true, processed: true };
})
```

## 🔧 Configuration

### File Size Constraints
- `1B`, `1KB`, `1MB`, `4MB`, `8MB`, `16MB`, `32MB`, `64MB`, `128MB`, `256MB`, `512MB`, `1GB`, `2GB`, `4GB`, `8GB`, `16GB`

### File Type Constraints
- `image`, `video`, `audio`, `text`, `pdf`, `spreadsheet`, `presentation`, `archive`, `code`, `font`, `model`, `other`

### Route Configuration
```typescript
interface RouteConfig {
  maxFileSize?: FileSize;
  maxFileCount?: number;
  allowedFileTypes?: FileType[];
  image?: {
    maxFileSize?: FileSize;
    maxFileCount?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  video?: {
    maxFileSize?: FileSize;
    maxFileCount?: number;
    maxDuration?: number;
  };
  audio?: {
    maxFileSize?: FileSize;
    maxFileCount?: number;
    maxDuration?: number;
  };
}
```

## 🚀 Advanced Usage

### Custom File Validation

```typescript
uploadRouter.addRoute(
  'customValidation',
  f.fileUploader()
    .middleware(async ({ req, metadata }) => {
      // Custom business logic
      const user = await getUser(req.headers.authorization);
      const project = await getProject(req.body.projectId);
      
      // Check user permissions
      if (!user.canUploadToProject(project.id)) {
        throw new Error('Insufficient permissions');
      }
      
      // Check project limits
      if (project.uploadCount >= project.maxUploads) {
        throw new Error('Project upload limit reached');
      }
      
      return { userId: user.id, projectId: project.id };
    })
);
```

### Batch Processing

```typescript
uploadRouter.addRoute(
  'batchUpload',
  f.fileUploader({ maxFileCount: 100 })
    .onUploadComplete(async ({ metadata, file }) => {
      // Process multiple files
      await processBatchFile(file.key, metadata.batchId);
      
      // Update progress
      await updateBatchProgress(metadata.batchId, file.key);
      
      return { batchProcessed: true };
    })
);
```

## 🔌 Integration Examples

### Express.js
See `examples/express-app.ts` for a complete Express.js integration.

### Next.js
See `examples/nextjs-app.ts` for a complete Next.js integration.

### Fastify
```typescript
import fastify from 'fastify';
import { createUploadMiddleware } from '@carcosa/file-router';

const app = fastify();
const uploadMiddleware = createUploadMiddleware(uploadRouter);

app.post('/upload/init', async (request, reply) => {
  return uploadMiddleware.handleUploadInit(request, reply);
});
```

## 🆚 vs UploadThing

| Feature | UploadThing | Carcosa File Router |
|---------|-------------|---------------------|
| **Typed Routes** | ✅ | ✅ |
| **Middleware** | ✅ | ✅ |
| **File Constraints** | ✅ | ✅ |
| **Upload Callbacks** | ✅ | ✅ |
| **Storage Control** | ❌ | ✅ (Your buckets) |
| **Cost Control** | ❌ | ✅ (Your pricing) |
| **Self-Hosted** | ❌ | ✅ |
| **Multi-Tenant** | ❌ | ✅ |

## 🚧 Roadmap

- [ ] **Webhook System** - Real-time upload notifications
- [ ] **Resumable Uploads** - HTTP Range support
- [ ] **Progress Tracking** - Real-time upload progress
- [ ] **Transform Pipeline** - Image/video processing
- [ ] **CDN Integration** - Global file distribution
- [ ] **Framework Adapters** - Vue, Svelte, React Native

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ by the Carcosa Team**

*The UploadThing Killer - Because you deserve better file management! 🚀*