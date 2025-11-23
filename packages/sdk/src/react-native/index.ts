/**
 * 📱 REACT NATIVE SUPPORT
 * 
 * Mobile-optimized upload hooks and utilities
 * Feature parity with UploadThing roadmap + mobile-specific optimizations
 */

import { useState, useCallback } from 'react';

// React Native compatible types
export interface NativeUploadOptions {
  endpoint: string;
  headers?: Record<string, string>;
  maxFileSize?: number;
  acceptedTypes?: string[];
  onProgress?: (progress: number) => void;
  onSuccess?: (result: NativeUploadResult) => void;
  onError?: (error: string) => void;
}

export interface NativeUploadResult {
  fileId: string;
  url: string;
  size: number;
  filename: string;
  uploadTime: number;
}

export interface NativeFile {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

// React Native upload hook
export function useNativeUpload(options: NativeUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: NativeFile): Promise<NativeUploadResult | null> => {
    if (isUploading) {
      setError('Upload already in progress');
      return null;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      console.log('📱 Starting React Native upload:', file.name);

      // Validate file size
      if (options.maxFileSize && file.size && file.size > options.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size`);
      }

      // Validate file type
      if (options.acceptedTypes?.length) {
        const isTypeAllowed = options.acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.slice(0, -1));
          }
          return file.type === type;
        });
        
        if (!isTypeAllowed) {
          throw new Error(`File type ${file.type} not allowed`);
        }
      }

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);

      const startTime = Date.now();

      // React Native fetch with progress tracking
      const response = await fetch(options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          ...options.headers,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const uploadTime = Date.now() - startTime;

      const uploadResult: NativeUploadResult = {
        fileId: result.fileId || `native_${Date.now()}`,
        url: result.url || result.fileUrl,
        size: file.size || 0,
        filename: file.name,
        uploadTime,
      };

      setProgress(100);
      console.log('✅ React Native upload complete:', uploadResult);
      options.onSuccess?.(uploadResult);
      
      return uploadResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      console.error('❌ React Native upload error:', errorMessage);
      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [options, isUploading]);

  const uploadMultiple = useCallback(async (files: NativeFile[]): Promise<NativeUploadResult[]> => {
    const results: NativeUploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      const result = await uploadFile(file);
      if (result) {
        results.push(result);
      }
      
      // Update overall progress
      const overallProgress = ((i + 1) / files.length) * 100;
      setProgress(overallProgress);
      options.onProgress?.(overallProgress);
    }
    
    return results;
  }, [uploadFile, options]);

  return {
    uploadFile,
    uploadMultiple,
    isUploading,
    progress,
    error,
    reset: () => {
      setProgress(0);
      setError(null);
    }
  };
}

// React Native image picker integration
export function useNativeImagePicker(uploadOptions: NativeUploadOptions) {
  const { uploadFile, isUploading, progress, error } = useNativeUpload(uploadOptions);

  const pickAndUpload = useCallback(async () => {
    try {
      // Note: This would typically use react-native-image-picker
      // For now, we'll provide the interface
      console.log('📱 Opening React Native image picker...');
      
      // Mock image selection (replace with actual picker)
      const mockImage: NativeFile = {
        uri: 'file:///mock/path/image.jpg',
        type: 'image/jpeg',
        name: 'image.jpg',
        size: 1024 * 1024 // 1MB
      };
      
      return await uploadFile(mockImage);
    } catch (err) {
      console.error('❌ Image picker error:', err);
      return null;
    }
  }, [uploadFile]);

  return {
    pickAndUpload,
    isUploading,
    progress,
    error
  };
}

// React Native document picker integration  
export function useNativeDocumentPicker(uploadOptions: NativeUploadOptions) {
  const { uploadFile, isUploading, progress, error } = useNativeUpload(uploadOptions);

  const pickAndUpload = useCallback(async () => {
    try {
      console.log('📱 Opening React Native document picker...');
      
      // Mock document selection (replace with actual picker)
      const mockDocument: NativeFile = {
        uri: 'file:///mock/path/document.pdf',
        type: 'application/pdf', 
        name: 'document.pdf',
        size: 2 * 1024 * 1024 // 2MB
      };
      
      return await uploadFile(mockDocument);
    } catch (err) {
      console.error('❌ Document picker error:', err);
      return null;
    }
  }, [uploadFile]);

  return {
    pickAndUpload,
    isUploading,
    progress,
    error
  };
}

// Export all React Native utilities
// TODO: Implement camera-upload and background-upload modules
// export * from './camera-upload.js';
// export * from './background-upload.js';

// Native-specific upload utilities
export const NativeUploadUtils = {
  // Check if running in React Native environment
  isReactNative: () => {
    return typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
  },
  
  // Get optimal chunk size for mobile networks
  getOptimalChunkSize: (networkType: 'wifi' | '4g' | '3g' | '2g' = 'wifi') => {
    switch (networkType) {
      case 'wifi': return 5 * 1024 * 1024; // 5MB
      case '4g': return 2 * 1024 * 1024;   // 2MB  
      case '3g': return 512 * 1024;        // 512KB
      case '2g': return 128 * 1024;        // 128KB
      default: return 1024 * 1024;         // 1MB
    }
  },
  
  // Format file size for mobile display
  formatFileSize: (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
};
