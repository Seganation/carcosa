# @carcosa/storage

S3-compatible storage adapters for Carcosa. Supports AWS S3, Cloudflare R2, and MinIO.

## Installation

```bash
npm install @carcosa/storage
```

## Usage

```typescript
import { S3Adapter, R2Adapter } from '@carcosa/storage';

// AWS S3
const s3 = new S3Adapter({
  bucketName: 'my-bucket',
  region: 'us-east-1',
  accessKeyId: 'xxx',
  secretAccessKey: 'xxx',
});

// Cloudflare R2
const r2 = new R2Adapter({
  bucketName: 'my-bucket',
  accountId: 'xxx',
  accessKeyId: 'xxx',
  secretAccessKey: 'xxx',
});

// Upload a file
await storage.putObject('path/to/file.jpg', buffer);

// Download a file
const buffer = await storage.getObject('path/to/file.jpg');

// Generate signed URL
const url = await storage.getSignedPutUrl('path/to/file.jpg');
```

## License

MIT © Carcosa Team
