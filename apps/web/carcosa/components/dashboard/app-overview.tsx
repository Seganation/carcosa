"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Database,
  TrendingUp,
  Files,
  Key,
  Activity,
  Users,
  Loader2,
} from "lucide-react";
import { projectsAPI } from "@/lib/projects-api";

interface AppOverviewProps {
  appId: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  multiTenant: boolean;
  bucket?: {
    id: string;
    name: string;
    provider: string;
    bucketName: string;
    region?: string;
    status: string;
  };
  _count?: {
    versions: number;
    tokens: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function AppOverview({ appId }: AppOverviewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProject();
  }, [appId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await projectsAPI.get(appId);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{error || "Project not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            {project.bucket && (
              <>
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  {project.bucket.bucketName}
                </div>
                <Badge
                  variant="secondary"
                  className={
                    project.bucket.provider === "r2"
                      ? "bg-orange-500/10 text-orange-500"
                      : "bg-blue-500/10 text-blue-500"
                  }
                >
                  {project.bucket.provider.toUpperCase()}
                </Badge>
              </>
            )}
            {project.multiTenant && (
              <Badge
                variant="secondary"
                className="bg-purple-500/10 text-purple-500"
              >
                <Users className="h-3 w-3 mr-1" />
                Multi-tenant
              </Badge>
            )}
          </div>
        </div>
        {project.bucket && (
          <Badge
            className={
              project.bucket.status === "connected"
                ? "bg-green-500/10 text-green-500 border-green-500/20"
                : project.bucket.status === "error"
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            }
          >
            {project.bucket.status}
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {project.bucket && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Storage Provider
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project.bucket.provider.toUpperCase()}
              </div>
              <p className="text-xs text-muted-foreground">
                {project.bucket.region
                  ? `${project.bucket.region} region`
                  : "Default region"}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project._count?.tokens || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Versions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project._count?.versions || 0}
            </div>
            <p className="text-xs text-muted-foreground">Project versions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tenant Support
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.multiTenant ? "Yes" : "No"}
            </div>
            <p className="text-xs text-muted-foreground">
              {project.multiTenant ? "Multi-tenant enabled" : "Single tenant"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Multi-tenant Info */}
      {project.multiTenant && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Users className="h-4 w-4" />
              Multi-tenant Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-700">
              This project supports multiple tenants. Each tenant will have
              their own isolated file storage and API access. You can manage
              tenants from the Tenants tab in the sidebar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Usage Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Usage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
            Usage chart coming soon
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Project created</span>
              <span className="text-muted-foreground">
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
            {project.multiTenant && (
              <div className="flex items-center justify-between text-sm">
                <span>Multi-tenant support enabled</span>
                <span className="text-muted-foreground">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {project.bucket && (
              <div className="flex items-center justify-between text-sm">
                <span>Bucket connected: {project.bucket.name}</span>
                <span className="text-muted-foreground">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
