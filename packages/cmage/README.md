# @carcosa/cmage

React image component with automatic Carcosa transformations.

## Installation

```bash
npm install @carcosa/cmage
```

## Usage

```tsx
import { CarcosaImage } from '@carcosa/cmage';

function App() {
  return (
    <CarcosaImage
      src="/path/to/image.jpg"
      width={800}
      height={600}
      format="webp"
      quality={80}
      alt="My image"
    />
  );
}
```

## Features

- Automatic image optimization
- Lazy loading
- Responsive images
- Format conversion (WebP, AVIF)
- Smart cropping and resizing

## License

MIT © Carcosa Team
