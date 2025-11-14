"use client";

import { useState, useEffect } from "react";
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
import { Users, Edit } from "lucide-react";
import { useTeam } from "../../contexts/team-context";
import { toast } from "react-hot-toast";

interface EditTeamDialogProps {
  teamId: string;
  initialName: string;
  initialSlug: string;
  initialDescription?: string;
  trigger?: React.ReactNode;
}

export function EditTeamDialog({
  teamId,
  initialName,
  initialSlug,
  initialDescription = "",
  trigger,
}: EditTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialName,
    slug: initialSlug,
    description: initialDescription,
  });

  const { refreshTeams } = useTeam();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: initialName,
        slug: initialSlug,
        description: initialDescription,
      });
    }
  }, [open, initialName, initialSlug, initialDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/teams/${teamId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: formData.name.trim(),
            slug: formData.slug.trim().toLowerCase().replace(/\s+/g, "-"),
            description: formData.description.trim() || undefined,
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update team");
      }

      toast.success("Team updated successfully!");
      await refreshTeams();
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update team";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Only auto-generate slug if it matches the previous auto-generated slug
      slug:
        prev.slug === initialSlug.toLowerCase().replace(/\s+/g, "-")
          ? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
          : prev.slug,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Edit Team
          </DialogTitle>
          <DialogDescription>Update your team's information.</DialogDescription>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="team-slug"
              required
            />
            <p className="text-xs text-muted-foreground">
              This will be used in URLs and API endpoints
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
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
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
