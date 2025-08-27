import { useState, useCallback, useEffect } from "react";
import { CarcosaClient } from "@carcosa/sdk";

export interface UseCarcosaFilesOptions {
  projectId: string;
  apiKey: string;
  baseUrl: string;
  tenantId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface CarcosaFile {
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface UseCarcosaFilesReturn {
  files: CarcosaFile[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  deleteMultiple: (paths: string[]) => Promise<void>;
}

export function useCarcosaFiles(options: UseCarcosaFilesOptions): UseCarcosaFilesReturn {
  const [files, setFiles] = useState<CarcosaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const client = new CarcosaClient({
    baseUrl: options.baseUrl,
    apiKey: options.apiKey,
  });

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await client.listFiles({
        projectId: options.projectId,
        tenantId: options.tenantId,
      });

      setFiles(result.files);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch files");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [client, options.projectId, options.tenantId]);

  const deleteFile = useCallback(
    async (path: string) => {
      try {
        await client.deleteFile(options.projectId, path);
        // Remove from local state
        setFiles((prev) => prev.filter((file) => file.path !== path));
      } catch (err) {
        const error = err instanceof Error ? err : new Error(`Failed to delete ${path}`);
        setError(error);
        throw error;
      }
    },
    [client, options.projectId]
  );

  const deleteMultiple = useCallback(
    async (paths: string[]) => {
      try {
        // Delete files in parallel
        await Promise.all(paths.map((path) => client.deleteFile(options.projectId, path)));
        
        // Remove from local state
        setFiles((prev) => prev.filter((file) => !paths.includes(file.path)));
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to delete multiple files");
        setError(error);
        throw error;
      }
    },
    [client, options.projectId]
  );

  // Auto-refresh if enabled
  useEffect(() => {
    if (!options.autoRefresh) return;

    const interval = setInterval(refresh, options.refreshInterval || 30000); // Default 30s
    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval, refresh]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    files,
    isLoading,
    error,
    refresh,
    deleteFile,
    deleteMultiple,
  };
}
