"use client";

import { useState, useEffect } from "react";
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
import { Edit } from "lucide-react";
import { apiBase, withAuth } from "@/lib/api";
import { updateTenantSchema } from "@/lib/validations/tenants.validation";

interface Tenant {
  id: string;
  slug: string;
  metadata?: {
    name?: string;
    description?: string;
  };
}

interface EditTenantDialogProps {
  projectId: string;
  tenant: Tenant;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function EditTenantDialog({
  projectId,
  tenant,
  onSuccess,
  trigger,
}: EditTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: tenant.metadata?.name || "",
    description: tenant.metadata?.description || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens or tenant changes
  useEffect(() => {
    if (open) {
      setFormData({
        name: tenant.metadata?.name || "",
        description: tenant.metadata?.description || "",
      });
      setErrors({});
    }
  }, [open, tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod (slug is immutable, so only validate name/description)
    const result = updateTenantSchema.safeParse({
      slug: tenant.slug,
      ...formData,
    });
    if (!result.success) {
      const zodErrors: Record<string, string> = {};
      for (const err of result.error.errors) {
        zodErrors[String(err.path[0])] = err.message;
      }
      setErrors(zodErrors);
      toast.error("Please fix validation errors");
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${apiBase()}/api/v1/projects/${projectId}/tenants/${tenant.id}`,
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update tenant");
      }

      toast.success("Tenant updated successfully!");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update tenant:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update tenant"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
          <DialogDescription>
            Update the display name and description for this tenant.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editTenantSlug">Tenant Slug</Label>
            <Input
              id="editTenantSlug"
              value={tenant.slug}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Tenant slug cannot be changed after creation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editTenantName">Display Name</Label>
            <Input
              id="editTenantName"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Tenant Name"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="editTenantDescription">Description</Label>
            <Textarea
              id="editTenantDescription"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Description of this tenant"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
  );
}
