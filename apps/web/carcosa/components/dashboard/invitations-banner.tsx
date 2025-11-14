"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Mail, X, Check, Building2, Users } from "lucide-react";
import { useTeam } from "../../contexts/team-context";
import { DeclineInvitationDialog } from "./decline-invitation-dialog";
import { toast } from "react-hot-toast";

export function InvitationsBanner() {
  const { invitations, refreshInvitations, refreshOrganizations, refreshTeams } = useTeam();
  const [dismissed, setDismissed] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  if (invitations.length === 0 || dismissed) {
    return null;
  }

  const handleAccept = async (invitationId: string, name: string) => {
    setAcceptingId(invitationId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/invitations/${invitationId}/accept`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to accept invitation");
      }

      toast.success(`Joined ${name}!`);
      await Promise.all([
        refreshInvitations(),
        refreshOrganizations(),
        refreshTeams(),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to accept invitation";
      toast.error(message);
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">
                You have {invitations.length} pending invitation{invitations.length !== 1 ? "s" : ""}
              </h3>
              <div className="mt-3 space-y-2">
                {invitations.map((invitation) => {
                  const isTeamInvitation = !!invitation.team;
                  const name = invitation.team?.name || invitation.organization?.name || "Unknown";
                  const orgName = invitation.team?.organization.name || invitation.organization?.name;
                  const isAccepting = acceptingId === invitation.id;

                  return (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {isTeamInvitation ? (
                          <Users className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Building2 className="h-5 w-5 text-orange-600" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {name}
                            {isTeamInvitation && orgName && (
                              <span className="text-muted-foreground"> • {orgName}</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Invited by {invitation.invitedByUser.name || invitation.invitedByUser.email}
                            {" • "}
                            Role: {invitation.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(invitation.id, name)}
                          disabled={isAccepting}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {isAccepting ? "Accepting..." : "Accept"}
                        </Button>
                        <DeclineInvitationDialog
                          invitationId={invitation.id}
                          organizationName={orgName}
                          teamName={invitation.team?.name}
                          onSuccess={() => refreshInvitations()}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
