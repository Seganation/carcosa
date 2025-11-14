"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Settings, Trash2, AlertTriangle, Users, FolderOpen, UserCog, Database } from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "react-hot-toast";

interface TeamSettingsProps {
  teamId: string;
}

interface TeamMember {
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

interface Project {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

interface Bucket {
  id: string;
  name: string;
  provider: string;
  region: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  _count: {
    members: number;
    projects: number;
  };
}

export function TeamSettings({ teamId }: TeamSettingsProps) {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "members" | "projects" | "buckets">("general");

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);

      // Load team details
      const teamRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/teams/${teamId}`,
        { credentials: "include" }
      );

      if (!teamRes.ok) throw new Error("Failed to load team");

      const { team: teamData } = await teamRes.json();
      setTeam(teamData);
      setName(teamData.name);
      setSlug(teamData.slug);
      setDescription(teamData.description || "");

      // Load members
      const membersRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/teams/${teamId}/members`,
        { credentials: "include" }
      );

      if (membersRes.ok) {
        const { members: teamMembers } = await membersRes.json();
        setMembers(teamMembers);
      }

      // Load projects
      if (teamData.projects) {
        setProjects(teamData.projects);
      }

    } catch (error) {
      console.error("Error loading team:", error);
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/organizations/teams/${teamId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name,
            slug,
            description,
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update team");
      }

      toast.success("Team updated successfully");
      await loadTeamData();
    } catch (error: any) {
      console.error("Error updating team:", error);
      toast.error(error.message || "Failed to update team");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return;
    }

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
        throw new Error(error.message || error.error || "Failed to delete team");
      }

      toast.success("Team deleted successfully");
      window.location.href = "/dashboard/organizations";
    } catch (error: any) {
      console.error("Error deleting team:", error);
      toast.error(error.message || "Failed to delete team");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Team Settings</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Team Settings</h1>
          <p className="text-muted-foreground">Team not found</p>
        </div>
      </div>
    );
  }

  const canManage = true; // TODO: Check if user is team OWNER/ADMIN or org OWNER/ADMIN

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Settings</h1>
        <p className="text-muted-foreground">
          Manage {team.name} • {team.organization.name}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "general"
              ? "bg-white border-b-2 border-blue-500 text-blue-600"
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
              ? "bg-white border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Users className="inline h-4 w-4 mr-2" />
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "projects"
              ? "bg-white border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <FolderOpen className="inline h-4 w-4 mr-2" />
          Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab("buckets")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "buckets"
              ? "bg-white border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Database className="inline h-4 w-4 mr-2" />
          Buckets ({buckets.length})
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === "general" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Update your team's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Team"
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="my-team"
                  disabled={!canManage}
                />
                <p className="text-sm text-muted-foreground">
                  Used in URLs: /team/{slug}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of your team"
                  rows={3}
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-2">
                <Label>Organization</Label>
                <div className="p-3 border rounded-lg bg-gray-50">
                  <p className="font-medium">{team.organization.name}</p>
                  <p className="text-sm text-muted-foreground">@{team.organization.slug}</p>
                </div>
              </div>

              {canManage && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setName(team.name);
                      setSlug(team.slug);
                      setDescription(team.description || "");
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
                    <h4 className="font-medium">Delete Team</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this team and all its data.
                      This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteTeam}
                    disabled={projects.length > 0 || buckets.length > 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
                {(projects.length > 0 || buckets.length > 0) && (
                  <p className="text-sm text-red-600">
                    You must delete all projects and buckets before deleting the team.
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
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage who has access to this team
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
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
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

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              Projects within this team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No projects yet</p>
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">@{project.slug}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/dashboard/app/${project.id}`}>
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

      {/* Buckets Tab */}
      {activeTab === "buckets" && (
        <Card>
          <CardHeader>
            <CardTitle>Storage Buckets</CardTitle>
            <CardDescription>
              Buckets owned by this team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No buckets yet</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
