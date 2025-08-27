"use client";
import { useState, useCallback } from "react";
import {
  Upload,
  File,
  Image,
  Calendar,
  Download,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: string;
};

export default function UploadsPage() {
  const [projectId, setProjectId] = useState<string>(
    process.env.NEXT_PUBLIC_DEMO_PROJECT_ID || ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const doUpload = async () => {
    if (!file || !projectId) return;

    setUploading(true);
    try {
      // Mock upload for demo - replace with actual SDK calls
      const mockFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: "#",
        createdAt: new Date().toISOString(),
      };

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setFiles((prev) => [mockFile, ...prev]);
      setFile(null);

      // Clear file input
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">Files</h1>
          <p className="text-gray-400">Upload and manage your files</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-6">
        <h2 className="text-lg font-semibold text-white">Upload Files</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Project ID
            </label>
            <Input
              placeholder="Enter project ID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Select File
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-300">
                  {file ? file.name : "Click to select a file"}
                </p>
                {file && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formatFileSize(file.size)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={doUpload}
            disabled={!file || !projectId || uploading}
            className="w-full bg-white text-black hover:bg-gray-100 font-medium"
          >
            {uploading ? "Uploading..." : "Upload File"}
          </Button>
        </div>
      </div>

      {/* Files List */}
      {files.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Uploaded Files</h2>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-white truncate">
                        {file.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{formatFileSize(file.size)}</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(file.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-gray-800 border-gray-700 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <FolderOpen className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">
            No files uploaded yet
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Upload your first file using the form above to get started.
          </p>
        </div>
      )}
    </div>
  );
}
