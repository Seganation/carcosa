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
import { XCircle, AlertTriangle } from "lucide-react";
import { useTeam } from "../../contexts/team-context";
import { toast } from "react-hot-toast";

interface RevokeInvitationDialogProps {
  invitationId: string;
  email: string;
  organizationName?: string;
  teamName?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function RevokeInvitationDialog({
  invitationId,
  email,
  organizationName,
  teamName,
  onSuccess,
  trigger,
}: RevokeInvitationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { refreshInvitations } = useTeam();

  const handleRevoke = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/invitations/${invitationId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to revoke invitation");
      }

      toast.success(`Invitation to ${email} has been revoked`);
      await refreshInvitations();
      if (onSuccess) onSuccess();
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to revoke invitation";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const targetName = teamName || organizationName || "this workspace";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Revoke Invitation
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke this invitation?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-medium text-sm text-orange-900">
                  Invitation Details
                </p>
                <div className="text-sm text-orange-700 space-y-1">
                  <p><strong>Email:</strong> {email}</p>
                  <p><strong>To:</strong> {targetName}</p>
                </div>
                <p className="text-sm text-orange-700 mt-2">
                  The user will no longer be able to accept this invitation and won't be
                  notified about the revocation.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRevoke} disabled={loading}>
            {loading ? "Revoking..." : "Revoke Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
