"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Users, Loader2 } from "lucide-react";
import { CreateTenantDialog } from "./create-tenant-dialog";
import { EditTenantDialog } from "./edit-tenant-dialog";
import { DeleteTenantDialog } from "./delete-tenant-dialog";
import { apiBase, withAuth } from "@/lib/api";
import { toast } from "react-hot-toast";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenants</h2>
          <p className="text-sm text-muted-foreground">
            Manage tenants for your multi-tenant project
          </p>
        </div>
        <CreateTenantDialog projectId={projectId} onSuccess={loadTenants} />
      </div>

      {/* Empty State */}
      {tenants.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No tenants yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Create your first tenant to start organizing your multi-tenant data.
              Each tenant provides isolated storage and access control.
            </p>
            <CreateTenantDialog
              projectId={projectId}
              onSuccess={loadTenants}
            />
          </CardContent>
        </Card>
      ) : (
        /* Tenants Grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg truncate">
                    {tenant.metadata?.name || tenant.slug}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {tenant.slug}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {tenant.metadata?.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tenant.metadata.description}
                  </p>
                )}

                <div className="text-xs text-muted-foreground">
                  Created {new Date(tenant.createdAt).toLocaleDateString()}
                </div>

                <div className="flex gap-2">
                  <EditTenantDialog
                    projectId={projectId}
                    tenant={tenant}
                    onSuccess={loadTenants}
                  />
                  <DeleteTenantDialog
                    projectId={projectId}
                    tenant={tenant}
                    onSuccess={loadTenants}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
