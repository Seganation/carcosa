"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTeam } from "../../../../../contexts/team-context";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { CardDescription } from "../../../../../components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Users, ArrowLeft, Plus, Search, Filter } from "lucide-react";
import Link from "next/link";

export default function TeamTenantsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const { currentTeam, teams } = useTeam();
  const [team, setTeam] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
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

        // TODO: Load team's tenants from API
        // For now, show placeholder data
        setTenants([]);
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
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/team/${teamId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Team
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Multi-tenant Data</h1>
            <p className="text-muted-foreground">
              Manage tenant data for {team.name}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300">
          Tenants
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
          <CardDescription>
            Find and manage tenant data across your team's projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tenants..."
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Tenant
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tenants List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tenants
          </CardTitle>
          <CardDescription>
            All tenant data across your team's projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length > 0 ? (
            <div className="space-y-4">
              {/* Tenant items would go here */}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tenants Yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first tenant or importing existing data
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Tenant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              With tenant data
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Usage</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 MB</div>
            <p className="text-xs text-muted-foreground">
              Total tenant data
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
