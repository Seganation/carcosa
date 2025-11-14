"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
import { Trash2, AlertTriangle } from "lucide-react";
import { useTeam } from "../../contexts/team-context";
import { toast } from "react-hot-toast";

interface DeleteTeamDialogProps {
  teamId: string;
  teamName: string;
  teamSlug: string;
  projectCount: number;
  memberCount: number;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function DeleteTeamDialog({
  teamId,
  teamName,
  teamSlug,
  projectCount,
  memberCount,
  onSuccess,
  trigger,
}: DeleteTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const { refreshTeams, refreshOrganizations } = useTeam();

  const canDelete = confirmText === teamSlug;

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("Please type the team slug to confirm");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/teams/${teamId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete team");
      }

      toast.success(`Team "${teamName}" deleted successfully`);
      await Promise.all([refreshTeams(), refreshOrganizations()]);
      if (onSuccess) onSuccess();
      setOpen(false);

      // Redirect to organizations page after successful deletion
      window.location.href = "/dashboard/organizations";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete team";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Team
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the team and all its data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium text-sm text-red-900">Warning: This will delete:</p>
                  <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                    <li>{projectCount} project{projectCount !== 1 ? "s" : ""}</li>
                    <li>{memberCount} member{memberCount !== 1 ? "s" : ""}</li>
                    <li>All files and API keys</li>
                    <li>All bucket access permissions</li>
                    <li>All settings and configurations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              Type <span className="font-mono font-bold">{teamSlug}</span> to confirm
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={teamSlug}
              className={confirmText && !canDelete ? "border-red-500" : ""}
            />
            {confirmText && !canDelete && (
              <p className="text-xs text-red-600">
                Text does not match. Please type "{teamSlug}" exactly.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              setConfirmText("");
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading || !canDelete}>
            {loading ? "Deleting..." : "Delete Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
