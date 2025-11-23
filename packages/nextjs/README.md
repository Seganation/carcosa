# @carcosa/nextjs

Next.js integration utilities for Carcosa.

## Installation

```bash
npm install @carcosa/nextjs
```

## Usage

```tsx
import { useCarcosaUpload } from '@carcosa/nextjs/hooks';

function UploadButton() {
  const { upload, progress } = useCarcosaUpload({
    projectId: 'your-project-id',
    onSuccess: (file) => console.log('Uploaded:', file),
  });

  return (
    <button onClick={() => upload(file)}>
      Upload {progress > 0 && `(${progress}%)`}
    </button>
  );
}
```

## Features

- React hooks for uploads
- Next.js API route helpers
- Server component utilities
- TypeScript support

## License

MIT © Carcosa Team
