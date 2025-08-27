"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertTriangle,
  Shield,
  Database,
  Zap,
  Globe,
  Key,
  Trash2
} from "lucide-react";
import { projectsAPI } from "@/lib/projects-api";
import { toast } from "react-hot-toast";

interface Project {
  id: string;
  name: string;
  slug: string;
  bucket?: {
    name: string;
    provider: string;
    status: string;
  };
}

interface RateLimitConfig {
  uploadsPerMinute: number;
  transformsPerMinute: number;
  bandwidthPerMonthMiB?: number;
}

interface ProjectSettings {
  enableMultiTenancy: boolean;
  enableVersioning: boolean;
  defaultVersion: string;
  enableAuditLogs: boolean;
  enableUsageTracking: boolean;
  enableTransformCaching: boolean;
  maxFileSizeMiB: number;
  allowedFileTypes: string[];
}

export default function SettingsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rateLimits, setRateLimits] = useState<RateLimitConfig>({
    uploadsPerMinute: 120,
    transformsPerMinute: 360,
    bandwidthPerMonthMiB: undefined,
  });
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    enableMultiTenancy: false,
    enableVersioning: false,
    defaultVersion: "v1",
    enableAuditLogs: true,
    enableUsageTracking: true,
    enableTransformCaching: true,
    maxFileSizeMiB: 100,
    allowedFileTypes: ["image/*", "application/pdf"],
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectSettings();
      loadRateLimits();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const { projects: data } = await projectsAPI.list();
      setProjects(data);
      if (data.length > 0 && data[0]) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const loadProjectSettings = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await fetch(`/api/v1/projects/${selectedProject}/settings`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjectSettings(data.settings || projectSettings);
      }
    } catch (error) {
      console.error("Failed to load project settings:", error);
    }
  };

  const loadRateLimits = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await fetch(`/api/v1/projects/${selectedProject}/rate_limit`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setRateLimits(data.config || rateLimits);
      }
    } catch (error) {
      console.error("Failed to load rate limits:", error);
    }
  };

  const saveRateLimits = async () => {
    if (!selectedProject) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/v1/projects/${selectedProject}/rate_limit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(rateLimits),
      });

      if (response.ok) {
        toast.success("Rate limits updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update rate limits");
      }
    } catch (error) {
      console.error("Failed to update rate limits:", error);
      toast.error("Failed to update rate limits");
    } finally {
      setSaving(false);
    }
  };

  const saveProjectSettings = async () => {
    if (!selectedProject) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/v1/projects/${selectedProject}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(projectSettings),
      });

      if (response.ok) {
        toast.success("Project settings updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update project settings");
      }
    } catch (error) {
      console.error("Failed to update project settings:", error);
      toast.error("Failed to update project settings");
    } finally {
      setSaving(false);
    }
  };

  const regenerateApiKey = async () => {
    if (!selectedProject) return;
    
    if (!confirm("Are you sure you want to regenerate the API key? This will invalidate the current key.")) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/projects/${selectedProject}/regenerate-key`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("API key regenerated successfully");
      } else {
        toast.error("Failed to regenerate API key");
      }
    } catch (error) {
      console.error("Failed to regenerate API key:", error);
      toast.error("Failed to regenerate API key");
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Project Settings</h2>
        <p className="text-muted-foreground mt-2">
          No projects found. Create a project to manage settings.
        </p>
      </div>
    );
  }

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Project Settings</h2>
          <p className="text-muted-foreground">
            Configure settings and preferences for your projects.
          </p>
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <span>{project.name}</span>
                  {project.bucket && (
                    <Badge variant="outline" className="text-xs">
                      {project.bucket.provider.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProjectData && (
        <>
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Project Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Project Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedProjectData.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Project Slug</Label>
                  <p className="text-sm text-muted-foreground">{selectedProjectData.slug}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Storage Provider</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedProjectData.bucket?.provider.toUpperCase() || "Not configured"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Bucket Status</Label>
                  <Badge 
                    variant={selectedProjectData.bucket?.status === "connected" ? "default" : "secondary"}
                    className={selectedProjectData.bucket?.status === "connected" ? "bg-green-500/10 text-green-500" : ""}
                  >
                    {selectedProjectData.bucket?.status || "Unknown"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Rate Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="uploadsPerMinute">Uploads per Minute</Label>
                  <Input
                    id="uploadsPerMinute"
                    type="number"
                    value={rateLimits.uploadsPerMinute}
                    onChange={(e) => setRateLimits(prev => ({ ...prev, uploadsPerMinute: parseInt(e.target.value) || 0 }))}
                    min="1"
                    max="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="transformsPerMinute">Transforms per Minute</Label>
                  <Input
                    id="transformsPerMinute"
                    type="number"
                    value={rateLimits.transformsPerMinute}
                    onChange={(e) => setRateLimits(prev => ({ ...prev, transformsPerMinute: parseInt(e.target.value) || 0 }))}
                    min="1"
                    max="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="bandwidthPerMonth">Bandwidth per Month (MiB)</Label>
                  <Input
                    id="bandwidthPerMonth"
                    type="number"
                    value={rateLimits.bandwidthPerMonthMiB || ""}
                    onChange={(e) => setRateLimits(prev => ({ ...prev, bandwidthPerMonthMiB: e.target.value ? parseInt(e.target.value) : undefined }))}
                    min="1"
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              <Button onClick={saveRateLimits} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Rate Limits
              </Button>
            </CardContent>
          </Card>

          {/* Project Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Project Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable Multi-Tenancy</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow multiple tenants to use this project with isolated file storage.
                    </p>
                  </div>
                  <Switch
                    checked={projectSettings.enableMultiTenancy}
                    onCheckedChange={(checked) => setProjectSettings(prev => ({ ...prev, enableMultiTenancy: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable Versioning</Label>
                    <p className="text-sm text-muted-foreground">
                      Support multiple versions of files and transforms.
                    </p>
                  </div>
                  <Switch
                    checked={projectSettings.enableVersioning}
                    onCheckedChange={(checked) => setProjectSettings(prev => ({ ...prev, enableVersioning: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable Audit Logs</Label>
                    <p className="text-sm text-muted-foreground">
                      Track all operations and actions for compliance and debugging.
                    </p>
                  </div>
                  <Switch
                    checked={projectSettings.enableAuditLogs}
                    onCheckedChange={(checked) => setProjectSettings(prev => ({ ...prev, enableAuditLogs: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable Usage Tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Monitor storage usage, transforms, and bandwidth consumption.
                    </p>
                  </div>
                  <Switch
                    checked={projectSettings.enableUsageTracking}
                    onCheckedChange={(checked) => setProjectSettings(prev => ({ ...prev, enableUsageTracking: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable Transform Caching</Label>
                    <p className="text-sm text-muted-foreground">
                      Cache transformed images to improve performance and reduce costs.
                    </p>
                  </div>
                  <Switch
                    checked={projectSettings.enableTransformCaching}
                    onCheckedChange={(checked) => setProjectSettings(prev => ({ ...prev, enableTransformCaching: checked }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="maxFileSize">Max File Size (MiB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={projectSettings.maxFileSizeMiB}
                    onChange={(e) => setProjectSettings(prev => ({ ...prev, maxFileSizeMiB: parseInt(e.target.value) || 0 }))}
                    min="1"
                    max="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="defaultVersion">Default Version</Label>
                  <Input
                    id="defaultVersion"
                    value={projectSettings.defaultVersion}
                    onChange={(e) => setProjectSettings(prev => ({ ...prev, defaultVersion: e.target.value }))}
                    placeholder="v1"
                  />
                </div>
              </div>

              <Button onClick={saveProjectSettings} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Project Settings
              </Button>
            </CardContent>
          </Card>

          {/* Security & API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-sm font-medium">API Key</Label>
                  <p className="text-sm text-muted-foreground">
                    Regenerate your project's API key if compromised.
                  </p>
                </div>
                <Button onClick={regenerateApiKey} variant="outline" className="text-red-500 hover:text-red-600">
                  <Key className="h-4 w-4 mr-2" />
                  Regenerate Key
                </Button>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Security Notice</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Regenerating your API key will immediately invalidate the current key. 
                      Update all applications and SDKs using the old key to avoid service disruption.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
