"use client";

import { useState, useEffect } from "react";
import { useTeam } from "../../../contexts/team-context";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { CardDescription } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Users, Building2, Plus, ArrowRight, Settings } from "lucide-react";
import Link from "next/link";

export default function TeamsPage() {
  const { currentTeam, teams, organizations } = useTeam();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teams.length > 0) {
      setLoading(false);
    }
  }, [teams]);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">
            Manage teams within {currentTeam.organization.name}
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
          {teams.length} Team{teams.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card
            key={team.id}
            className={`group relative overflow-hidden border-0 bg-gradient-to-br from-background to-muted/50 hover:from-muted/50 hover:to-muted transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
              team.id === currentTeam.id ? 'ring-2 ring-primary/20' : ''
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold">{team.name}</CardTitle>
              </div>
              {team.id === currentTeam.id && (
                <Badge variant="secondary" className="text-xs">Current</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {team.description || "No description provided"}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{team._count.members} member{team._count.members !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{team._count.projects} project{team._count.projects !== 1 ? 's' : ''}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Link href={`/dashboard/team/${team.id}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    View Team
                  </Button>
                </Link>
                {team.id === currentTeam.id && (
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Team Section */}
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Team
          </CardTitle>
          <CardDescription>
            Add a new team to organize your projects and collaborate with different groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
