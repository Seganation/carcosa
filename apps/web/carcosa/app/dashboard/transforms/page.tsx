"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Image, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  FileText,
  HardDrive
} from "lucide-react";
import { projectsAPI } from "@/lib/projects-api";
import { apiBase, withAuth } from "@/lib/api";
import { toast } from "react-hot-toast";

interface Transform {
  id: string;
  originalPath: string;
  transformPath: string;
  transformOptions: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    fit?: string;
    crop?: string;
  };
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  processingTime?: number;
  createdAt: string;
  completedAt?: string;
  file: {
    id: string;
    filename: string;
    size: number;
    mimeType: string;
  };
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

const STATUS_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-500",
  processing: "bg-blue-500/10 text-blue-500",
  completed: "bg-green-500/10 text-green-500",
  failed: "bg-red-500/10 text-red-500",
};

const STATUS_ICONS = {
  pending: Clock,
  processing: RefreshCw,
  completed: CheckCircle,
  failed: XCircle,
};

export default function TransformsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [transforms, setTransforms] = useState<Transform[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadTransforms();
    }
  }, [selectedProject, page]);

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

  const loadTransforms = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${apiBase()}/api/v1/projects/${selectedProject}/transforms?page=${page}&limit=50`, 
        { 
          headers: withAuth(),
          credentials: "include" 
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setTransforms(data.transforms || []);
        } else {
          setTransforms(prev => [...prev, ...(data.transforms || [])]);
        }
        setHasMore(data.hasMore || false);
      } else {
        toast.error("Failed to load transforms");
      }
    } catch (error) {
      console.error("Failed to load transforms:", error);
      toast.error("Failed to load transforms");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const retryTransform = async (transformId: string) => {
    try {
      const response = await fetch(
        `/api/v1/projects/${selectedProject}/transforms/${transformId}/retry`,
        { 
          method: "POST",
          credentials: "include" 
        }
      );

      if (response.ok) {
        toast.success("Transform retry initiated");
        loadTransforms();
      } else {
        toast.error("Failed to retry transform");
      }
    } catch (error) {
      console.error("Failed to retry transform:", error);
      toast.error("Failed to retry transform");
    }
  };

  const deleteTransform = async (transformId: string) => {
    if (!confirm("Are you sure you want to delete this transform?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/v1/projects/${selectedProject}/transforms/${transformId}`,
        { 
          method: "DELETE",
          credentials: "include" 
        }
      );

      if (response.ok) {
        toast.success("Transform deleted");
        loadTransforms();
      } else {
        toast.error("Failed to delete transform");
      }
    } catch (error) {
      console.error("Failed to delete transform:", error);
      toast.error("Failed to delete transform");
    }
  };

  const filteredTransforms = transforms.filter(transform => {
    const matchesSearch = searchTerm === "" || 
      transform.originalPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transform.file.filename.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || transform.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTransformOptions = (options: any): string => {
    const parts = [];
    if (options.width) parts.push(`w:${options.width}`);
    if (options.height) parts.push(`h:${options.height}`);
    if (options.quality) parts.push(`q:${options.quality}`);
    if (options.format) parts.push(`f:${options.format}`);
    if (options.fit) parts.push(`fit:${options.fit}`);
    if (options.crop) parts.push(`crop:${options.crop}`);
    return parts.join(", ") || "default";
  };

  const getStats = () => {
    const stats = {
      total: transforms.length,
      pending: transforms.filter(t => t.status === "pending").length,
      processing: transforms.filter(t => t.status === "processing").length,
      completed: transforms.filter(t => t.status === "completed").length,
      failed: transforms.filter(t => t.status === "failed").length,
    };
    return stats;
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
        <h2 className="text-3xl font-bold tracking-tight">Image Transforms</h2>
        <p className="text-muted-foreground mt-2">
          No projects found. Create a project to start processing images.
        </p>
      </div>
    );
  }

  const stats = getStats();
  const uniqueStatuses = [...new Set(transforms.map(t => t.status))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Image Transforms</h2>
          <p className="text-muted-foreground">
            Monitor and manage image transformations across your projects.
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transforms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {uniqueStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Transform Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransforms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transforms found for the selected criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransforms.map((transform) => (
                <div key={transform.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-shrink-0 mt-1">
                    <Badge className={STATUS_COLORS[transform.status]}>
                      {getStatusIcon(transform.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{transform.file.filename}</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{formatTransformOptions(transform.transformOptions)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(transform.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {transform.originalPath}
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatBytes(transform.file.size)}
                      </div>
                      {transform.processingTime && (
                        <div className="flex items-center gap-1">
                          <span>Processed in {transform.processingTime}ms</span>
                        </div>
                      )}
                    </div>
                    
                    {transform.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <span className="font-medium">Error:</span> {transform.error}
                      </div>
                    )}
                    
                    {transform.status === "completed" && transform.transformPath && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <span className="font-medium">Output:</span> {transform.transformPath}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {transform.status === "failed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryTransform(transform.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTransform(transform.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <div className="text-center pt-4">
                  <Button onClick={loadMore} variant="outline" disabled={loading}>
                    {loading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
