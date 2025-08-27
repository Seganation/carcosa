"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Settings, Trash2, AlertTriangle, Key } from "lucide-react";
import ApiKeysManager from "./api-keys-manager";

interface AppSettingsProps {
  appId: string;
}

// Mock data - replace with actual API call
const mockAppData = {
  "1": {
    id: "1",
    name: "My Blog",
    bucketName: "my-blog-bucket",
    provider: "r2" as const,
  },
  "2": {
    id: "2",
    name: "E-commerce Site",
    bucketName: "ecom-assets",
    provider: "s3" as const,
  },
};

export function AppSettings({ appId }: AppSettingsProps) {
  const app = mockAppData[appId as keyof typeof mockAppData];
  const [appName, setAppName] = useState(app?.name || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "api-keys">("general");

  if (!app) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">App not found</p>
      </div>
    );
  }

  const handleSaveSettings = () => {
    // TODO: Implement settings save logic
    console.log("Saving settings:", { appName });
  };

  const handleDeleteApp = () => {
    // TODO: Implement app deletion logic
    console.log("Deleting app:", appId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "general"
              ? "bg-white border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab("api-keys")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "api-keys"
              ? "bg-white border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Key className="inline h-4 w-4 mr-2" />
          API Keys
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "general" && (
        <>
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appName">Application Name</Label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Enter app name"
                />
              </div>

              <div className="space-y-2">
                <Label>Connected Bucket</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{app.bucketName}</p>
                  <p className="text-sm text-muted-foreground">
                    Provider: {app.provider.toUpperCase()}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSaveSettings}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* App Information */}
          <Card>
            <CardHeader>
              <CardTitle>Application Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">App ID</span>
                  <code className="bg-muted px-2 py-1 rounded">{app.id}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage Provider</span>
                  <span className="font-medium">{app.provider.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bucket Name</span>
                  <span className="font-medium">{app.bucketName}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Delete Application</h4>
                <p className="text-sm text-muted-foreground">
                  Once you delete this application, there is no going back. This
                  will permanently delete all API keys and configuration. Your
                  bucket and files will remain untouched.
                </p>
              </div>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Application
                </Button>
              ) : (
                <div className="space-y-3 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    Are you sure you want to delete this application?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteApp}
                    >
                      Yes, Delete Forever
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "api-keys" && (
        <ApiKeysManager projectId={appId} />
      )}
    </div>
  );
}
