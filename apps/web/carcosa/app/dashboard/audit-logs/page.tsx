"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Eye,
  Upload,
  Image,
  Key,
  Trash2,
  Settings,
  User,
  Calendar,
  Clock
} from "lucide-react";
import { projectsAPI } from "@/lib/projects-api";
import { apiBase, withAuth } from "@/lib/api";
import { toast } from "react-hot-toast";

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

const ACTION_ICONS: Record<string, any> = {
  upload: Upload,
  transform: Image,
  delete: Trash2,
  key_rotate: Key,
  key_revoke: Key,
  settings_update: Settings,
  user_login: User,
  user_logout: User,
};

const ACTION_COLORS: Record<string, string> = {
  upload: "bg-blue-500/10 text-blue-500",
  transform: "bg-green-500/10 text-green-500",
  delete: "bg-red-500/10 text-red-500",
  key_rotate: "bg-yellow-500/10 text-yellow-500",
  key_revoke: "bg-red-500/10 text-red-500",
  settings_update: "bg-purple-500/10 text-purple-500",
  user_login: "bg-green-500/10 text-green-500",
  user_logout: "bg-gray-500/10 text-gray-500",
};

export default function AuditLogsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadAuditLogs();
    }
  }, [selectedProject, page]);

  const loadProjects = async () => {
    try {
      const { projects: data } = await projectsAPI.list();
      setProjects(data);
      if (data && data.length > 0 && data[0]) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${apiBase()}/api/v1/projects/${selectedProject}/audit-logs?page=${page}&limit=50`, 
        { 
          headers: withAuth(),
          credentials: "include" 
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setAuditLogs(data.logs || []);
        } else {
          setAuditLogs(prev => [...prev, ...(data.logs || [])]);
        }
        setHasMore(data.hasMore || false);
      } else {
        toast.error("Failed to load audit logs");
      }
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = selectedAction === "all" || log.action === selectedAction;
    
    return matchesSearch && matchesAction;
  });

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action] || Shield;
    return <Icon className="h-4 w-4" />;
  };

  const formatDetails = (details: any): string => {
    if (!details) return "";
    if (typeof details === "string") return details;
    if (typeof details === "object") {
      return Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
    }
    return String(details);
  };

  const exportLogs = () => {
    const csvContent = [
      ["Date", "Action", "Resource", "User", "IP Address", "Details"],
      ...filteredLogs.map(log => [
        new Date(log.createdAt).toISOString(),
        log.action,
        log.resource,
        log.user.name,
        log.ipAddress || "",
        formatDetails(log.details)
      ])
    ].map(row => row.map(field => `"${field}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${selectedProject}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
        <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground mt-2">
          No projects found. Create a project to start tracking activity.
        </p>
      </div>
    );
  }

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Monitor all activities and changes across your projects.
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
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedAction} onValueChange={setSelectedAction}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {action.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found for the selected criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-shrink-0 mt-1">
                    <Badge className={ACTION_COLORS[log.action] || "bg-gray-500/10 text-gray-500"}>
                      {getActionIcon(log.action)}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.action.replace(/_/g, " ")}</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{log.resource}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.user.name} ({log.user.email})
                      </div>
                      {log.ipAddress && (
                        <div className="flex items-center gap-1">
                          <span>IP: {log.ipAddress}</span>
                        </div>
                      )}
                    </div>
                    
                    {log.details && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <span className="font-medium">Details:</span> {formatDetails(log.details)}
                      </div>
                    )}
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
