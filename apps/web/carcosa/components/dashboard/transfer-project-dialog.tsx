"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent } from "../ui/card";
import { ArrowRightLeft, AlertTriangle, Building2, Users } from "lucide-react";
import { projectsAPI } from "@/lib/projects-api";
import { useTeam } from "../../contexts/team-context";

interface Project {
  id: string;
  name: string;
  slug: string;
  team: {
    id: string;
    name: string;
    organization: {
      id: string;
      name: string;
    };
  };
  bucket: {
    id: string;
    name: string;
  };
}

interface TransferProjectDialogProps {
  project: Project;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function TransferProjectDialog({
  project,
  onSuccess,
  trigger,
}: TransferProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const { teams } = useTeam();

  // Filter out the current team and get available teams in the same organization
  const availableTeams = teams.filter(
    (team) =>
      team.id !== project.team.id &&
      team.organization.id === project.team.organization.id
  );

  const selectedTeam = teams.find((team) => team.id === selectedTeamId);

  const handleTransfer = async () => {
    if (!selectedTeamId) {
      toast.error("Please select a team");
      return;
    }

    setIsTransferring(true);
    try {
      await projectsAPI.transfer(project.id, selectedTeamId);

      toast.success(`Project transferred to ${selectedTeam?.name}!`);
      setOpen(false);
      setSelectedTeamId("");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to transfer project:", error);
      if (
        error instanceof Error &&
        error.message.includes("new_team_no_bucket_access")
      ) {
        toast.error(
          "The selected team does not have access to the project's bucket. Please grant access first."
        );
      } else if (
        error instanceof Error &&
        error.message.includes("slug_already_exists_in_new_team")
      ) {
        toast.error(
          "A project with this slug already exists in the selected team. Please rename this project first."
        );
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to transfer project"
        );
      }
    } finally {
      setIsTransferring(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setSelectedTeamId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Project
          </DialogTitle>
          <DialogDescription>
            Transfer this project to a different team within the same organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Team Info */}
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">Current Team</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {project.team.name} • {project.team.organization.name}
              </p>
            </CardContent>
          </Card>

          {/* New Team Selection */}
          <div className="space-y-2">
            <Label>Transfer To</Label>
            {availableTeams.length === 0 ? (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  No other teams available in this organization. You need to be a member
                  of at least one other team in the same organization to transfer this
                  project.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((team) => (
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
            )}
          </div>

          {selectedTeam && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Transfer Destination</span>
                </div>
                <p className="text-sm text-blue-700">
                  Project will be transferred to <strong>{selectedTeam.name}</strong> in{" "}
                  <strong>{selectedTeam.organization.name}</strong>.
                </p>
              </CardContent>
            </Card>
          )}

          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> The new team must have access to the project's
              bucket (<strong>{project.bucket.name}</strong>). If the transfer fails, you
              may need to grant the team access to the bucket first.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isTransferring}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleTransfer}
            disabled={!selectedTeamId || availableTeams.length === 0 || isTransferring}
          >
            {isTransferring ? "Transferring..." : "Transfer Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
