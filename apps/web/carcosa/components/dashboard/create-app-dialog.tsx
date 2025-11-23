"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Database, AlertCircle, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { projectsAPI, type CreateProjectRequest } from "../../lib/projects-api";
import { bucketsAPI, type Bucket } from "../../lib/buckets-api";
import { toast } from "react-hot-toast";

interface CreateAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateAppDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAppDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    bucketId: "",
    multiTenant: false,
  });
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBuckets, setLoadingBuckets] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const loadBuckets = async () => {
    try {
      setLoadingBuckets(true);
      const { buckets: data } = await bucketsAPI.list();
      setBuckets(data);
    } catch (error) {
      console.error("Failed to load buckets:", error);
      toast.error("Failed to load buckets");
    } finally {
      setLoadingBuckets(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadBuckets();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.slug || !formData.bucketId) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Create project
      const createData: CreateProjectRequest = {
        name: formData.name,
        slug: formData.slug,
        bucketId: formData.bucketId,
        multiTenant: formData.multiTenant || false,
      };

      toast.loading("Creating project...");
      const response = await projectsAPI.create(createData);
      toast.dismiss();

      toast.success("Project created successfully!");

      // Reset form and close dialog
      setFormData({
        name: "",
        slug: "",
        bucketId: "",
        multiTenant: false,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const selectedBucket = buckets.find((b) => b.id === formData.bucketId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New App</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">App Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Awesome App"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">App Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="my-awesome-app"
                pattern="^[a-z0-9-]+$"
                required
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Storage Bucket *</Label>
              <Select
                value={formData.bucketId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, bucketId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a bucket" />
                </SelectTrigger>
                <SelectContent>
                  {loadingBuckets ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading buckets...
                      </div>
                    </SelectItem>
                  ) : buckets.length === 0 ? (
                    <SelectItem value="no-buckets" disabled>
                      No buckets available
                    </SelectItem>
                  ) : (
                    buckets.map((bucket) => (
                      <SelectItem key={bucket.id} value={bucket.id}>
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          <span>{bucket.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({bucket.provider.toUpperCase()})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {buckets.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  <p>No storage buckets available.</p>
                  <Link
                    href="/dashboard/buckets"
                    className="text-orange-500 hover:text-orange-600 underline"
                  >
                    Connect a bucket first
                  </Link>
                </div>
              )}

              {selectedBucket && (
                <Card className="border-border">
                  <CardContent className="p-3">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="font-medium">
                          {selectedBucket.provider.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bucket:</span>
                        <span className="font-medium">
                          {selectedBucket.bucketName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Region:</span>
                        <span className="font-medium">
                          {selectedBucket.region || "auto"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span
                          className={`font-medium ${
                            selectedBucket.status === "connected"
                              ? "text-green-600"
                              : selectedBucket.status === "error"
                                ? "text-red-600"
                                : "text-yellow-600"
                          }`}
                        >
                          {selectedBucket.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.name ||
                !formData.slug ||
                !formData.bucketId
              }
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create App"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
