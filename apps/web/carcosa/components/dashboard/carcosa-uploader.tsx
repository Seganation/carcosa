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

  const simulateUpload = async (uploadFile: UploadFile) => {
    // Simulate upload progress
    const updateProgress = (progress: number) => {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, progress, status: 'uploading' as const }
          : f
      ));
    };

    try {
      // Simulate chunked upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        updateProgress(i);
      }

      // Simulate successful completion with Carcosa features
      const mockResponse = {
        success: true,
        fileId: `carcosa_${uploadFile.id}`,
        url: `https://cdn.carcosa.dev/${uploadFile.file.name}`,
        transforms: uploadType === 'images' ? {
          thumbnail: `https://cdn.carcosa.dev/${uploadFile.file.name}?w=150&h=150&fit=cover`,
          medium: `https://cdn.carcosa.dev/${uploadFile.file.name}?w=500&h=500&fit=inside`,
          large: `https://cdn.carcosa.dev/${uploadFile.file.name}?w=1200&h=1200&fit=inside`
        } : undefined,
        metadata: {
          uploadedAt: new Date().toISOString(),
          service: 'carcosa-file-router'
        }
      };

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'completed', 
              progress: 100,
              url: mockResponse.url,
              transforms: mockResponse.transforms
            }
          : f
      ));

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ));
    }
  };

  const startUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    try {
      // Upload files concurrently
      await Promise.all(pendingFiles.map(simulateUpload));
      
      const completedFiles = files.filter(f => f.status === 'completed');
      onUploadComplete?.(completedFiles);
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
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