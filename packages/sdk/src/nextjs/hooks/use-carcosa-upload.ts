import { useState, useCallback } from "react";
import { CarcosaClient } from "../../client.js";

export interface UseCarcosaUploadOptions {
  projectId: string;
  apiKey: string;
  baseUrl: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (result: { path: string; url: string; size: number }) => void;
  onError?: (error: Error) => void;
}

export interface UseCarcosaUploadReturn {
  upload: (file: File, options?: { path?: string; tenantId?: string }) => Promise<void>;
  uploadMultiple: (files: File[], options?: { path?: string; tenantId?: string }) => Promise<void>;
  isUploading: boolean;
  progress: number;
  error: Error | null;
  reset: () => void;
}

export function useCarcosaUpload(options: UseCarcosaUploadOptions): UseCarcosaUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const client = new CarcosaClient({
    baseUrl: options.baseUrl,
    apiKey: options.apiKey,
  });

  const reset = useCallback(() => {
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File, uploadOptions?: { path?: string; tenantId?: string }) => {
      try {
        setIsUploading(true);
        setError(null);
        setProgress(0);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + Math.random() * 20, 90));
        }, 200);

        const result = await client.uploadFile(options.projectId, file, {
          path: uploadOptions?.path,
          tenantId: uploadOptions?.tenantId,
          onProgress: (progress) => {
            setProgress(progress);
            options.onProgress?.(progress);
          },
        });

        clearInterval(progressInterval);
        setProgress(100);

        options.onSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error);
        options.onError?.(error);
      } finally {
        setIsUploading(false);
      }
    },
    [client, options]
  );

  const uploadMultiple = useCallback(
    async (files: File[], uploadOptions?: { path?: string; tenantId?: string }) => {
      try {
        setIsUploading(true);
        setError(null);
        setProgress(0);

        const totalFiles = files.length;
        let completedFiles = 0;

        for (const file of files) {
          try {
            await upload(file, uploadOptions);
            completedFiles++;
            setProgress((completedFiles / totalFiles) * 100);
          } catch (err) {
            console.error(`Failed to upload ${file.name}:`, err);
            // Continue with other files
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Multiple upload failed");
        setError(error);
        options.onError?.(error);
      } finally {
        setIsUploading(false);
      }
    },
    [upload, options]
  );

  return {
    upload,
    uploadMultiple,
    isUploading,
    progress,
    error,
    reset,
  };
}
