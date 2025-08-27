"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Database, Loader2, TrendingUp, Users, Calendar, Code, Key } from "lucide-react";
import { projectsAPI, type Project } from "../../lib/projects-api";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface AppGridProps {
  onUpdate: () => void;
}

export function AppGrid({ onUpdate }: AppGridProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      const { projects: data } = await projectsAPI.list();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          No projects yet. Create your first app to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/dashboard/app/${project.id}`}>
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-background to-muted/50 hover:from-muted/50 hover:to-muted transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
            {/* Multi-tenant indicator bar */}
            {project.multiTenant && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
            )}
            
            <CardHeader className="pb-4 pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    project.bucket?.provider === "r2" 
                      ? "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400" 
                      : "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                  }`}>
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {project.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-medium">
                      {project.bucket ? project.bucket.bucketName : "No bucket"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {project.multiTenant && (
                    <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-medium">
                      <Users className="h-3 w-3 mr-1" />
                      Multi
                    </Badge>
                  )}
                  {project.bucket && (
                    <Badge
                      variant="secondary"
                      className={`font-medium ${
                        project.bucket.provider === "r2"
                          ? "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800"
                          : "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      {project.bucket.provider.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Project stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 dark:bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Versions</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {project._count?.versions || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/30 dark:bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Tokens</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-sm font-semibold text-foreground">
                      {project._count?.tokens || 0}
                    </span>
                  </div>
                </div>
                
                {project.multiTenant && (
                  <div className="flex items-center justify-between p-3 bg-muted/30 dark:bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Tenant Support</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-sm font-semibold text-foreground">Enabled</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Creation date */}
              <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
