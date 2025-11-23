"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
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
import { Card, CardContent } from "../ui/card";
import { Switch } from "../ui/switch";
import { Database, Loader2, Users, Building2 } from "lucide-react";
import { projectsAPI } from "@/lib/projects-api";
import { bucketsAPI, type Bucket } from "@/lib/buckets-api";
import { useTeam } from "../../contexts/team-context";
import { createProjectSchema } from "@/lib/validations/projects.validation";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [selectedBucketId, setSelectedBucketId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [multiTenant, setMultiTenant] = useState(false);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loadingBuckets, setLoadingBuckets] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { teams, currentTeam } = useTeam();

  // Auto-generate slug from project name
  const handleNameChange = (name: string) => {
    setProjectName(name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);
    setProjectSlug(slug);
  };

  // Set default team when dialog opens
  useEffect(() => {
    if (open && currentTeam && !selectedTeamId) {
      setSelectedTeamId(currentTeam.id);
    }
  }, [open, currentTeam, selectedTeamId]);

  // Load available buckets when dialog opens
  useEffect(() => {
    if (open) {
      loadBuckets();
    }
  }, [open]);

  const loadBuckets = async () => {
    setLoadingBuckets(true);
    try {
      const { buckets: data } = await bucketsAPI.list();
      const connectedBuckets = data.filter(
        (bucket) => bucket.status === "connected"
      );
      setBuckets(connectedBuckets);
    } catch (error) {
      console.error("Failed to load buckets:", error);
      toast.error("Failed to load available buckets");
    } finally {
      setLoadingBuckets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const parsed = createProjectSchema.safeParse({
      name: projectName.trim(),
      slug: projectSlug.trim(),
      bucketId: selectedBucketId,
      teamId: selectedTeamId || undefined,
      multiTenant,
    });

    if (!parsed.success) {
      const zodErrors: Record<string, string> = {};
      for (const err of parsed.error.issues) {
        if (err.path && err.path.length) {
          zodErrors[String(err.path[0])] = err.message;
        }
      }
      setErrors(zodErrors);
      toast.error("Please fix validation errors");
      return;
    }

    setErrors({});
    setIsCreating(true);
    try {
      await projectsAPI.create(parsed.data);

      toast.success("Project created successfully!");
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create project"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setProjectName("");
    setProjectSlug("");
    setSelectedBucketId("");
    setSelectedTeamId("");
    setMultiTenant(false);
  };

  const selectedBucket = buckets.find(
    (bucket) => bucket.id === selectedBucketId
  );

  const selectedTeam = teams.find(
    (team) => team.id === selectedTeamId
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Awesome Project"
              required
            />
            {errors.name ? (
              <p className="text-sm text-red-500">{errors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectSlug">Project Slug</Label>
            <Input
              id="projectSlug"
              value={projectSlug}
              onChange={(e) => setProjectSlug(e.target.value)}
              placeholder="my-awesome-project"
              pattern="^[a-z0-9-]+$"
              required
            />
            {errors.slug ? (
              <p className="text-sm text-red-500">{errors.slug}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Used in API endpoints and URLs. Only lowercase letters, numbers,
                and hyphens.
              </p>
            )}
          </div>

          {/* Team Selection */}
          {teams.length > 0 && (
            <div className="space-y-2">
              <Label>Team (Optional)</Label>
              <Select
                value={selectedTeamId}
                onValueChange={setSelectedTeamId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Personal Project</span>
                    </div>
                  </SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{team.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {team.organization.name}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Assign this project to a team for collaboration. Leave empty for personal projects.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Storage Bucket</Label>
            {loadingBuckets ? (
              <div className="flex items-center gap-2 p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading buckets...
                </span>
              </div>
            ) : buckets.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No connected buckets available. You need to connect a
                    storage bucket first.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => onOpenChange(false)}
                  >
                    Connect Bucket First
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Select
                value={selectedBucketId}
                onValueChange={setSelectedBucketId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a storage bucket" />
                </SelectTrigger>
                <SelectContent>
                  {buckets.map((bucket) => (
                    <SelectItem key={bucket.id} value={bucket.id}>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{bucket.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {bucket.provider.toUpperCase()} •{" "}
                            {bucket.bucketName}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Multi-tenant Support</Label>
              <div className="text-sm text-muted-foreground">
                Enable this project to support multiple tenants with isolated data
              </div>
            </div>
            <Switch
              checked={multiTenant}
              onCheckedChange={setMultiTenant}
            />
          </div>

          {multiTenant && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Multi-tenant Enabled</span>
                </div>
                <p className="text-sm text-blue-700">
                  This project will support multiple tenants. Each tenant will have their own isolated file storage and API access.
                </p>
              </CardContent>
            </Card>
          )}

          {selectedBucket && (
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">{selectedBucket.name}</span>
                  <span className="text-xs px-2 py-1 bg-muted rounded">
                    {selectedBucket.provider.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bucket: {selectedBucket.bucketName}
                  {selectedBucket.region &&
                    ` • Region: ${selectedBucket.region}`}
                </p>
              </CardContent>
            </Card>
          )}

          {selectedTeam && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Team Project</span>
                </div>
                <p className="text-sm text-blue-700">
                  This project will be created under the <strong>{selectedTeam.name}</strong> team in <strong>{selectedTeam.organization.name}</strong>.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !projectName ||
                !projectSlug ||
                !selectedBucketId ||
                buckets.length === 0 ||
                isCreating
              }
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
