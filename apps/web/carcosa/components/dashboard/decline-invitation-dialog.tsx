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
import { X, AlertTriangle } from "lucide-react";
import { useTeam } from "../../contexts/team-context";
import { toast } from "react-hot-toast";

interface DeclineInvitationDialogProps {
  invitationId: string;
  organizationName?: string;
  teamName?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function DeclineInvitationDialog({
  invitationId,
  organizationName,
  teamName,
  onSuccess,
  trigger,
}: DeclineInvitationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { refreshInvitations } = useTeam();

  const handleDecline = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/invitations/${invitationId}/decline`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to decline invitation");
      }

      const targetName = teamName || organizationName || "this workspace";
      toast.success(`Declined invitation to ${targetName}`);
      await refreshInvitations();
      if (onSuccess) onSuccess();
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to decline invitation";
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
          <Button variant="outline" size="sm">
            Decline
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-700">
            <X className="h-5 w-5" />
            Decline Invitation
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to decline this invitation to {targetName}?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  By declining this invitation, you will not be able to accept it again unless
                  you are re-invited.
                </p>
                {teamName && organizationName && (
                  <p className="text-sm text-gray-700">
                    <strong>Team:</strong> {teamName} in {organizationName}
                  </p>
                )}
                {!teamName && organizationName && (
                  <p className="text-sm text-gray-700">
                    <strong>Organization:</strong> {organizationName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleDecline} disabled={loading}>
            {loading ? "Declining..." : "Decline Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
