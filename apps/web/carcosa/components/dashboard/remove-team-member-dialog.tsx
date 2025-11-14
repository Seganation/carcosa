"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@carcosa/ui";
import { UserMinus, AlertTriangle } from "lucide-react";
import { useTeam } from "../../contexts/team-context";
import { toast } from "react-hot-toast";

interface RemoveTeamMemberDialogProps {
  teamId: string;
  teamName: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberRole: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function RemoveTeamMemberDialog({
  teamId,
  teamName,
  memberId,
  memberName,
  memberEmail,
  memberRole,
  onSuccess,
  trigger,
}: RemoveTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { refreshTeams } = useTeam();

  const handleRemove = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/teams/${teamId}/members/${memberId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove member");
      }

      toast.success(`Removed ${memberName} from ${teamName}`);
      await refreshTeams();
      if (onSuccess) onSuccess();
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove member";
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
            <UserMinus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Remove Team Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this member from {teamName}?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-sm">
                  {memberName} ({memberEmail})
                </p>
                <p className="text-sm text-muted-foreground">Role: {memberRole}</p>
                <p className="text-sm text-red-600">
                  This member will lose access to all projects, files, and resources within this
                  team.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemove} disabled={loading}>
            {loading ? "Removing..." : "Remove Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
