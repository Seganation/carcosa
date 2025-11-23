"use client";

import { use } from "react";
import { AppFiles } from "../../../../../components/dashboard/app-files";
import { CarcosaUploader } from "../../../../../components/dashboard/carcosa-uploader";

export default function AppFilesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="space-y-6">
      {/* 🚀 NEW: Advanced Carcosa File Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CarcosaUploader 
          uploadType="images"
          maxFiles={10}
          onUploadComplete={(files) => {
            console.log('🎉 Images uploaded:', files);
          }}
        />
        <CarcosaUploader 
          uploadType="documents"
          maxFiles={5}
          onUploadComplete={(files) => {
            console.log('📁 Documents uploaded:', files);
          }}
        />
      </div>
      
      <CarcosaUploader 
        uploadType="videos"
        maxFiles={2}
        onUploadComplete={(files) => {
          console.log('🎬 Videos uploaded:', files);
        }}
      />
      
      {/* Existing Files View */}
      <AppFiles appId={id} />
    </div>
  );
}
