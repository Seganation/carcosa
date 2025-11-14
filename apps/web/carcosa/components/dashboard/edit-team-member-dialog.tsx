"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@carcosa/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@carcosa/ui";
import { UserCog, Building2, Users } from "lucide-react";
import { useTeam } from "../../contexts/team-context";
import { toast } from "react-hot-toast";

interface EditTeamMemberDialogProps {
  teamId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  currentRole: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function EditTeamMemberDialog({
  teamId,
  memberId,
  memberName,
  memberEmail,
  currentRole,
  onSuccess,
  trigger,
}: EditTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newRole, setNewRole] = useState<"OWNER" | "ADMIN" | "MEMBER" | "VIEWER">(currentRole);

  const { refreshTeams } = useTeam();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newRole === currentRole) {
      toast.error("Please select a different role");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/teams/${teamId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update member role");
      }

      toast.success(`Updated ${memberName}'s role to ${newRole}`);
      await refreshTeams();
      if (onSuccess) onSuccess();
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update member role";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <UserCog className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Change Team Member Role
          </DialogTitle>
          <DialogDescription>
            Update the role for {memberName} ({memberEmail})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="p-3 border rounded-lg bg-gray-50">
              <p className="font-medium">{currentRole}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">New Role</Label>
            <Select value={newRole} onValueChange={(value: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER") => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Owner - Full access and control
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Admin - Manage members and settings
                  </div>
                </SelectItem>
                <SelectItem value="MEMBER">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Member - Full access to resources
                  </div>
                </SelectItem>
                <SelectItem value="VIEWER">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Viewer - Read-only access
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {newRole === "OWNER" && "Can manage everything including deleting the team"}
              {newRole === "ADMIN" && "Can manage members, settings, and resources"}
              {newRole === "MEMBER" && "Can access and modify resources"}
              {newRole === "VIEWER" && "Can only view resources, no modifications allowed"}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || newRole === currentRole}>
              {loading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
