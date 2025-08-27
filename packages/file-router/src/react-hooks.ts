// React Hooks for Upload Progress & Resumable Uploads
// The UploadThing Killer - React Integration! ⚛️🚀

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  UploadProgressManager, 
  UploadProgress, 
  UploadEvent, 
  UploadConfig, 
  UploadUtils,
  createUploadProgressManager 
} from './upload-progress';

// Hook return types
export interface UseUploadProgressReturn {
  // State
  uploads: UploadProgress[];
  activeUploads: UploadProgress[];
  
  // Actions
  startUpload: (file: File, options?: UploadOptions) => Promise<string>;
  pauseUpload: (uploadId: string) => void;
  resumeUpload: (uploadId: string) => Promise<void>;
  cancelUpload: (uploadId: string) => void;
  
  // Utils
  getUpload: (uploadId: string) => UploadProgress | undefined;
  clearCompleted: () => void;
  retryFailed: () => void;
  
  // Stats
  stats: {
    total: number;
    active: number;
    completed: number;
    failed: number;
    totalProgress: number;
    averageSpeed: number;
    estimatedTimeRemaining: number;
  };
}

export interface UploadOptions {
  routeName?: string;
  metadata?: Record<string, any>;
  chunkSize?: number;
  maxRetries?: number;
}

// Main upload progress hook
export function useUploadProgress(config?: Partial<UploadConfig>): UseUploadProgressReturn {
  const managerRef = useRef<UploadProgressManager | null>(null);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize upload manager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = createUploadProgressManager(config);
      
      // Listen to all upload events
      managerRef.current.addGlobalEventListener((event: UploadEvent) => {
        setUploads(managerRef.current!.getAllUploads());
      });
      
      setIsInitialized(true);
    }
  }, [config]);

  // Start a new upload
  const startUpload = useCallback(async (file: File, options: UploadOptions = {}): Promise<string> => {
    if (!managerRef.current) throw new Error('Upload manager not initialized');
    
    const uploadId = UploadUtils.generateUploadId();
    const fileKey = `${uploadId}_${file.name}`;
    
    // Create upload session
    managerRef.current.createUpload(uploadId, fileKey, file.name, file.size);
    
    // Start upload
    await managerRef.current.startUpload(uploadId);
    
    return uploadId;
  }, []);

  // Pause upload
  const pauseUpload = useCallback((uploadId: string) => {
    managerRef.current?.pauseUpload(uploadId);
  }, []);

  // Resume upload
  const resumeUpload = useCallback(async (uploadId: string) => {
    if (managerRef.current) {
      await managerRef.current.resumeUpload(uploadId);
    }
  }, []);

  // Cancel upload
  const cancelUpload = useCallback((uploadId: string) => {
    managerRef.current?.cancelUpload(uploadId);
  }, []);

  // Get specific upload
  const getUpload = useCallback((uploadId: string) => {
    return managerRef.current?.getProgress(uploadId);
  }, []);

  // Clear completed uploads
  const clearCompleted = useCallback(() => {
    managerRef.current?.cleanup(0); // Clear immediately
    setUploads(managerRef.current?.getAllUploads() || []);
  }, []);

  // Retry all failed uploads
  const retryFailed = useCallback(async () => {
    const failedUploads = uploads.filter(u => u.status === 'failed');
    for (const upload of failedUploads) {
      upload.retryCount = 0; // Reset retry count
      await managerRef.current?.startUpload(upload.uploadId);
    }
  }, [uploads]);

  // Calculate stats
  const stats = {
    total: uploads.length,
    active: uploads.filter(u => u.status === 'uploading').length,
    completed: uploads.filter(u => u.status === 'completed').length,
    failed: uploads.filter(u => u.status === 'failed').length,
    totalProgress: uploads.length > 0 
      ? uploads.reduce((sum, u) => sum + u.percentage, 0) / uploads.length 
      : 0,
    averageSpeed: uploads.length > 0 
      ? uploads.reduce((sum, u) => sum + u.uploadSpeed, 0) / uploads.length 
      : 0,
    estimatedTimeRemaining: uploads
      .filter(u => u.status === 'uploading')
      .reduce((max, u) => Math.max(max, u.estimatedTimeRemaining), 0),
  };

  // Active uploads
  const activeUploads = uploads.filter(u => u.status === 'uploading' || u.status === 'paused');

  return {
    uploads,
    activeUploads,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    getUpload,
    clearCompleted,
    retryFailed,
    stats,
  };
}

// Hook for single file upload
export function useFileUpload(options?: UploadOptions) {
  const [upload, setUpload] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const managerRef = useRef<UploadProgressManager | null>(null);

  // Initialize manager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = createUploadProgressManager();
    }
  }, []);

  // Upload file
  const uploadFile = useCallback(async (file: File): Promise<string> => {
    if (!managerRef.current) throw new Error('Upload manager not initialized');
    
    setIsUploading(true);
    const uploadId = UploadUtils.generateUploadId();
    const fileKey = `${uploadId}_${file.name}`;
    
    // Create upload and listen to events
    const progress = managerRef.current.createUpload(uploadId, fileKey, file.name, file.size);
    setUpload(progress);
    
    managerRef.current.addEventListener(uploadId, (event: UploadEvent) => {
      setUpload({ ...event.progress });
      
      if (event.type === 'completed' || event.type === 'failed' || event.type === 'cancelled') {
        setIsUploading(false);
      }
    });
    
    // Start upload
    await managerRef.current.startUpload(uploadId);
    
    return uploadId;
  }, []);

  // Pause current upload
  const pause = useCallback(() => {
    if (upload && managerRef.current) {
      managerRef.current.pauseUpload(upload.uploadId);
    }
  }, [upload]);

  // Resume current upload
  const resume = useCallback(async () => {
    if (upload && managerRef.current) {
      await managerRef.current.resumeUpload(upload.uploadId);
    }
  }, [upload]);

  // Cancel current upload
  const cancel = useCallback(() => {
    if (upload && managerRef.current) {
      managerRef.current.cancelUpload(upload.uploadId);
    }
  }, [upload]);

  // Retry current upload
  const retry = useCallback(async () => {
    if (upload && managerRef.current) {
      upload.retryCount = 0;
      await managerRef.current.startUpload(upload.uploadId);
    }
  }, [upload]);

  return {
    upload,
    isUploading,
    uploadFile,
    pause,
    resume,
    cancel,
    retry,
  };
}

// Hook for batch uploads
export function useBatchUpload(options?: UploadOptions) {
  const { uploads, activeUploads, startUpload, ...rest } = useUploadProgress();
  const [isUploading, setIsUploading] = useState(false);

  // Upload multiple files
  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    setIsUploading(true);
    
    try {
      const uploadIds = await Promise.all(
        files.map(file => startUpload(file, options))
      );
      
      return uploadIds;
    } finally {
      setIsUploading(false);
    }
  }, [startUpload, options]);

  // Check if any uploads are active
  useEffect(() => {
    const hasActive = activeUploads.length > 0;
    setIsUploading(hasActive);
  }, [activeUploads]);

  // Calculate batch progress
  const batchProgress = UploadUtils.calculateOverallProgress(uploads);

  return {
    uploads,
    activeUploads,
    isUploading,
    uploadFiles,
    batchProgress,
    ...rest,
  };
}

// Hook for upload status monitoring
export function useUploadStatus(uploadId: string) {
  const [upload, setUpload] = useState<UploadProgress | null>(null);
  const managerRef = useRef<UploadProgressManager | null>(null);

  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = createUploadProgressManager();
    }

    // Get initial upload state
    const initialUpload = managerRef.current.getProgress(uploadId);
    if (initialUpload) {
      setUpload(initialUpload);
    }

    // Listen to upload events
    const listener = (event: UploadEvent) => {
      if (event.uploadId === uploadId) {
        setUpload({ ...event.progress });
      }
    };

    managerRef.current.addEventListener(uploadId, listener);

    return () => {
      managerRef.current?.removeEventListener(uploadId, listener);
    };
  }, [uploadId]);

  return upload;
}

// Hook for upload statistics
export function useUploadStats() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    failed: 0,
    totalBytesUploaded: 0,
    averageSpeed: 0,
  });

  const managerRef = useRef<UploadProgressManager | null>(null);

  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = createUploadProgressManager();
    }

    const updateStats = () => {
      const currentStats = managerRef.current!.getStats();
      setStats({
        total: currentStats.total,
        active: currentStats.activeCount,
        completed: currentStats.completed,
        failed: currentStats.failed,
        totalBytesUploaded: currentStats.totalBytesUploaded,
        averageSpeed: currentStats.averageSpeed,
      });
    };

    // Update stats initially
    updateStats();

    // Update stats on upload events
    const listener = () => updateStats();
    managerRef.current.addGlobalEventListener(listener);

    // Update stats periodically
    const interval = setInterval(updateStats, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return stats;
}