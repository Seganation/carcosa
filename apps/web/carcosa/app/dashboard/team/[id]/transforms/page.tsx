"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTeam } from "../../../../../contexts/team-context";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { CardDescription } from "../../../../../components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Image, ArrowLeft, Plus, Settings, Play, History } from "lucide-react";
import Link from "next/link";

export default function TeamTransformsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const { currentTeam, teams } = useTeam();
  const [team, setTeam] = useState<any>(null);
  const [transforms, setTransforms] = useState<any[]>([]);
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

        // TODO: Load team's transforms from API
        // For now, show placeholder data
        setTransforms([]);
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
          <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
            <h1 className="text-3xl font-bold">File Transforms</h1>
            <p className="text-muted-foreground">
              Process and transform files for {team.name}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300">
          Transforms
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Transform
            </CardTitle>
            <CardDescription>
              Set up a new file transformation pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Transform
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Run Transform
            </CardTitle>
            <CardDescription>
              Execute existing transformations on files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Play className="h-4 w-4 mr-2" />
              Execute
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Transform Settings
            </CardTitle>
            <CardDescription>
              Configure global transform options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transforms List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Active Transforms
          </CardTitle>
          <CardDescription>
            File transformation pipelines for your team's projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transforms.length > 0 ? (
            <div className="space-y-4">
              {/* Transform items would go here */}
            </div>
          ) : (
            <div className="text-center py-8">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transforms Yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first file transformation pipeline
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Transform
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transform History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transform History
          </CardTitle>
          <CardDescription>
            Recent file transformation operations and results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
            <p className="text-muted-foreground">
              Transform history will appear here after running transformations
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Transforms</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transforms.length}</div>
            <p className="text-xs text-muted-foreground">
              Running pipelines
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Processed</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Transform success
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
