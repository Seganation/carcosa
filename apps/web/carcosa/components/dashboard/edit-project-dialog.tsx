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
import { projectsAPI } from "@/lib/projects-api";
import { updateProjectSchema } from "@/lib/validations/projects.validation";

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface EditProjectDialogProps {
  project: Project;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function EditProjectDialog({
  project,
  onSuccess,
  trigger,
}: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [projectName, setProjectName] = useState(project.name);
  const [projectSlug, setProjectSlug] = useState(project.slug);
  const [isUpdating, setIsUpdating] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setProjectName(project.name);
      setProjectSlug(project.slug);
      setErrors({});
    }
  }, [open, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const result = updateProjectSchema.safeParse({
      name: projectName,
      slug: projectSlug,
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
    if (projectName === project.name && projectSlug === project.slug) {
      toast.error("No changes detected");
      return;
    }

    setIsUpdating(true);
    try {
      await projectsAPI.update(project.id, {
        name: projectName,
        slug: projectSlug,
      });

      toast.success("Project updated successfully!");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update project"
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
            Edit Project
          </DialogTitle>
          <DialogDescription>
            Update the project name and slug. Note: Changing the slug may affect
            existing API integrations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome Project"
              required
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
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
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Used in API endpoints and URLs. Only lowercase letters, numbers,
              and hyphens.
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
              disabled={!projectName || !projectSlug || isUpdating}
              className="flex-1"
            >
              {isUpdating ? "Updating..." : "Update Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
