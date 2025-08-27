"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTeam } from "../../../../contexts/team-context";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { CardDescription } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { 
  Box, 
  Users, 
  Database, 
  BarChart3, 
  Image, 
  Activity, 
  Plus, 
  ArrowLeft,
  Settings,
  FileText,
  Key
} from "lucide-react";
import Link from "next/link";
import { projectsAPI } from "../../../../lib/projects-api";
import { bucketsAPI } from "../../../../lib/buckets-api";

export default function TeamDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const { currentTeam, teams } = useTeam();
  const [team, setTeam] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeamData = async () => {
      if (!teamId) return;
      
      try {
        setLoading(true);
        
        // Find the team from the teams list
        const foundTeam = teams.find(t => t.id === teamId);
        if (!foundTeam) {
          router.push('/dashboard');
          return;
        }
        setTeam(foundTeam);

        // Load team's projects and buckets
        const [projectsResponse, bucketsResponse] = await Promise.all([
          projectsAPI.list(),
          bucketsAPI.getTeamBuckets(teamId)
        ]);

        // Filter projects for this team
        const teamProjects = projectsResponse.projects?.filter((p: any) => p.teamId === teamId) || [];
        setProjects(teamProjects);
        setBuckets(bucketsResponse.buckets || []);
      } catch (error) {
        console.error("Failed to load team data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, [teamId, teams, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Team Not Found</h2>
          <p className="text-muted-foreground">
            The requested team could not be found.
          </p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            <p className="text-muted-foreground">
              Team dashboard for {team.organization.name}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300">
          Team
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Active projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Buckets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buckets.length}</div>
            <p className="text-xs text-muted-foreground">
              Accessible buckets
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team._count.members}</div>
            <p className="text-xs text-muted-foreground">
              Active members
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              Team is operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Projects & Apps
              </CardTitle>
              <CardDescription>
                Manage your team's applications and projects
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.id} href={`/dashboard/app/${project.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{project.slug}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                        {project.multiTenant && (
                          <Badge variant="outline" className="text-xs">Multi-tenant</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first project
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
            </CardTitle>
            <CardDescription>
              Manage team members, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/dashboard/team/${teamId}/members`}>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Members
              </Button>
            </Link>
            <Link href={`/dashboard/team/${teamId}/settings`}>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Team Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Resources & Tools
            </CardTitle>
            <CardDescription>
              Access team resources and development tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/dashboard/team/${teamId}/tenants`}>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Multi-tenant Data
              </Button>
            </Link>
            <Link href={`/dashboard/team/${teamId}/transforms`}>
              <Button variant="outline" className="w-full justify-start">
                <Image className="h-4 w-4 mr-2" />
                File Transforms
              </Button>
            </Link>
            <Link href={`/dashboard/team/${teamId}/usage`}>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Usage Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
