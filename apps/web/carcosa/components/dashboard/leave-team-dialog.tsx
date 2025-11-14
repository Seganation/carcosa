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
import { LogOut, AlertTriangle } from "lucide-react";
import { useTeam } from "../../contexts/team-context";
import { useAuth } from "../../contexts/auth-context";
import { toast } from "react-hot-toast";

interface LeaveTeamDialogProps {
  teamId: string;
  teamName: string;
  membershipId: string;
  trigger?: React.ReactNode;
}

export function LeaveTeamDialog({
  teamId,
  teamName,
  membershipId,
  trigger,
}: LeaveTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { refreshTeams, refreshOrganizations } = useTeam();
  const { user } = useAuth();

  const handleLeave = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/teams/${teamId}/members/${membershipId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to leave team");
      }

      toast.success(`You have left ${teamName}`);
      await Promise.all([refreshTeams(), refreshOrganizations()]);
      setOpen(false);

      // Redirect to organizations page after leaving
      window.location.href = "/dashboard/organizations";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to leave team";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Leave Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <LogOut className="h-5 w-5" />
            Leave Team
          </DialogTitle>
          <DialogDescription>Are you sure you want to leave {teamName}?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-sm text-orange-900">You will lose access to:</p>
                <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
                  <li>All projects within this team</li>
                  <li>All files and resources</li>
                  <li>All API keys and credentials</li>
                  <li>Team settings and configurations</li>
                </ul>
                <p className="text-sm text-orange-700 mt-2">
                  You will need to be invited again to rejoin this team.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleLeave} disabled={loading}>
            {loading ? "Leaving..." : "Leave Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
