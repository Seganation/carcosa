"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  Upload, 
  Image, 
  HardDrive, 
  TrendingUp, 
  Calendar,
  Download,
  Activity
} from "lucide-react";
import { projectsAPI } from "@/lib/projects-api";
import { apiBase, withAuth } from "@/lib/api";
import { toast } from "react-hot-toast";

interface UsageData {
  day: string;
  uploads: number;
  transforms: number;
  bandwidthBytes: number;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  bucket?: {
    name: string;
    provider: string;
  };
}

export default function UsagePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadUsageData();
    }
  }, [selectedProject, timeRange]);

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

  const loadUsageData = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${apiBase()}/api/v1/projects/${selectedProject}/usage?range=${timeRange}`, {
        headers: withAuth(),
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsageData(data.usage || []);
      } else {
        toast.error("Failed to load usage data");
      }
    } catch (error) {
      console.error("Failed to load usage data:", error);
      toast.error("Failed to load usage data");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTotalStats = () => {
    return usageData.reduce(
      (acc, day) => ({
        uploads: acc.uploads + day.uploads,
        transforms: acc.transforms + day.transforms,
        bandwidth: acc.bandwidth + day.bandwidthBytes,
      }),
      { uploads: 0, transforms: 0, bandwidth: 0 }
    );
  };

  const totalStats = getTotalStats();
  const selectedProjectData = projects.find(p => p.id === selectedProject);

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
        <h2 className="text-3xl font-bold tracking-tight">Usage Analytics</h2>
        <p className="text-muted-foreground mt-2">
          No projects found. Create a project to start tracking usage.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Usage Analytics</h2>
          <p className="text-muted-foreground">
            Monitor your storage usage, transforms, and bandwidth consumption.
          </p>
        </div>
        <div className="flex items-center gap-4">
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
          
          <Select value={timeRange} onValueChange={(value: "7d" | "30d" | "90d") => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedProjectData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.uploads.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Files uploaded in selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transforms</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.transforms.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Images processed in selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bandwidth Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(totalStats.bandwidth)}</div>
              <p className="text-xs text-muted-foreground">
                Data transferred in selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Project</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{selectedProjectData.name}</div>
              <p className="text-xs text-muted-foreground">
                {selectedProjectData.bucket?.provider.toUpperCase()} • {selectedProjectData.bucket?.name}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usageData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No usage data available for the selected period.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {usageData.map((day) => (
                <div key={day.day} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {new Date(day.day).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{day.uploads}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{day.transforms}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">{formatBytes(day.bandwidthBytes)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
