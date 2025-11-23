"use client";

import { useState, useEffect } from "react";
import { useTeam } from "../../../contexts/team-context";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { CardDescription } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Box,
  Users,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Calendar,
  Database,
  Activity
} from "lucide-react";
import Link from "next/link";

import { projectsAPI } from "../../../lib/projects-api";
import { CreateProjectDialog } from "../../../components/dashboard/create-project-dialog";

export default function AppsPage() {
  const { currentTeam, teams } = useTeam();

  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);


  useEffect(() => {
    const loadProjects = async () => {
      if (!currentTeam) return;
      
      try {
        setLoading(true);
        const response = await projectsAPI.list();
        const projectsWithTeams = response.projects?.map((project: any) => {
          // Find which team this project belongs to
          const team = teams.find(t => t.id === project.teamId);
          return {
            ...project,
            team: team || null
          };
        }) || [];
        
        setProjects(projectsWithTeams);
        setFilteredProjects(projectsWithTeams);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [currentTeam, teams]);

  useEffect(() => {
    let filtered = projects;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by team
    if (selectedTeam !== "all") {
      filtered = filtered.filter(project => project.teamId === selectedTeam);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, selectedTeam]);

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Organization Selected</h2>
          <p className="text-muted-foreground">
            Please select an organization and team to get started.
          </p>
        </div>
      </div>
    );
  }

  const getTeamBadgeVariant = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return "secondary";
    
    // Assign different colors based on team
    const teamColors: { [key: string]: string } = {
      "dev-team": "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
      "design-team": "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300",
      "qa-team": "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300",
      "marketing-team": "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300"
    };
    
    return teamColors[team.slug] || "bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Applications & Projects</h1>
          <p className="text-muted-foreground">
            All projects across {currentTeam.organization.name}
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
          {filteredProjects.length} Project{filteredProjects.length !== 1 ? 's' : ''}
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
            Find and filter projects across all teams
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="all">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/app/${project.id}`}
              className="block"
            >
              <Card
                className={`group relative overflow-hidden border-0 bg-gradient-to-br from-background to-muted/50 hover:from-muted/50 hover:to-muted transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer hover:ring-2 hover:ring-primary/20`}
              >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
                </div>
                {project.team && (
                  <Badge 
                    className={getTeamBadgeVariant(project.team.id)}
                    variant="secondary"
                  >
                    {project.team.name}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {project.slug}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {project.multiTenant && (
                    <Badge variant="outline" className="text-xs">
                      Multi-tenant
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      <span>Bucket</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span>API</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Click to open</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <Box className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || selectedTeam !== "all" ? "No Projects Found" : "No Projects Yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {searchTerm || selectedTeam !== "all"
                ? "Try adjusting your search or filter criteria to find what you're looking for."
                : "Create your first project to start building. Projects organize your files, API keys, and settings."
              }
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all teams
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(projects.map(p => p.teamId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              With projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Multi-tenant</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.multiTenant).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Multi-tenant apps
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => {
                const daysSinceCreation = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                return daysSinceCreation <= 30;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          // Reload projects after creating a new one
          const loadProjects = async () => {
            try {
              const response = await projectsAPI.list();
              const projectsWithTeams = response.projects?.map((project: any) => {
                const team = teams.find(t => t.id === project.teamId);
                return {
                  ...project,
                  team: team || null
                };
              }) || [];

              setProjects(projectsWithTeams);
              setFilteredProjects(projectsWithTeams);
            } catch (error) {
              console.error("Failed to reload projects:", error);
            }
          };
          loadProjects();
        }}
      />
    </div>
  );
}
