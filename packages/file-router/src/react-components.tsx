// React Components for Upload Progress
// The UploadThing Killer - Beautiful Upload UI! ⚛️✨

import React, { useCallback, useState } from 'react';
import { useUploadProgress, useFileUpload, useBatchUpload, UploadOptions } from './react-hooks';
import { UploadProgress, UploadUtils } from './upload-progress';

// Component props interfaces
export interface UploadProgressBarProps {
  upload: UploadProgress;
  showDetails?: boolean;
  className?: string;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
}

export interface FileUploadProps {
  onUploadStart?: (uploadId: string) => void;
  onUploadComplete?: (uploadId: string, result: any) => void;
  onUploadError?: (uploadId: string, error: string) => void;
  options?: UploadOptions;
  accept?: string;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
}

export interface BatchUploadProps extends FileUploadProps {
  maxFiles?: number;
  showProgress?: boolean;
}

// Progress bar component
export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  upload,
  showDetails = true,
  className = '',
  onPause,
  onResume,
  onCancel,
  onRetry,
}) => {
  const getStatusColor = () => {
    switch (upload.status) {
      case 'uploading': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (upload.status) {
      case 'uploading': return '⏳';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'paused': return '⏸️';
      case 'cancelled': return '🚫';
      default: return '⏳';
    }
  };

  return (
    <div className={`upload-progress-bar ${className}`}>
      {/* File info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className="font-medium truncate">{upload.fileName}</span>
          <span className="text-sm text-gray-500">
            {UploadUtils.formatBytes(upload.fileSize)}
          </span>
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-1">
          {upload.status === 'uploading' && onPause && (
            <button
              onClick={onPause}
              className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Pause
            </button>
          )}
          
          {upload.status === 'paused' && onResume && (
            <button
              onClick={onResume}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Resume
            </button>
          )}
          
          {upload.status === 'failed' && onRetry && (
            <button
              onClick={onRetry}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          )}
          
          {(upload.status === 'uploading' || upload.status === 'paused') && onCancel && (
            <button
              onClick={onCancel}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${upload.percentage}%` }}
        />
      </div>

      {/* Details */}
      {showDetails && (
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>{upload.percentage}% complete</span>
            {upload.status === 'uploading' && (
              <span>{UploadUtils.formatSpeed(upload.uploadSpeed)}</span>
            )}
          </div>
          
          {upload.status === 'uploading' && (
            <div className="flex justify-between">
              <span>
                {UploadUtils.formatBytes(upload.bytesUploaded)} / {UploadUtils.formatBytes(upload.fileSize)}
              </span>
              {upload.estimatedTimeRemaining > 0 && (
                <span>ETA: {UploadUtils.formatTime(upload.estimatedTimeRemaining)}</span>
              )}
            </div>
          )}
          
          {upload.status === 'uploading' && (
            <div className="flex justify-between">
              <span>Chunk {upload.currentChunk + 1} / {upload.totalChunks}</span>
              {upload.retryCount > 0 && (
                <span>Retries: {upload.retryCount}/{upload.maxRetries}</span>
              )}
            </div>
          )}
          
          {upload.status === 'failed' && upload.error && (
            <div className="text-red-600">
              Error: {upload.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Single file upload component
export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadStart,
  onUploadComplete,
  onUploadError,
  options,
  accept,
  multiple = false,
  className = '',
  disabled = false,
}) => {
  const { upload, isUploading, uploadFile, pause, resume, cancel, retry } = useFileUpload(options);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    try {
      const uploadId = await uploadFile(file);
      onUploadStart?.(uploadId);
    } catch (error) {
      onUploadError?.(file.name, (error as Error).message);
    }
  }, [uploadFile, onUploadStart, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isUploading) return;
    
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect, disabled, isUploading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <div className={`file-upload ${className}`}>
      {/* Upload area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!disabled && !isUploading) {
            document.getElementById('file-input')?.click();
          }
        }}
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || isUploading}
        />
        
        <div className="space-y-4">
          <div className="text-6xl">📁</div>
          <div>
            <p className="text-lg font-medium">
              {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-gray-500">
              {accept ? `Accepted formats: ${accept}` : 'Any file type accepted'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress display */}
      {upload && (
        <div className="mt-4">
          <UploadProgressBar
            upload={upload}
            onPause={pause}
            onResume={resume}
            onCancel={cancel}
            onRetry={retry}
          />
        </div>
      )}
    </div>
  );
};

// Batch upload component
export const BatchUpload: React.FC<BatchUploadProps> = ({
  onUploadStart,
  onUploadComplete,
  onUploadError,
  options,
  accept,
  maxFiles = 10,
  showProgress = true,
  className = '',
  disabled = false,
}) => {
  const { uploads, isUploading, uploadFiles, batchProgress, pauseUpload, resumeUpload, cancelUpload, clearCompleted } = useBatchUpload(options);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files).slice(0, maxFiles);
    
    try {
      const uploadIds = await uploadFiles(fileArray);
      uploadIds.forEach(uploadId => onUploadStart?.(uploadId));
    } catch (error) {
      onUploadError?.('batch', (error as Error).message);
    }
  }, [uploadFiles, maxFiles, onUploadStart, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <div className={`batch-upload ${className}`}>
      {/* Upload area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!disabled) {
            document.getElementById('batch-file-input')?.click();
          }
        }}
      >
        <input
          id="batch-file-input"
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />
        
        <div className="space-y-4">
          <div className="text-6xl">📂</div>
          <div>
            <p className="text-lg font-medium">
              Upload multiple files
            </p>
            <p className="text-sm text-gray-500">
              Click to upload or drag and drop up to {maxFiles} files
            </p>
            {accept && (
              <p className="text-xs text-gray-400">
                Accepted formats: {accept}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Overall progress */}
      {showProgress && uploads.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Upload Progress</h3>
            <div className="flex space-x-2">
              <span className="text-sm text-gray-600">
                {batchProgress.percentage}% complete
              </span>
              <button
                onClick={clearCompleted}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear Completed
              </button>
            </div>
          </div>
          
          {/* Overall progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${batchProgress.percentage}%` }}
            />
          </div>
          
          {/* Stats */}
          <div className="text-sm text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>
                {UploadUtils.formatBytes(batchProgress.uploadedBytes)} / {UploadUtils.formatBytes(batchProgress.totalBytes)}
              </span>
              {batchProgress.averageSpeed > 0 && (
                <span>{UploadUtils.formatSpeed(batchProgress.averageSpeed)}</span>
              )}
            </div>
            {batchProgress.estimatedTimeRemaining > 0 && (
              <div className="text-right">
                ETA: {UploadUtils.formatTime(batchProgress.estimatedTimeRemaining)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Individual file progress */}
      {uploads.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {uploads.map((upload) => (
            <UploadProgressBar
              key={upload.uploadId}
              upload={upload}
              showDetails={false}
              onPause={() => pauseUpload(upload.uploadId)}
              onResume={() => resumeUpload(upload.uploadId)}
              onCancel={() => cancelUpload(upload.uploadId)}
              onRetry={() => {/* Implement retry logic */}}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Upload dashboard component
export const UploadDashboard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { uploads, stats, clearCompleted, retryFailed } = useUploadProgress();

  return (
    <div className={`upload-dashboard ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Upload Dashboard</h2>
          <div className="flex space-x-2">
            <button
              onClick={retryFailed}
              disabled={stats.failed === 0}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Retry Failed
            </button>
            <button
              onClick={clearCompleted}
              disabled={stats.completed === 0}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Completed
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>

        {/* Upload list */}
        <div className="space-y-3">
          {uploads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No uploads yet. Start uploading files to see them here.
            </div>
          ) : (
            uploads.map((upload) => (
              <UploadProgressBar
                key={upload.uploadId}
                upload={upload}
                showDetails={true}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default {
  UploadProgressBar,
  FileUpload,
  BatchUpload,
  UploadDashboard,
};