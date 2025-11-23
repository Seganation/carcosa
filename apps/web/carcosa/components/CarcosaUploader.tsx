"use client";

import React, { useState, useCallback, useRef } from "react";
import { useCarcosaUpload, carcosaUtils } from "../lib/carcosa-upload-api";
import { UploadProgress } from "@carcosa/file-router";

interface CarcosaUploaderProps {
  projectId: string;
  uploadType: "images" | "documents" | "videos";
  maxFiles?: number;
  onUploadComplete?: (results: any[]) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
}

export function CarcosaUploader({
  projectId,
  uploadType,
  maxFiles = 5,
  onUploadComplete,
  onUploadError,
  className = "",
}: CarcosaUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedResults, setUploadedResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFiles, isUploading, progress, error } = useCarcosaUpload();

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }
      setSelectedFiles(files);
    },
    [maxFiles]
  );

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      alert("Please select files to upload");
      return;
    }

    const results: any[] = [];

    await uploadFiles(selectedFiles, {
      projectId,
      routeName: uploadType,
      onProgress: (progress: UploadProgress) => {
        console.log("Upload progress:", progress);
      },
      onComplete: (result) => {
        console.log("Upload complete:", result);
        results.push(result);
        setUploadedResults((prev) => [...prev, result]);
      },
      onError: (error) => {
        console.error("Upload error:", error);
        onUploadError?.(error);
      },
    });

    if (results.length > 0) {
      onUploadComplete?.(results);
    }

    // Clear selection after upload
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [
    selectedFiles,
    projectId,
    uploadType,
    uploadFiles,
    onUploadComplete,
    onUploadError,
  ]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const getUploadTypeConfig = () => {
    switch (uploadType) {
      case "images":
        return {
          accept: "image/*",
          icon: "🖼️",
          title: "Upload Images",
          description: "PNG, JPG, GIF, WebP (max 4MB each)",
          maxSize: "4MB",
        };
      case "documents":
        return {
          accept: ".pdf,.doc,.docx,.txt,.md",
          icon: "📄",
          title: "Upload Documents",
          description: "PDF, DOC, TXT, MD (max 16MB each)",
          maxSize: "16MB",
        };
      case "videos":
        return {
          accept: "video/*",
          icon: "🎥",
          title: "Upload Videos",
          description: "MP4, MOV, AVI, WebM (max 128MB each)",
          maxSize: "128MB",
        };
      default:
        return {
          accept: "*/*",
          icon: "📁",
          title: "Upload Files",
          description: "Select files to upload",
          maxSize: "16MB",
        };
    }
  };

  const config = getUploadTypeConfig();

  return (
    <div className={`carcosa-uploader ${className}`}>
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept={config.accept}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <div
          className="cursor-pointer"
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <div className="text-4xl mb-4">{config.icon}</div>
          <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
          <p className="text-gray-600 mb-4">{config.description}</p>
          <p className="text-sm text-gray-500">Click to select files</p>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-3 rounded"
              >
                <div className="flex items-center space-x-3">
                  <span>{carcosaUtils.getFileTypeIcon(file.type)}</span>
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {carcosaUtils.formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                  disabled={isUploading}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isUploading
              ? "Uploading..."
              : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* Progress */}
      {isUploading && progress && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {carcosaUtils.formatFileSize(progress.bytesUploaded)} /{" "}
            {carcosaUtils.formatFileSize(progress.fileSize)}(
            {Math.round(progress.percentage)}%)
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <p className="font-semibold">Upload Error</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* Success */}
      {uploadedResults.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
          <p className="font-semibold">Upload Complete! ✅</p>
          <p className="text-sm">
            Successfully uploaded {uploadedResults.length} file
            {uploadedResults.length > 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
