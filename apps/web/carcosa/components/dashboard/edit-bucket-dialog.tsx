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
import { updateBucketSchema } from "@/lib/validations/buckets.validation";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
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
      setErrors({});
    }
  }, [open, bucket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const result = updateBucketSchema.safeParse({
      name: bucketName,
      region,
      endpoint,
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
            Update the bucket name, region, and endpoint. Provider and bucket
            name cannot be changed.
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
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
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
            {errors.region && (
              <p className="text-sm text-red-500">{errors.region}</p>
            )}
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
            {errors.endpoint && (
              <p className="text-sm text-red-500">{errors.endpoint}</p>
            )}
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
