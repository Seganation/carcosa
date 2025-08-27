"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Database,
  FileText,
  Calendar,
  Settings
} from "lucide-react";
import { projectsAPI } from "@/lib/projects-api";
import { apiBase, withAuth } from "@/lib/api";
import { toast } from "react-hot-toast";

interface Tenant {
  id: string;
  slug: string;
  metadata?: any;
  createdAt: string;
  _count?: {
    files: number;
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

interface CreateTenantData {
  slug: string;
  metadata?: any;
}

export default function TenantsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<CreateTenantData>({
    slug: "",
    metadata: {}
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadTenants();
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

  const loadTenants = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${apiBase()}/api/v1/projects/${selectedProject}/tenants`, {
        headers: withAuth(),
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      } else {
        toast.error("Failed to load tenants");
      }
    } catch (error) {
      console.error("Failed to load tenants:", error);
      toast.error("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  const createTenant = async () => {
    if (!selectedProject || !formData.slug.trim()) {
      toast.error("Please provide a tenant slug");
      return;
    }

    try {
      const response = await fetch(`${apiBase()}/api/v1/projects/${selectedProject}/tenants`, {
        method: "POST",
        headers: { ...withAuth(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Tenant created successfully");
        setCreateDialogOpen(false);
        setFormData({ slug: "", metadata: {} });
        loadTenants();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create tenant");
      }
    } catch (error) {
      console.error("Failed to create tenant:", error);
      toast.error("Failed to create tenant");
    }
  };

  const updateTenant = async () => {
    if (!selectedProject || !editingTenant || !formData.slug.trim()) {
      toast.error("Please provide a tenant slug");
      return;
    }

    try {
      const response = await fetch(`${apiBase()}/api/v1/projects/${selectedProject}/tenants/${editingTenant.id}`, {
        method: "PUT",
        headers: { ...withAuth(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Tenant updated successfully");
        setEditDialogOpen(false);
        setEditingTenant(null);
        setFormData({ slug: "", metadata: {} });
        loadTenants();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update tenant");
      }
    } catch (error) {
      console.error("Failed to update tenant:", error);
      toast.error("Failed to update tenant");
    }
  };

  const deleteTenant = async (tenant: Tenant) => {
    if (!confirm(`Are you sure you want to delete tenant "${tenant.slug}"? This will be deleted.`)) {
      return;
    }

    try {
      const response = await fetch(`${apiBase()}/api/v1/projects/${selectedProject}/tenants/${tenant.id}`, {
        method: "DELETE",
        headers: withAuth(),
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Tenant deleted successfully");
        loadTenants();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete tenant");
      }
    } catch (error) {
      console.error("Failed to delete tenant:", error);
      toast.error("Failed to delete tenant");
    }
  };

  const openEditDialog = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      slug: tenant.slug,
      metadata: tenant.metadata || {}
    });
    setEditDialogOpen(true);
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h2 className="text-3xl font-bold tracking-tight">Tenants</h2>
        <p className="text-muted-foreground mt-2">
          No projects found. Create a project to start managing tenants.
        </p>
      </div>
    );
  }

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tenants</h2>
          <p className="text-muted-foreground">
            Manage multi-tenancy across your projects.
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
          
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Button>
        </div>
      </div>

      {selectedProjectData && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {tenant.slug}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(tenant)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteTenant(tenant)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Files</span>
                  <span className="font-medium">{tenant._count?.files || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {tenant.metadata && Object.keys(tenant.metadata).length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-xs">Metadata:</span>
                    <div className="text-xs mt-1">
                      {Object.entries(tenant.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center p-8">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            {searchTerm ? "No tenants found matching your search." : "No tenants created yet."}
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => setCreateDialogOpen(true)} 
              className="mt-4 bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Tenant
            </Button>
          )}
        </div>
      )}

      {/* Create Tenant Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tenant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="slug">Tenant Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="customer-name"
                pattern="^[a-z0-9-]+$"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={createTenant}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Create Tenant
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-slug">Tenant Slug</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="customer-name"
                pattern="^[a-z0-9-]+$"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={updateTenant}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Update Tenant
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
