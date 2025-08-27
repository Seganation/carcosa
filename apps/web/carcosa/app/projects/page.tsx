"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Plus, Database, Calendar, ExternalLink } from "lucide-react";

type Project = {
  id: string;
  name: string;
  slug: string;
  provider: string;
  createdAt: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${api}/api/v1/projects`);
        const data = await res.json();
        setProjects(data.projects ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">
            Manage your storage projects and buckets
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            No projects yet
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Create your first project to start uploading files to your S3 or R2
            bucket through Carcosa.
          </p>
          <Button asChild className="mt-4">
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-card border border-border rounded-xl p-6 hover:border-border/80 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-card-foreground mb-1">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    /{project.slug}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground">
                  <Database className="h-3 w-3" />
                  {project.provider.toUpperCase()}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Calendar className="h-3 w-3" />
                Created {new Date(project.createdAt).toLocaleDateString()}
              </div>

              <Button asChild variant="secondary" className="w-full">
                <Link href={`/projects/${project.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Project
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
