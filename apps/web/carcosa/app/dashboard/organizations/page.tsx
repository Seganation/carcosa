"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Building2, Users, Mail, Plus, Settings, Trash2 } from "lucide-react";
import { useTeam } from "../../../contexts/team-context";
import { CreateOrganizationDialog } from "../../../components/dashboard/create-organization-dialog";
import { CreateTeamDialog } from "../../../components/dashboard/create-team-dialog";
import { InviteUserDialog } from "../../../components/dashboard/invite-user-dialog";
import { DeclineInvitationDialog } from "../../../components/dashboard/decline-invitation-dialog";
import { toast } from "react-hot-toast";

export default function OrganizationsPage() {
  const { organizations, teams, invitations, loading, refreshOrganizations, refreshTeams, refreshInvitations } = useTeam();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const handleRefresh = async () => {
    await Promise.all([
      refreshOrganizations(),
      refreshTeams(),
    ]);
    toast.success("Refreshed organizations and teams");
  };

  const handleAcceptInvitation = async (invitationId: string, name: string) => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Organizations & Teams</h1>
            <p className="text-muted-foreground">
              Manage your organizations, teams, and invitations
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations & Teams</h1>
          <p className="text-muted-foreground">
            Manage your organizations, teams, and invitations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <CreateOrganizationDialog />
        </div>
      </div>

      {/* Organizations */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Organizations</h2>
        {organizations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No organizations yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first organization to start managing teams and projects.
              </p>
              <CreateOrganizationDialog />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-orange-500" />
                    {org.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>@{org.slug}</span>
                    {org.owner.id === "current-user-id" && (
                      <Badge variant="secondary">Owner</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {org.description && (
                    <p className="text-sm text-muted-foreground">{org.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {org._count.members} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {org._count.teams} teams
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <InviteUserDialog
                      organizationId={org.id}
                      organizationName={org.name}
                    />
                    <CreateTeamDialog
                      organizationId={org.id}
                      organizationName={org.name}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/organizations/${org.id}/settings`}>
                        <Settings className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Teams</h2>
        {teams.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No teams yet</h3>
              <p className="text-muted-foreground mb-4">
                Create teams within your organizations to collaborate on projects.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    {team.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>@{team.slug}</span>
                    <span>•</span>
                    <span>{team.organization.name}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {team.description && (
                    <p className="text-sm text-muted-foreground">{team.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {team._count.members} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {team._count.projects} projects
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <InviteUserDialog
                      teamId={team.id}
                      teamName={team.name}
                      organizationName={team.organization.name}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/dashboard/team/${team.id}/settings`}>
                        <Settings className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Pending Invitations</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <div className="text-sm text-muted-foreground">
                          <span>Invited by {invitation.invitedByUser.name}</span>
                          {invitation.team && (
                            <>
                              <span> • </span>
                              <span>Team: {invitation.team.name}</span>
                            </>
                          )}
                          {invitation.organization && (
                            <>
                              <span> • </span>
                              <span>Organization: {invitation.organization.name}</span>
                            </>
                          )}
                          <span> • </span>
                          <Badge variant="secondary">{invitation.role}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const name = invitation.team?.name || invitation.organization?.name || "workspace";
                          handleAcceptInvitation(invitation.id, name);
                        }}
                        disabled={acceptingId === invitation.id}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        {acceptingId === invitation.id ? "Accepting..." : "Accept"}
                      </Button>
                      <DeclineInvitationDialog
                        invitationId={invitation.id}
                        organizationName={invitation.organization?.name}
                        teamName={invitation.team?.name}
                        onSuccess={() => refreshInvitations()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
