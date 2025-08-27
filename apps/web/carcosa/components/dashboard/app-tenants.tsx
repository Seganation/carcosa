"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Users, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { apiBase, withAuth } from "@/lib/api";

interface Tenant {
  id: string;
  slug: string;
  metadata?: {
    name?: string;
    description?: string;
  };
  createdAt: string;
}

interface AppTenantsProps {
  projectId: string;
  projectSlug: string;
}

export function AppTenants({ projectId, projectSlug }: AppTenantsProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTenants();
  }, [projectId]);

  const loadTenants = async () => {
    try {
      const response = await fetch(`${apiBase()}/api/v1/projects/${projectId}/tenants`, {
        headers: withAuth(),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      }
    } catch (error) {
      console.error("Failed to load tenants:", error);
      toast.error("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slug.trim()) {
      toast.error("Tenant slug is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBase()}/api/v1/projects/${projectId}/tenants`, {
        method: "POST",
        headers: { ...withAuth(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slug: formData.slug.trim(),
          metadata: {
            name: formData.name.trim() || undefined,
            description: formData.description.trim() || undefined,
          },
        }),
      });

      if (response.ok) {
        toast.success("Tenant created successfully");
        setCreateDialogOpen(false);
        resetForm();
        loadTenants();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create tenant");
      }
    } catch (error) {
      console.error("Failed to create tenant:", error);
      toast.error("Failed to create tenant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${apiBase()}/api/v1/projects/${projectId}/tenants/${editingTenant.id}`,
        {
          method: "PUT",
          headers: { ...withAuth(), "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            metadata: {
              name: formData.name.trim() || undefined,
              description: formData.description.trim() || undefined,
            },
          }),
        }
      );

      if (response.ok) {
        toast.success("Tenant updated successfully");
        setEditDialogOpen(false);
        resetForm();
        loadTenants();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update tenant");
      }
    } catch (error) {
      console.error("Failed to update tenant:", error);
      toast.error("Failed to update tenant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(
        `${apiBase()}/api/v1/projects/${projectId}/tenants/${tenantId}`,
        {
          method: "DELETE",
          headers: withAuth(),
          credentials: "include",
        }
      );

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
      name: tenant.metadata?.name || "",
      description: tenant.metadata?.description || "",
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ slug: "", name: "", description: "" });
    setEditingTenant(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenants</h2>
          <p className="text-muted-foreground">
            Manage tenants for your multi-tenant project
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      {tenants.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tenants yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first tenant to start organizing your data
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Tenant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tenant.metadata?.name || tenant.slug}</CardTitle>
                  <Badge variant="secondary">{tenant.slug}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {tenant.metadata?.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {tenant.metadata.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>Created {new Date(tenant.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(tenant)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTenant(tenant.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Tenant Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tenant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTenant} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantSlug">Tenant Slug</Label>
              <Input
                id="tenantSlug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="tenant-1"
                pattern="^[a-z0-9-]+$"
                required
              />
              <p className="text-xs text-muted-foreground">
                Used in API endpoints. Only lowercase letters, numbers, and hyphens.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantName">Display Name (Optional)</Label>
              <Input
                id="tenantName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="First Tenant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantDescription">Description (Optional)</Label>
              <Textarea
                id="tenantDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of this tenant"
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Tenant"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditTenant} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTenantSlug">Tenant Slug</Label>
              <Input
                id="editTenantSlug"
                value={formData.slug}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Tenant slug cannot be changed after creation.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTenantName">Display Name</Label>
              <Input
                id="editTenantName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tenant Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTenantDescription">Description</Label>
              <Textarea
                id="editTenantDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of this tenant"
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Tenant"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
