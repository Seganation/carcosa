"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Settings, Trash2, AlertTriangle, Users, Building2, LogOut, UserCog } from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "react-hot-toast";

interface OrganizationSettingsProps {
  organizationId: string;
}

interface OrganizationMember {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  };
}

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: {
    members: number;
    projects: number;
  };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    members: number;
    teams: number;
  };
}

export function OrganizationSettings({ organizationId }: OrganizationSettingsProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "members" | "teams">("general");

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");

  useEffect(() => {
    loadOrganizationData();
  }, [organizationId]);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);

      // Load organization details
      const orgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organizationId}`, {
        credentials: "include",
      });

      if (!orgRes.ok) throw new Error("Failed to load organization");

      const { organization: org } = await orgRes.json();
      setOrganization(org);
      setName(org.name);
      setSlug(org.slug);
      setDescription(org.description || "");
      setLogo(org.logo || "");

      // Load members
      const membersRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organizationId}/members`,
        { credentials: "include" }
      );

      if (membersRes.ok) {
        const { members: orgMembers } = await membersRes.json();
        setMembers(orgMembers);
      }

      // Load teams
      const teamsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/teams`, {
        credentials: "include",
      });

      if (teamsRes.ok) {
        const { teams: allTeams } = await teamsRes.json();
        // Filter teams for this organization
        const orgTeams = allTeams.filter((t: any) => t.organization.id === organizationId);
        setTeams(orgTeams);
      }
    } catch (error) {
      console.error("Error loading organization:", error);
      toast.error("Failed to load organization data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organizationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name,
            slug,
            description,
            logo: logo || undefined,
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update organization");
      }

      toast.success("Organization updated successfully");
      await loadOrganizationData();
    } catch (error: any) {
      console.error("Error updating organization:", error);
      toast.error(error.message || "Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!confirm("Are you sure you want to delete this organization? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organizationId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || error.error || "Failed to delete organization");
      }

      toast.success("Organization deleted successfully");
      window.location.href = "/dashboard/organizations";
    } catch (error: any) {
      console.error("Error deleting organization:", error);
      toast.error(error.message || "Failed to delete organization");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">Organization not found</p>
        </div>
      </div>
    );
  }

  const isOwner = organization.ownerId === "current-user-id"; // TODO: Get from auth context
  const canManage = isOwner; // TODO: Add ADMIN check

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage {organization.name}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "general"
              ? "bg-white border-b-2 border-orange-500 text-orange-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Settings className="inline h-4 w-4 mr-2" />
          General
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "members"
              ? "bg-white border-b-2 border-orange-500 text-orange-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Users className="inline h-4 w-4 mr-2" />
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "teams"
              ? "bg-white border-b-2 border-orange-500 text-orange-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Building2 className="inline h-4 w-4 mr-2" />
          Teams ({teams.length})
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === "general" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Update your organization's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Organization"
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="my-organization"
                  disabled={!canManage}
                />
                <p className="text-sm text-muted-foreground">
                  Used in URLs: /org/{slug}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of your organization"
                  rows={3}
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL (optional)</Label>
                <Input
                  id="logo"
                  type="url"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  disabled={!canManage}
                />
              </div>

              {canManage && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setName(organization.name);
                      setSlug(organization.slug);
                      setDescription(organization.description || "");
                      setLogo(organization.logo || "");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          {canManage && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                  <div>
                    <h4 className="font-medium">Delete Organization</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this organization and all its data.
                      This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteOrganization}
                    disabled={organization._count.teams > 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
                {organization._count.teams > 0 && (
                  <p className="text-sm text-red-600">
                    You must delete all teams before deleting the organization.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Members</CardTitle>
            <CardDescription>
              Manage who has access to this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{member.user.name || member.user.email}</p>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={member.role === "OWNER" ? "default" : "secondary"}
                    >
                      {member.role}
                    </Badge>
                    {canManage && member.role !== "OWNER" && (
                      <Button variant="ghost" size="sm">
                        <UserCog className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams Tab */}
      {activeTab === "teams" && (
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>
              Teams within this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No teams yet</p>
                </div>
              ) : (
                teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {team._count.members} members • {team._count.projects} projects
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/dashboard/team/${team.id}/settings`}>
                        <Settings className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
