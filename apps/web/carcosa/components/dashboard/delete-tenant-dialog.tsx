"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Trash2, AlertTriangle } from "lucide-react";
import { apiBase, withAuth } from "@/lib/api";

interface Tenant {
  id: string;
  slug: string;
  metadata?: {
    name?: string;
  };
}

interface DeleteTenantDialogProps {
  projectId: string;
  tenant: Tenant;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function DeleteTenantDialog({
  projectId,
  tenant,
  onSuccess,
  trigger,
}: DeleteTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const displayName = tenant.metadata?.name || tenant.slug;

  const handleDelete = async () => {
    if (confirmText !== tenant.slug) {
      toast.error("Confirmation text does not match");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${apiBase()}/api/v1/projects/${projectId}/tenants/${tenant.id}`,
        {
          method: "DELETE",
          headers: withAuth(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete tenant");
      }

      toast.success("Tenant deleted successfully!");
      setOpen(false);
      setConfirmText("");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to delete tenant:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete tenant"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setConfirmText("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Tenant
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the tenant
            and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Deleting "{displayName}" will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All tenant configuration and metadata</li>
                <li>All files associated with this tenant</li>
                <li>All usage data and analytics</li>
              </ul>
              <p className="mt-2">
                This action is irreversible and cannot be undone.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirmText">
              Type <span className="font-mono font-bold">{tenant.slug}</span> to
              confirm deletion
            </Label>
            <Input
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={tenant.slug}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== tenant.slug || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Tenant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
