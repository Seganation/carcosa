"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { CardDescription } from "../../../../../components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { 
  BarChart3, 
  Plus, 
  Search, 
  Filter, 
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Settings
} from "lucide-react";


interface Transform {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  type: 'image' | 'document' | 'video' | 'audio' | 'custom';
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

export default function AppTransformsPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [transforms, setTransforms] = useState<Transform[]>([]);
  const [filteredTransforms, setFilteredTransforms] = useState<Transform[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    const loadProjectAndTransforms = async () => {
      try {
        setLoading(true);
        
        // Load project details using JWT token
        const token = localStorage.getItem('carcosa_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:4000/api/v1/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch project: ${response.statusText}`);
        }

        const projectData = await response.json();
        setProject(projectData);
        
        // TODO: Load transforms for this project
        // For now, using mock data
        const mockTransforms: Transform[] = [
          {
            id: "1",
            name: "Image Resize",
            description: "Resize uploaded images to standard dimensions",
            status: "completed",
            type: "image",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
            projectId
          },
          {
            id: "2",
            name: "PDF to Text",
            description: "Extract text content from PDF documents",
            status: "running",
            type: "document",
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            updatedAt: new Date().toISOString(),
            projectId
          },
          {
            id: "3",
            name: "Video Compression",
            description: "Compress video files for web delivery",
            status: "pending",
            type: "video",
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            projectId
          }
        ];
        
        setTransforms(mockTransforms);
        setFilteredTransforms(mockTransforms);
      } catch (error) {
        console.error("Failed to load project or transforms:", error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProjectAndTransforms();
    }
  }, [projectId]);

  useEffect(() => {
    let filtered = transforms;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(transform => 
        transform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transform.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(transform => transform.status === selectedStatus);
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(transform => transform.type === selectedType);
    }

    setFilteredTransforms(filtered);
  }, [transforms, searchTerm, selectedStatus, selectedType]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return "default";
      case 'running':
        return "secondary";
      case 'pending':
        return "outline";
      case 'failed':
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <FileText className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <FileText className="h-4 w-4" />;
      case 'audio':
        return <FileText className="h-4 w-4" />;
      case 'custom':
        return <Settings className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transforms...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground">
            The requested project could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transforms</h1>
          <p className="text-muted-foreground">
            Manage file processing and transformations for {project.name}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Transform
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transforms</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transforms.length}</div>
            <p className="text-xs text-muted-foreground">
              Active transforms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transforms.filter(t => t.status === 'running').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transforms.filter(t => t.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transforms.filter(t => t.status === 'failed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Processing errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search transforms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
            </div>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Types</option>
              <option value="image">Image</option>
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transforms List */}
      {filteredTransforms.length > 0 ? (
        <div className="space-y-4">
          {filteredTransforms.map((transform) => (
            <Card key={transform.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(transform.type)}
                      <h3 className="text-lg font-semibold">{transform.name}</h3>
                      <Badge variant={getStatusBadgeVariant(transform.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(transform.status)}
                          {transform.status}
                        </div>
                      </Badge>
                    </div>
                    
                    {transform.description && (
                      <p className="text-muted-foreground mb-3">
                        {transform.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Created {new Date(transform.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Updated {new Date(transform.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    {transform.status === 'pending' && (
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Run Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || selectedStatus !== "all" || selectedType !== "all" 
                ? "No Transforms Found" 
                : "No Transforms Yet"
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedStatus !== "all" || selectedType !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first transform"
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Transform
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}