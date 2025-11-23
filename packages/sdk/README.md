# @carcosa/sdk

Official Carcosa SDK for file uploads, transformations, and storage management.

## Installation

```bash
npm install @carcosa/sdk
```

## Usage

```typescript
import { CarcosaClient } from '@carcosa/sdk';

const client = new CarcosaClient({
  apiUrl: 'https://your-carcosa-api.com',
  apiKey: 'your-api-key',
});

// Upload a file
const file = await client.upload({
  file: myFile,
  projectId: 'project-id',
});

// Transform an image
const transformed = await client.transform({
  path: file.path,
  width: 800,
  height: 600,
  format: 'webp',
});
```

## Features

- File uploads with progress tracking
- Image transformations (resize, format, quality)
- Multi-tenant support
- TypeScript support with full type safety
- React hooks for easy integration
- Next.js utilities

## Documentation

Visit [github.com/Seganation/carcosa](https://github.com/Seganation/carcosa) for full documentation.

## License

MIT © Carcosa Team
