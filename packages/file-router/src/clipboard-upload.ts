/**
 * 📋 CLIPBOARD UPLOAD SUPPORT
 * 
 * Enables uploading files directly from clipboard (paste action)
 * Feature parity with UploadThing roadmap
 */

export interface ClipboardUploadOptions {
  acceptedTypes?: string[];
  maxFileSize?: number;
  onUpload?: (files: File[]) => void;
  onError?: (error: string) => void;
}

export class ClipboardUploadManager {
  private options: ClipboardUploadOptions;
  private isEnabled = false;

  constructor(options: ClipboardUploadOptions = {}) {
    this.options = {
      acceptedTypes: ['image/*', 'text/*'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      ...options
    };
  }

  enable() {
    if (typeof window === 'undefined') return;
    
    this.isEnabled = true;
    document.addEventListener('paste', this.handlePaste);
    console.log('📋 Clipboard upload enabled');
  }

  disable() {
    if (typeof window === 'undefined') return;
    
    this.isEnabled = false;
    document.removeEventListener('paste', this.handlePaste);
    console.log('📋 Clipboard upload disabled');
  }

  private handlePaste = (event: ClipboardEvent) => {
    if (!this.isEnabled) return;
    
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const files: File[] = [];
    
    // Process clipboard items
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && this.validateFile(file)) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      console.log(`📋 Clipboard upload: ${files.length} files detected`);
      this.options.onUpload?.(files);
    }
  };

  private validateFile(file: File): boolean {
    // Check file type
    if (this.options.acceptedTypes?.length) {
      const isTypeAllowed = this.options.acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });
      
      if (!isTypeAllowed) {
        this.options.onError?.(`File type ${file.type} not allowed`);
        return false;
      }
    }

    // Check file size
    if (this.options.maxFileSize && file.size > this.options.maxFileSize) {
      this.options.onError?.(`File size ${file.size} exceeds limit`);
      return false;
    }

    return true;
  }
}

// React hook for clipboard uploads
export function useClipboardUpload(options: ClipboardUploadOptions = {}) {
  if (typeof window === 'undefined') {
    return { enable: () => {}, disable: () => {} };
  }

  const manager = new ClipboardUploadManager(options);
  
  return {
    enable: () => manager.enable(),
    disable: () => manager.disable()
  };
}
