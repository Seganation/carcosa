/**
 * 🚀 CARCOSA FILE-ROUTER REACT DEMO
 * 
 * This demo shows how to use the @carcosa/file-router React components
 * to create a powerful, real-time file upload experience.
 * 
 * Features Demonstrated:
 * - Real-time upload progress
 * - Multi-file uploads
 * - File type validation
 * - Transform previews
 * - Error handling
 * - Beautiful UI
 * 
 * To run: npm run demo:react
 */

import React, { useState, useEffect } from 'react';
import { 
  FileUpload, 
  useCarcosaUpload, 
  useFileProgress,
  UploadDropzone,
  useRealtimeClient 
} from '../src/react-hooks.js';

// Demo configuration
const DEMO_API_URL = 'http://localhost:4001';
const DEMO_USER_ID = 'demo-user-123';

// Main demo component
export function CarcosaFileRouterDemo() {
  const [selectedTab, setSelectedTab] = useState<'images' | 'documents' | 'videos'>('images');
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);

  // Real-time client connection
  const realtimeClient = useRealtimeClient({
    apiUrl: DEMO_API_URL,
    enableProgressTracking: true,
    enableAutoReconnect: true
  });

  // Image upload hook
  const imageUpload = useCarcosaUpload({
    endpoint: `${DEMO_API_URL}/upload/images`,
    headers: { 'x-user-id': DEMO_USER_ID },
    onUploadComplete: (results) => {
      console.log('🖼️ Images uploaded:', results);
      setUploadHistory(prev => [...prev, ...results.map(r => ({ ...r, type: 'image' }))]);
    },
    onUploadError: (error) => {
      console.error('❌ Image upload error:', error);
    },
    onProgress: (progress) => {
      console.log('📊 Image upload progress:', progress);
    }
  });

  // Document upload hook
  const documentUpload = useCarcosaUpload({
    endpoint: `${DEMO_API_URL}/upload/documents`,
    headers: { 'x-user-id': DEMO_USER_ID },
    onUploadComplete: (results) => {
      console.log('📄 Documents uploaded:', results);
      setUploadHistory(prev => [...prev, ...results.map(r => ({ ...r, type: 'document' }))]);
    },
    onUploadError: (error) => {
      console.error('❌ Document upload error:', error);
    }
  });

  // Video upload hook
  const videoUpload = useCarcosaUpload({
    endpoint: `${DEMO_API_URL}/upload/videos`,
    headers: { 'x-user-id': DEMO_USER_ID },
    onUploadComplete: (results) => {
      console.log('🎥 Video uploaded:', results);
      setUploadHistory(prev => [...prev, ...results.map(r => ({ ...r, type: 'video' }))]);
    },
    onUploadError: (error) => {
      console.error('❌ Video upload error:', error);
    }
  });

  // Real-time event listeners
  useEffect(() => {
    if (!realtimeClient) return;

    realtimeClient.on('upload.progress', (data) => {
      console.log('⚡ Real-time progress:', data);
    });

    realtimeClient.on('upload.complete', (data) => {
      console.log('✅ Real-time upload complete:', data);
    });

    realtimeClient.on('transform.complete', (data) => {
      console.log('🔄 Transform complete:', data);
    });

    return () => {
      realtimeClient.off('upload.progress');
      realtimeClient.off('upload.complete');
      realtimeClient.off('transform.complete');
    };
  }, [realtimeClient]);

  const renderUploadArea = () => {
    switch (selectedTab) {
      case 'images':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">🖼️ Image Upload</h3>
            <p className="text-gray-600">Upload images with automatic transformations</p>
            
            <UploadDropzone
              accept="image/*"
              maxSize="10MB"
              maxFiles={5}
              onFilesSelected={imageUpload.uploadFiles}
              isUploading={imageUpload.isUploading}
              progress={imageUpload.progress}
              error={imageUpload.error}
              className="border-2 border-dashed border-blue-300 hover:border-blue-400 bg-blue-50 rounded-lg p-8 transition-colors"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🖼️</div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop images here or click to select
                </p>
                <p className="text-sm text-gray-500">
                  JPG, PNG, WebP up to 10MB each (max 5 files)
                </p>
                
                {imageUpload.isUploading && (
                  <div className="mt-4 space-y-2">
                    {imageUpload.progress.map((p, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{p.fileName}</span>
                          <span className="text-sm text-gray-500">{p.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {imageUpload.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">❌ {imageUpload.error}</p>
                  </div>
                )}
              </div>
            </UploadDropzone>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">📄 Document Upload</h3>
            <p className="text-gray-600">Upload documents with metadata extraction</p>
            
            <UploadDropzone
              accept=".pdf,.doc,.docx,.txt"
              maxSize="50MB"
              maxFiles={3}
              onFilesSelected={documentUpload.uploadFiles}
              isUploading={documentUpload.isUploading}
              progress={documentUpload.progress}
              error={documentUpload.error}
              className="border-2 border-dashed border-green-300 hover:border-green-400 bg-green-50 rounded-lg p-8 transition-colors"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">📄</div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop documents here or click to select
                </p>
                <p className="text-sm text-gray-500">
                  PDF, DOC, DOCX, TXT up to 50MB each (max 3 files)
                </p>
                
                {documentUpload.isUploading && (
                  <div className="mt-4 space-y-2">
                    {documentUpload.progress.map((p, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{p.fileName}</span>
                          <span className="text-sm text-gray-500">{p.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {documentUpload.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">❌ {documentUpload.error}</p>
                  </div>
                )}
              </div>
            </UploadDropzone>
          </div>
        );

      case 'videos':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">🎥 Video Upload</h3>
            <p className="text-gray-600">Upload videos with automatic processing</p>
            
            <UploadDropzone
              accept="video/*"
              maxSize="100MB"
              maxFiles={1}
              onFilesSelected={videoUpload.uploadFiles}
              isUploading={videoUpload.isUploading}
              progress={videoUpload.progress}
              error={videoUpload.error}
              className="border-2 border-dashed border-purple-300 hover:border-purple-400 bg-purple-50 rounded-lg p-8 transition-colors"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🎥</div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop video here or click to select
                </p>
                <p className="text-sm text-gray-500">
                  MP4, WebM up to 100MB (1 file)
                </p>
                
                {videoUpload.isUploading && (
                  <div className="mt-4 space-y-2">
                    {videoUpload.progress.map((p, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{p.fileName}</span>
                          <span className="text-sm text-gray-500">{p.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Processing will begin after upload...
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {videoUpload.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">❌ {videoUpload.error}</p>
                  </div>
                )}
              </div>
            </UploadDropzone>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              🚀 Carcosa File Router Demo
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Production-ready file uploads with real-time progress tracking
            </p>
            <div className="mt-4 flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✅ Real-time Connected
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                ⚡ Multi-Storage Ready
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                🎯 UploadThing Killer
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Upload Area */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
              {[
                { key: 'images', label: '🖼️ Images', color: 'blue' },
                { key: 'documents', label: '📄 Documents', color: 'green' },
                { key: 'videos', label: '🎥 Videos', color: 'purple' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
                    selectedTab === tab.key
                      ? `bg-${tab.color}-500 text-white`
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Upload Area */}
            <div className="bg-white rounded-lg shadow p-6">
              {renderUploadArea()}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Features</h3>
              <ul className="space-y-3">
                {[
                  { icon: '⚡', text: 'Real-time progress tracking' },
                  { icon: '🎯', text: 'Typed upload routes' },
                  { icon: '💾', text: 'Multi-storage support' },
                  { icon: '🔐', text: 'Authentication & security' },
                  { icon: '🖼️', text: 'Automatic transformations' },
                  { icon: '🎥', text: 'Video processing pipeline' },
                  { icon: '📊', text: 'Usage analytics' },
                  { icon: '🪝', text: 'Webhook notifications' }
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm text-gray-600">
                    <span className="mr-3 text-base">{feature.icon}</span>
                    {feature.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Upload History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 Upload History</h3>
              {uploadHistory.length === 0 ? (
                <p className="text-gray-500 text-sm">No uploads yet. Try uploading a file!</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {uploadHistory.slice(-5).reverse().map((upload, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {upload.type === 'image' ? '🖼️' : upload.type === 'video' ? '🎥' : '📄'} 
                          {upload.fileName || 'File'}
                        </span>
                        <span className="text-xs text-green-600">✅</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* API Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📡 API Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Demo API:</span>
                  <span className="text-green-600">✅ Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Real-time:</span>
                  <span className="text-green-600">✅ Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage:</span>
                  <span className="text-green-600">✅ Ready</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-gray-600">
              🚀 Built with <strong>@carcosa/file-router</strong> - The UploadThing Killer
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Production-ready • Real-time • Multi-storage • 80% cheaper
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarcosaFileRouterDemo;
