import React from "react";
import {
  UploadProgress,
  UploadResult as FileUploadResult,
  UploadMetadata,
} from "@carcosa/file-router";

export interface CarcosaUploadOptions {
  projectId: string;
  routeName: "images" | "documents" | "videos";
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (result: FileUploadResult) => void;
  onError?: (error: Error) => void;
  metadata?: UploadMetadata;
}

export interface CarcosaUploadHook {
  uploadFiles: (
    files: FileList | File[],
    options: CarcosaUploadOptions
  ) => Promise<void>;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: Error | null;
}

class CarcosaUploadClient {
  private wsConnection: WebSocket | null = null;
  private uploadProgressCallbacks: Map<
    string,
    (progress: UploadProgress) => void
  > = new Map();

  constructor() {
    this.connectWebSocket();
  }

  private connectWebSocket() {
    try {
      const wsUrl =
        process.env.NODE_ENV === "production"
          ? `wss://${window.location.host}/api/v1/carcosa/realtime`
          : "ws://localhost:4000/api/v1/carcosa/realtime";

      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log("🔌 WebSocket connected for upload progress");
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "upload:progress" && data.uploadId) {
            const callback = this.uploadProgressCallbacks.get(data.uploadId);
            if (callback) {
              callback(data.progress);
            }
          }
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
        }
      };

      this.wsConnection.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.wsConnection.onclose = () => {
        console.log("🔌 WebSocket disconnected");
        // Attempt to reconnect after a delay
        setTimeout(() => this.connectWebSocket(), 5000);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  }

  async uploadFiles(
    files: FileList | File[],
    options: CarcosaUploadOptions
  ): Promise<void> {
    const {
      projectId,
      routeName,
      onProgress,
      onComplete,
      onError,
      metadata = {},
    } = options;

    try {
      // Step 1: Initialize upload
      const initResponse = await fetch(`/api/v1/carcosa/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          routeName,
          projectId,
          metadata: {
            ...metadata,
            userId: "current-user", // TODO: Get from auth context
          },
        }),
      });

      if (!initResponse.ok) {
        throw new Error(
          `Upload initialization failed: ${initResponse.statusText}`
        );
      }

      const { uploadUrl, metadata: processedMetadata } =
        await initResponse.json();

      // Step 2: Upload files directly to storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("metadata", JSON.stringify(processedMetadata));

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`File upload failed: ${uploadResponse.statusText}`);
        }

        const result = await uploadResponse.json();

        // Step 3: Complete upload
        const completeResponse = await fetch(`/api/v1/carcosa/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            routeName,
            fileKey: result.fileKey,
            metadata: processedMetadata,
            fileInfo: {
              name: file.name,
              size: file.size,
              type: file.type,
            },
          }),
        });

        if (!completeResponse.ok) {
          throw new Error(
            `Upload completion failed: ${completeResponse.statusText}`
          );
        }

        const completeResult = await completeResponse.json();

        // Call completion callback
        if (onComplete) {
          onComplete(completeResult);
        }
      }
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error("Upload failed"));
      }
      throw error;
    }
  }

  // Health check for the upload system
  async healthCheck(): Promise<{ status: string; features: string[] }> {
    try {
      const response = await fetch("/api/v1/carcosa/health");
      if (!response.ok) {
        throw new Error("Health check failed");
      }
      return await response.json();
    } catch (error) {
      console.error("Carcosa health check failed:", error);
      return { status: "error", features: [] };
    }
  }

  // Real-time system health check
  async realtimeHealthCheck(): Promise<{
    realtime: { status: string };
    websocket: { status: string };
  }> {
    try {
      const response = await fetch("/api/v1/realtime/health");
      if (!response.ok) {
        throw new Error("Real-time health check failed");
      }
      return await response.json();
    } catch (error) {
      console.error("Real-time health check failed:", error);
      return { realtime: { status: "error" }, websocket: { status: "error" } };
    }
  }
}

// Export singleton instance
export const carcosaUploadClient = new CarcosaUploadClient();

// React hook for using Carcosa uploads
export function useCarcosaUpload(): CarcosaUploadHook {
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<UploadProgress | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  const uploadFiles = React.useCallback(
    async (files: FileList | File[], options: CarcosaUploadOptions) => {
      setIsUploading(true);
      setError(null);
      setProgress(null);

      try {
        await carcosaUploadClient.uploadFiles(files, {
          ...options,
          onProgress: (progress) => {
            setProgress(progress);
            options.onProgress?.(progress);
          },
          onComplete: (result) => {
            setProgress(null);
            options.onComplete?.(result);
          },
          onError: (error) => {
            setError(error);
            options.onError?.(error);
          },
        });
      } catch (err) {
        const uploadError =
          err instanceof Error ? err : new Error("Upload failed");
        setError(uploadError);
        options.onError?.(uploadError);
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return {
    uploadFiles,
    isUploading,
    progress,
    error,
  };
}

// Utility functions
export const carcosaUtils = {
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  getFileTypeIcon: (fileType: string): string => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.startsWith("video/")) return "🎥";
    if (fileType.startsWith("audio/")) return "🎵";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("spreadsheet") || fileType.includes("excel"))
      return "📊";
    if (fileType.includes("document") || fileType.includes("word")) return "📝";
    if (fileType.includes("zip") || fileType.includes("archive")) return "📦";
    return "📄";
  },

  isValidFileType: (fileType: string, allowedTypes: string[]): boolean => {
    return allowedTypes.some((allowedType) => {
      if (allowedType.includes("/")) {
        return fileType === allowedType;
      }
      return fileType.startsWith(`${allowedType}/`);
    });
  },
};
