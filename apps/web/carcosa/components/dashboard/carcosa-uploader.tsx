/**
 * 🚀 CARCOSA UPLOADER COMPONENT
 * 
 * Advanced file upload component using the @carcosa/file-router package
 * Features: Multi-file, drag & drop, real-time progress, automatic transformations
 */

"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Image,
  FileText,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { toast } from 'react-hot-toast';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
  transforms?: {
    thumbnail?: string;
    medium?: string;
    large?: string;
  };
}

interface CarcosaUploaderProps {
  onUploadComplete?: (files: UploadFile[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  uploadType?: 'images' | 'documents' | 'videos';
  enableClipboard?: boolean;
  className?: string;
}

export function CarcosaUploader({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*', 'application/*', 'text/*'],
  uploadType = 'images',
  enableClipboard = true,
  className = ''
}: CarcosaUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const getTypeConfig = () => {
    switch (uploadType) {
      case 'images':
        return {
          icon: Image,
          title: 'Image Upload',
          description: 'Upload images with automatic transformations',
          accept: 'image/*',
          maxSize: '10MB',
          endpoint: '/api/v1/carcosa/images'
        };
      case 'documents':
        return {
          icon: FileText,
          title: 'Document Upload',
          description: 'Upload documents and files',
          accept: 'application/*,text/*,.pdf,.doc,.docx,.txt,.csv,.json',
          maxSize: '50MB',
          endpoint: '/api/v1/carcosa/documents'
        };
      case 'videos':
        return {
          icon: Video,
          title: 'Video Upload',
          description: 'Upload videos with processing',
          accept: 'video/*',
          maxSize: '100MB',
          endpoint: '/api/v1/carcosa/videos'
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const addFiles = (newFiles: File[]) => {
    if (files.length + newFiles.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
  };

  // 📋 Clipboard upload support  
  useEffect(() => {
    if (!enableClipboard) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        console.log(`📋 Clipboard upload: ${pastedFiles.length} files detected`);
        addFiles(pastedFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [enableClipboard, addFiles]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const realUpload = async (uploadFile: UploadFile) => {
    const updateProgress = (progress: number) => {
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, progress, status: 'uploading' as const }
          : f
      ));
    };

    try {
      // Step 1: Initialize upload - get presigned URL from API
      const initResponse = await fetch(`${apiUrl}/api/v1/carcosa/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fileName: uploadFile.file.name,
          fileSize: uploadFile.file.size,
          contentType: uploadFile.file.type,
          routeName: `${uploadType}Upload`, // imageUpload, videoUpload, documentUpload
        }),
      });

      if (!initResponse.ok) {
        const error = await initResponse.json();
        throw new Error(error.error || 'Upload initialization failed');
      }

      const initData = await initResponse.json();
      updateProgress(10);

      // Step 2: Upload file directly to storage using presigned URL
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = ((e.loaded / e.total) * 80) + 10; // 10-90%
          updateProgress(Math.round(percentComplete));
        }
      });

      // Upload to presigned URL
      await new Promise<void>((resolve, reject) => {
        xhr.open('PUT', initData.presignedUrl);
        xhr.setRequestHeader('Content-Type', uploadFile.file.type);

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(uploadFile.file);
      });

      updateProgress(90);

      // Step 3: Complete upload - notify API
      const completeResponse = await fetch(`${apiUrl}/api/v1/carcosa/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          uploadId: initData.uploadId,
          fileKey: uploadFile.file.name,
          routeName: `${uploadType}Upload`,
        }),
      });

      if (!completeResponse.ok) {
        const error = await completeResponse.json();
        throw new Error(error.error || 'Upload completion failed');
      }

      const completeData = await completeResponse.json();
      updateProgress(100);

      // Generate transform URLs for images
      const transforms = uploadType === 'images' ? {
        thumbnail: `${apiUrl}/api/v1/transform/${initData.projectId || 'default'}/${uploadFile.file.name}?w=150&h=150&fit=cover&q=80`,
        medium: `${apiUrl}/api/v1/transform/${initData.projectId || 'default'}/${uploadFile.file.name}?w=500&h=500&fit=inside&q=85`,
        large: `${apiUrl}/api/v1/transform/${initData.projectId || 'default'}/${uploadFile.file.name}?w=1200&h=1200&fit=inside&q=90`,
      } : undefined;

      // Mark as completed
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
              ...f,
              status: 'completed',
              progress: 100,
              url: `${apiUrl}/api/v1/carcosa/files/${completeData.fileId || initData.uploadId}`,
              transforms,
            }
          : f
      ));

      toast.success(`${uploadFile.file.name} uploaded successfully!`);

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
              ...f,
              status: 'error',
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ));
      toast.error(`Failed to upload ${uploadFile.file.name}`);
    }
  };

  const startUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    if (!user) {
      toast.error('Please log in to upload files');
      onUploadError?.('User not authenticated');
      return;
    }

    setIsUploading(true);

    try {
      // Upload files concurrently (max 3 at a time to avoid overwhelming)
      const chunkSize = 3;
      for (let i = 0; i < pendingFiles.length; i += chunkSize) {
        const chunk = pendingFiles.slice(i, i + chunkSize);
        await Promise.all(chunk.map(realUpload));
      }

      const completedFiles = files.filter(f => f.status === 'completed');
      onUploadComplete?.(completedFiles);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'uploading': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className="h-5 w-5" />
          {config.title}
          <Badge variant="secondary">Carcosa Powered</Badge>
        </CardTitle>
        <CardDescription>
          {config.description} • Max {config.maxSize} per file • {maxFiles} files max
          {enableClipboard && ' • 📋 Paste support'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Drop files here or click to browse
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Supports {config.accept} • Powered by Carcosa file-router
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={config.accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                addFiles(Array.from(e.target.files));
              }
            }}
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Files ({files.length})</h4>
              {files.some(f => f.status === 'pending') && (
                <Button 
                  onClick={startUpload} 
                  disabled={isUploading}
                  size="sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Start Upload
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(file.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {file.file.name}
                      </span>
                      <Badge variant="outline" className={getStatusColor(file.status)}>
                        {file.status}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="mt-2" />
                    )}
                    
                    {file.error && (
                      <div className="text-xs text-red-600 mt-1">{file.error}</div>
                    )}

                    {file.url && file.status === 'completed' && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                        
                        {file.transforms && (
                          <div className="flex gap-1">
                            {file.transforms.thumbnail && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={file.transforms.thumbnail} target="_blank">
                                  Thumb
                                </a>
                              </Button>
                            )}
                            {file.transforms.medium && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={file.transforms.medium} target="_blank">
                                  Medium
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {files.length > 0 && (
          <div className="flex justify-between text-sm text-gray-500 pt-4 border-t">
            <span>
              Total: {files.length} files • 
              Completed: {files.filter(f => f.status === 'completed').length} • 
              Errors: {files.filter(f => f.status === 'error').length}
            </span>
            <span className="text-blue-600">
              ⚡ Powered by Carcosa
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}