/**
 * 🚀 CARCOSA DEMO PAGE
 * 
 * Comprehensive demo of all Carcosa file-router features
 */

"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CarcosaUploader } from '../../../components/CarcosaUploader';
import { 
  Rocket, 
  Zap, 
  Shield, 
  Globe, 
  Code,
  FileImage,
  FileText,
  Video,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function CarcosaDemoPage() {
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  const features = [
    {
      icon: Rocket,
      title: "Advanced Upload Router",
      description: "Type-safe upload routes with automatic validation and middleware"
    },
    {
      icon: Zap,
      title: "Real-time Progress",
      description: "WebSocket-powered progress tracking with pause/resume support"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "API key authentication, rate limiting, and audit logging"
    },
    {
      icon: Globe,
      title: "Multi-storage Support",
      description: "S3, R2, and custom storage adapters with seamless switching"
    },
    {
      icon: Code,
      title: "Developer Experience",
      description: "TypeScript-first with comprehensive React hooks and components"
    },
    {
      icon: FileImage,
      title: "Automatic Transformations",
      description: "Image resizing, format conversion, and optimization on-the-fly"
    }
  ];

  const endpoints = [
    { method: "GET", path: "/api/v1/carcosa/health", description: "System health check" },
    { method: "POST", path: "/api/v1/carcosa/images", description: "Upload images with transforms" },
    { method: "POST", path: "/api/v1/carcosa/documents", description: "Upload documents and files" },
    { method: "POST", path: "/api/v1/carcosa/videos", description: "Upload videos with processing" },
    { method: "POST", path: "/api/v1/carcosa/init", description: "Initialize chunked upload" },
    { method: "POST", path: "/api/v1/carcosa/complete", description: "Complete upload workflow" }
  ];

  const handleUploadComplete = (results: any[]) => {
    setUploadResults(prev => [...prev, { type: 'Upload', files: results, timestamp: new Date() }]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Rocket className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold">Carcosa File-Router</h1>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <Sparkles className="h-4 w-4 mr-1" />
            Production Ready
          </Badge>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          The most advanced file upload system for modern web applications. 
          Built with TypeScript, powered by real-time progress tracking, and designed for enterprise scale.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <feature.icon className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            API Endpoints
          </CardTitle>
          <CardDescription>
            RESTful API endpoints for seamless integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <Badge 
                  variant={endpoint.method === 'GET' ? 'secondary' : 'default'}
                  className="min-w-[60px] justify-center"
                >
                  {endpoint.method}
                </Badge>
                <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex-1">
                  {endpoint.path}
                </code>
                <span className="text-sm text-gray-600">{endpoint.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Demo */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Live Demo</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Try the upload components below to see Carcosa in action
          </p>
        </div>

        {/* Upload Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CarcosaUploader
            projectId="demo-project"
            uploadType="images"
            maxFiles={5}
            onUploadComplete={handleUploadComplete}
            onUploadError={(error) => console.error('Image upload error:', error)}
          />

          <CarcosaUploader
            projectId="demo-project"
            uploadType="documents"
            maxFiles={3}
            onUploadComplete={handleUploadComplete}
            onUploadError={(error) => console.error('Document upload error:', error)}
          />
        </div>

        <CarcosaUploader
          projectId="demo-project"
          uploadType="videos"
          maxFiles={2}
          onUploadComplete={handleUploadComplete}
          onUploadError={(error) => console.error('Video upload error:', error)}
        />
      </div>

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Upload Results
            </CardTitle>
            <CardDescription>
              Real-time results from your upload tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge>{result.type}</Badge>
                    <span className="text-sm text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <strong>{result.files.length}</strong> files uploaded successfully
                  </div>
                  {result.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {result.files.map((file: any, fileIndex: number) => (
                        <div key={fileIndex} className="text-xs text-gray-600 flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {file.file.name}
                          {file.transforms && (
                            <Badge variant="outline" className="text-xs">
                              +transforms
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technology Stack */}
      <Card>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
          <CardDescription>
            Built with modern technologies for maximum performance and developer experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'TypeScript', 'React', 'Node.js', 'Express',
              'Socket.IO', 'Prisma', 'S3/R2', 'WebSockets',
              'Multer', 'Sharp', 'FFmpeg', 'Redis'
            ].map((tech) => (
              <Badge key={tech} variant="outline" className="justify-center py-2">
                {tech}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center gap-2 text-lg">
          <span>Powered by</span>
          <Rocket className="h-5 w-5 text-blue-600" />
          <strong>Carcosa</strong>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          The complete file management solution for modern applications
        </p>
        <Button size="lg" className="gap-2">
          Get Started <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
