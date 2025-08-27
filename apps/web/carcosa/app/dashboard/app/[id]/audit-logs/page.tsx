"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { CardDescription } from "../../../../../components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { 
  Activity, 
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  User,
  Shield,
  Database
} from "lucide-react";


interface AuditLog {
  id: string;
  action: string;
  resource: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  details?: string;
  projectId: string;
}

export default function AppAuditLogsPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedResource, setSelectedResource] = useState<string>("all");

  useEffect(() => {
    const loadProjectAndLogs = async () => {
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
        
        // TODO: Load audit logs for this project
        // For now, using mock data
        const mockLogs: AuditLog[] = [
          {
            id: "1",
            action: "file.upload",
            resource: "user-avatar.jpg",
            userId: "user123",
            userName: "John Doe",
            userEmail: "john@example.com",
            timestamp: new Date(Date.now() - 300000).toISOString(),
            ipAddress: "192.168.1.100",
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            status: "success",
            details: "File uploaded successfully",
            projectId
          },
          {
            id: "2",
            action: "api.key.create",
            resource: "API Key",
            userId: "user123",
            userName: "John Doe",
            userEmail: "john@example.com",
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            ipAddress: "192.168.1.100",
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            status: "success",
            details: "New API key generated",
            projectId
          },
          {
            id: "3",
            action: "tenant.create",
            resource: "Tenant: acme-corp",
            userId: "user123",
            userName: "John Doe",
            userEmail: "john@example.com",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            ipAddress: "192.168.1.100",
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            status: "success",
            details: "New tenant created",
            projectId
          },
          {
            id: "4",
            action: "file.delete",
            resource: "old-document.pdf",
            userId: "user456",
            userName: "Jane Smith",
            userEmail: "jane@example.com",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            ipAddress: "192.168.1.101",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            status: "success",
            details: "File deleted",
            projectId
          },
          {
            id: "5",
            action: "api.request",
            resource: "GET /files",
            userId: "user789",
            userName: "Bob Wilson",
            userEmail: "bob@example.com",
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            ipAddress: "192.168.1.102",
            userAgent: "curl/7.68.0",
            status: "failure",
            details: "Rate limit exceeded",
            projectId
          }
        ];
        
        setAuditLogs(mockLogs);
        setFilteredLogs(mockLogs);
      } catch (error) {
        console.error("Failed to load project or audit logs:", error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProjectAndLogs();
    }
  }, [projectId]);

  useEffect(() => {
    let filtered = auditLogs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by action
    if (selectedAction !== "all") {
      filtered = filtered.filter(log => log.action === selectedAction);
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(log => log.status === selectedStatus);
    }

    // Filter by resource
    if (selectedResource !== "all") {
      filtered = filtered.filter(log => log.resource.toLowerCase().includes(selectedResource.toLowerCase()));
    }

    setFilteredLogs(filtered);
  }, [auditLogs, searchTerm, selectedAction, selectedStatus, selectedResource]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failure':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Info className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success':
        return "default";
      case 'failure':
        return "destructive";
      case 'warning':
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('file')) return <Database className="h-4 w-4" />;
    if (action.includes('api')) return <Activity className="h-4 w-4" />;
    if (action.includes('tenant')) return <User className="h-4 w-4" />;
    if (action.includes('key')) return <Shield className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all activities and changes for {project.name}
          </p>
        </div>
        
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              All time events
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter(log => log.status === 'success').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful actions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failures</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter(log => log.status === 'failure').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Failed actions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(auditLogs.map(log => log.userId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique users
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
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
            </div>
            
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Actions</option>
              <option value="file.upload">File Upload</option>
              <option value="file.delete">File Delete</option>
              <option value="api.key.create">API Key Create</option>
              <option value="tenant.create">Tenant Create</option>
              <option value="api.request">API Request</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="warning">Warning</option>
            </select>
            
            <select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Resources</option>
              <option value="file">Files</option>
              <option value="api">API</option>
              <option value="tenant">Tenants</option>
              <option value="key">Keys</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      {filteredLogs.length > 0 ? (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getActionIcon(log.action)}
                      <h3 className="text-lg font-semibold">{log.action}</h3>
                      <Badge variant={getStatusBadgeVariant(log.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(log.status)}
                          {log.status}
                        </div>
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-1">Resource: {log.resource}</p>
                      {log.details && (
                        <p className="text-muted-foreground text-sm">{log.details}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">User:</span> {log.userName}
                      </div>
                      <div>
                        <span className="font-medium">IP:</span> {log.ipAddress}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {new Date(log.timestamp).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Agent:</span> {log.userAgent.substring(0, 30)}...
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || selectedAction !== "all" || selectedStatus !== "all" || selectedResource !== "all"
                ? "No Logs Found" 
                : "No Audit Logs Yet"
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedAction !== "all" || selectedStatus !== "all" || selectedResource !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Activity will appear here as users interact with the system"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}