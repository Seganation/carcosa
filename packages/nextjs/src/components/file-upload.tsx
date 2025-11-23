import React, { useCallback, useState } from "react";
import { useCarcosaUpload } from "../hooks/use-carcosa-upload.js";

export interface FileUploadProps {
  projectId: string;
  apiKey: string;
  baseUrl: string;
  tenantId?: string;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  onSuccess?: (result: { path: string; url: string; size: number }) => void;
  onError?: (error: Error) => void;
  className?: string;
  children?: React.ReactNode;
}

export function FileUpload({
  projectId,
  apiKey,
  baseUrl,
  tenantId,
  multiple = false,
  accept,
  maxSize,
  onSuccess,
  onError,
  className = "",
  children,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { upload, uploadMultiple, isUploading, progress, error, reset } = useCarcosaUpload({
    projectId,
    apiKey,
    baseUrl,
    onSuccess,
    onError,
  });

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((file) => {
        if (maxSize && file.size > maxSize) {
          console.warn(`File ${file.name} is too large (${file.size} > ${maxSize})`);
          return false;
        }
        return true;
      });

      setSelectedFiles(validFiles);
    },
    [maxSize]
  );

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      if (multiple) {
        await uploadMultiple(selectedFiles, { tenantId });
      } else {
        const file = selectedFiles[0];
        if (file) {
          await upload(file, { tenantId });
        }
      }
      setSelectedFiles([]);
      reset();
    } catch (err) {
      // Error is handled by the hook
    }
  }, [selectedFiles, multiple, upload, uploadMultiple, tenantId, reset]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
    },
    [handleFileSelect]
  );

  return (
    <div className={`carcosa-file-upload ${className}`}>
      {/* Drag & Drop Zone */}
      <div
        className={`upload-zone ${isDragOver ? "drag-over" : ""} ${
          isUploading ? "uploading" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {children || (
          <div className="upload-content">
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              {isDragOver
                ? "Drop files here"
                : "Drag & drop files here or click to select"}
            </p>
            <input
              type="file"
              multiple={multiple}
              accept={accept}
              onChange={handleFileInputChange}
              className="file-input"
              disabled={isUploading}
            />
          </div>
        )}
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h4>Selected Files ({selectedFiles.length})</h4>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="upload-button"
          >
            {isUploading ? "Uploading..." : "Upload Files"}
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <p>Error: {error.message}</p>
          <button onClick={reset} className="reset-button">
            Reset
          </button>
        </div>
      )}

      <style>{`
        .carcosa-file-upload {
          width: 100%;
        }

        .upload-zone {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
        }

        .upload-zone:hover {
          border-color: #3b82f6;
          background-color: #f8fafc;
        }

        .upload-zone.drag-over {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .upload-zone.uploading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .upload-content {
          pointer-events: none;
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .upload-text {
          color: #6b7280;
          margin: 0;
        }

        .file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .selected-files {
          margin-top: 1rem;
          padding: 1rem;
          background-color: #f9fafb;
          border-radius: 6px;
        }

        .selected-files h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .selected-files ul {
          margin: 0 0 1rem 0;
          padding-left: 1.5rem;
          font-size: 0.875rem;
        }

        .upload-button {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .upload-button:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .upload-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .progress-bar {
          margin-top: 1rem;
          background-color: #e5e7eb;
          border-radius: 9999px;
          height: 8px;
          position: relative;
          overflow: hidden;
        }

        .progress-fill {
          background-color: #3b82f6;
          height: 100%;
          transition: width 0.3s ease;
        }

        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
        }

        .error-message {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
        }

        .reset-button {
          background-color: #dc2626;
          color: white;
          border: none;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          margin-top: 0.5rem;
        }

        .reset-button:hover {
          background-color: #b91c1c;
        }
      `}</style>
    </div>
  );
}
