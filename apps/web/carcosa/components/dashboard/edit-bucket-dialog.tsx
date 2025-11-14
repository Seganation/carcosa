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
import { Edit } from "lucide-react";
import { bucketsAPI } from "@/lib/buckets-api";

interface Bucket {
  id: string;
  name: string;
  region?: string;
  endpoint?: string;
}

interface EditBucketDialogProps {
  bucket: Bucket;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function EditBucketDialog({
  bucket,
  onSuccess,
  trigger,
}: EditBucketDialogProps) {
  const [open, setOpen] = useState(false);
  const [bucketName, setBucketName] = useState(bucket.name);
  const [region, setRegion] = useState(bucket.region || "");
  const [endpoint, setEndpoint] = useState(bucket.endpoint || "");
  const [isUpdating, setIsUpdating] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setBucketName(bucket.name);
      setRegion(bucket.region || "");
      setEndpoint(bucket.endpoint || "");
    }
  }, [open, bucket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bucketName) {
      toast.error("Bucket name is required");
      return;
    }

    // Check if anything changed
    if (
      bucketName === bucket.name &&
      region === (bucket.region || "") &&
      endpoint === (bucket.endpoint || "")
    ) {
      toast.error("No changes detected");
      return;
    }

    setIsUpdating(true);
    try {
      await bucketsAPI.update(bucket.id, {
        name: bucketName,
        region: region || undefined,
        endpoint: endpoint || undefined,
      });

      toast.success("Bucket updated successfully!");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update bucket:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update bucket"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Bucket
          </DialogTitle>
          <DialogDescription>
            Update the bucket name, region, and endpoint. Provider and bucket name
            cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bucketName">Display Name</Label>
            <Input
              id="bucketName"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              placeholder="My Bucket"
              required
            />
            <p className="text-xs text-muted-foreground">
              Friendly name for this bucket connection
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region (Optional)</Label>
            <Input
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="us-east-1"
            />
            <p className="text-xs text-muted-foreground">
              AWS region or equivalent for your storage provider
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint">Custom Endpoint (Optional)</Label>
            <Input
              id="endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://s3.example.com"
            />
            <p className="text-xs text-muted-foreground">
              Custom S3-compatible endpoint URL
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!bucketName || isUpdating}
              className="flex-1"
            >
              {isUpdating ? "Updating..." : "Update Bucket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
