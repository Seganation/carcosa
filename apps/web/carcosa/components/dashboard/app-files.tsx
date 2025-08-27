"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Files, Upload, Search, MoreHorizontal, Download, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface AppFilesProps {
  appId: string;
}

interface FileData {
  id: string;
  path: string;
  filename: string;
  size: number;
  mimeType: string;
  version: string;
  uploadedAt: string;
  lastAccessed?: string;
  metadata?: any;
}

interface FilesResponse {
  files: FileData[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function AppFiles({ appId }: AppFilesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch files from API
  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('carcosa_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:4000/api/v1/projects/${appId}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const data: FilesResponse = await response.json();
      setFiles(data.files);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch files';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load files on component mount
  useEffect(() => {
    fetchFiles();
  }, [appId]);

  // Filter files based on search query
  const filteredFiles = files.filter((file) =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Download file function
  const downloadFile = async (file: FileData) => {
    try {
      const token = localStorage.getItem('carcosa_token');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      // Get signed download URL
      const response = await fetch(`http://localhost:4000/api/v1/projects/${appId}/files/${file.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get download URL: ${response.statusText}`);
      }

      const { url } = await response.json();
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download file';
      toast.error(errorMessage);
    }
  };

  // Format file size function
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get folder path from file path
  const getFolderPath = (filePath: string): string => {
    const parts = filePath.split('/');
    if (parts.length <= 1) return '/';
    return parts.slice(0, -1).join('/') + '/';
  };

  // Delete file function
  const deleteFile = async (file: FileData) => {
    if (!confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('carcosa_token');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:4000/api/v1/projects/${appId}/files`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paths: [file.path],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      toast.success('File deleted successfully');
      fetchFiles(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Files</h1>
          <p className="text-muted-foreground">
            Manage your uploaded files and assets
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchFiles} variant="outline">
            <Files className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Files className="h-4 w-4" />
            Files ({filteredFiles.length})
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading files...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-2">{error}</p>
              <Button onClick={fetchFiles} variant="outline">Retry</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-orange-500/10 flex items-center justify-center">
                    <Files className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium">{file.filename}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">Path:</span>
                      <span className="font-mono bg-muted px-2 py-1 rounded ml-1">
                        {getFolderPath(file.path)}
                      </span>
                      <span className="font-mono bg-blue-100 px-2 py-1 rounded ml-1 text-blue-700">
                        {file.filename}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">
                        {file.mimeType.split("/")[0]}
                      </Badge>
                      <span>•</span>
                      <span>
                        Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                      {file.lastAccessed && (
                        <>
                          <span>•</span>
                          <span>
                            Last accessed: {new Date(file.lastAccessed).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => downloadFile(file)}
                    title="Download file"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteFile(file)}
                    title="Delete file"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredFiles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "No files found matching your search"
                  : "No files uploaded yet"}
              </div>
            )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
