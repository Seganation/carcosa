"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@carcosa/ui";
import { Users, Plus } from "lucide-react";
import { useTeam } from "../../contexts/team-context";
import { createTeamSchema } from "@/lib/validations/teams.validation";
import { toast } from "react-hot-toast";

interface CreateTeamDialogProps {
  organizationId: string;
  organizationName: string;
}

export function CreateTeamDialog({
  organizationId,
  organizationName,
}: CreateTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createTeam } = useTeam();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = createTeamSchema.safeParse({
      name: formData.name.trim(),
      slug: formData.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      description: formData.description.trim(),
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
    setLoading(true);
    try {
      await createTeam(parsed.data, organizationId);

      toast.success("Team created successfully!");
      setOpen(false);
      setFormData({ name: "", slug: "", description: "" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create team";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Team
          </DialogTitle>
          <DialogDescription>
            Create a new team within {organizationName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter team name"
              required
            />
            {errors.name ? (
              <p className="text-sm text-red-500">{errors.name}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="team-slug"
              required
            />
            {errors.slug ? (
              <p className="text-sm text-red-500">{errors.slug}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                This will be used in URLs and API endpoints
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe your team"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
