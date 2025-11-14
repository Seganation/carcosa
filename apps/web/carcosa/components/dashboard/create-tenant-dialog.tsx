"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Plus } from "lucide-react";
import { apiBase, withAuth } from "@/lib/api";

interface CreateTenantDialogProps {
  projectId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateTenantDialog({
  projectId,
  onSuccess,
  trigger,
}: CreateTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create tenant");
      }

      toast.success("Tenant created successfully!");
      setFormData({ slug: "", name: "", description: "" });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create tenant:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create tenant"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setFormData({ slug: "", name: "", description: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Tenant</DialogTitle>
          <DialogDescription>
            Add a new tenant to organize your multi-tenant data.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenantSlug">Tenant Slug *</Label>
            <Input
              id="tenantSlug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="tenant-1"
              pattern="^[a-z0-9-]+$"
              required
            />
            <p className="text-xs text-muted-foreground">
              Used in API endpoints. Only lowercase letters, numbers, and hyphens.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantName">Display Name</Label>
            <Input
              id="tenantName"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="First Tenant"
            />
            <p className="text-xs text-muted-foreground">
              Optional friendly name for this tenant
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantDescription">Description</Label>
            <Textarea
              id="tenantDescription"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Description of this tenant"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
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
  );
}
