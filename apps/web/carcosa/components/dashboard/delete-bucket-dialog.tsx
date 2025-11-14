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
import { bucketsAPI } from "@/lib/buckets-api";

interface Bucket {
  id: string;
  name: string;
  bucketName: string;
  _count: {
    projects: number;
  };
}

interface DeleteBucketDialogProps {
  bucket: Bucket;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function DeleteBucketDialog({
  bucket,
  onSuccess,
  trigger,
}: DeleteBucketDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== bucket.name) {
      toast.error("Confirmation text does not match");
      return;
    }

    setIsDeleting(true);
    try {
      await bucketsAPI.delete(bucket.id);

      toast.success("Bucket deleted successfully!");
      setOpen(false);
      setConfirmText("");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to delete bucket:", error);
      if (
        error instanceof Error &&
        error.message.includes("bucket_in_use")
      ) {
        toast.error(
          "Cannot delete bucket. It is currently being used by one or more projects."
        );
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete bucket"
        );
      }
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

  // Check if bucket is in use
  const isInUse = bucket._count.projects > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Bucket Connection
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the bucket
            connection from Carcosa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isInUse ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cannot Delete:</strong> This bucket is currently being used by{" "}
                <strong>{bucket._count.projects}</strong> project
                {bucket._count.projects !== 1 ? "s" : ""}. Please remove or reassign
                {bucket._count.projects !== 1 ? " them" : " it"} before deleting this
                bucket connection.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Deleting this bucket connection will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Remove the bucket from Carcosa</li>
                    <li>Delete all team access permissions</li>
                    <li>Remove connection configuration and credentials</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Note:</strong> The actual bucket and files in your storage
                    provider (AWS S3, Cloudflare R2, etc.) will NOT be deleted. Only the
                    connection to Carcosa will be removed.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="confirmText">
                  Type <span className="font-mono font-bold">{bucket.name}</span> to
                  confirm deletion
                </Label>
                <Input
                  id="confirmText"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={bucket.name}
                />
              </div>
            </>
          )}
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
          {!isInUse && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmText !== bucket.name || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Bucket Connection"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
