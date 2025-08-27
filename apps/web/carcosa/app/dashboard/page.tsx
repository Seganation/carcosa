"use client";

import { useState, useEffect } from "react";
import { useTeam } from "../../contexts/team-context";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Building2,
  Users,
  Database,
  Box,
  BarChart3,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { bucketsAPI } from "../../lib/buckets-api";
import { projectsAPI } from "../../lib/projects-api";

export default function DashboardPage() {
  const { currentTeam, teams, organizations } = useTeam();
  const [stats, setStats] = useState({
    buckets: 0,
    projects: 0,
    totalTeams: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!currentTeam) return;
      
      try {
        setLoading(true);
        const [bucketsResponse, projectsResponse] = await Promise.all([
          bucketsAPI.list(),
          projectsAPI.list(),
        ]);
        
        setStats({
          buckets: bucketsResponse.buckets?.length || 0,
          projects: projectsResponse.projects?.length || 0,
          totalTeams: teams.length,
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [currentTeam, teams]);

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Organization Selected</h2>
          <p className="text-muted-foreground">
            Please select an organization and team to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{currentTeam.organization.name}</h1>
          <p className="text-muted-foreground">
            Organization overview and management
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
          Organization
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
            <p className="text-xs text-muted-foreground">
              Active teams in organization
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Buckets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.buckets}</div>
            <p className="text-xs text-muted-foreground">
              Connected storage buckets
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.projects}</div>
            <p className="text-xs text-muted-foreground">
              Across all teams
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{currentTeam.name}</div>
            <p className="text-xs text-muted-foreground">
              Active workspace
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teams Management
            </CardTitle>
            <CardDescription>
              View and manage teams within your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {teams.slice(0, 3).map((team) => (
                <div key={team.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{team.name}</span>
                    {team.id === currentTeam.id && (
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <Link href={`/dashboard/team/${team.id}`}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Link href="/dashboard/apps">
                <Button variant="outline" className="w-full">
                  <Box className="h-4 w-4 mr-2" />
                  View All Apps
                </Button>
              </Link>
              <Link href="/dashboard/teams">
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  View All Teams
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage & Infrastructure
            </CardTitle>
            <CardDescription>
              Manage organization-level storage buckets and infrastructure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{loading ? "..." : stats.buckets}</div>
                <div className="text-sm text-muted-foreground">Buckets</div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{loading ? "..." : stats.projects}</div>
                <div className="text-sm text-muted-foreground">Projects</div>
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/dashboard/buckets">
                <Button variant="outline" className="w-full">
                  Manage Buckets
                </Button>
              </Link>
              <Link href="/dashboard/usage">
                <Button variant="outline" className="w-full">
                  View Usage Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Team Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            Current Team: {currentTeam.name}
          </CardTitle>
          <CardDescription>
            Quick access to your active team's resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href={`/dashboard/team/${currentTeam.id}`}>
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                <Box className="h-6 w-6" />
                <span>Team Projects</span>
                <span className="text-xs text-muted-foreground">View apps & projects</span>
              </Button>
            </Link>
            <Link href={`/dashboard/team/${currentTeam.id}/tenants`}>
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span>Tenants</span>
                <span className="text-xs text-muted-foreground">Multi-tenant data</span>
              </Button>
            </Link>
            <Link href={`/dashboard/team/${currentTeam.id}/transforms`}>
              <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                <span>Transforms</span>
                <span className="text-xs text-muted-foreground">File processing</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
