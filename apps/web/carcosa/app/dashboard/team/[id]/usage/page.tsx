"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTeam } from "../../../../../contexts/team-context";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { CardDescription } from "../../../../../components/ui/card";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { BarChart3, ArrowLeft, TrendingUp, Download, Upload, Database, Calendar } from "lucide-react";
import Link from "next/link";

export default function TeamUsagePage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const { currentTeam, teams } = useTeam();
  const [team, setTeam] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
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

        // TODO: Load team's usage data from API
        // For now, show placeholder data
        setUsageData({
          storage: { used: 0, total: 1000 },
          bandwidth: { upload: 0, download: 0 },
          requests: { total: 0, thisMonth: 0 },
          projects: { active: 0, total: 0 }
        });
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
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
            <h1 className="text-3xl font-bold">Usage Analytics</h1>
            <p className="text-muted-foreground">
              Monitor resource usage for {team.name}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
          Analytics
        </Badge>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Time Period
          </CardTitle>
          <CardDescription>
            Select the time range for usage analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Last 7 days</Button>
            <Button variant="outline" size="sm">Last 30 days</Button>
            <Button variant="outline" size="sm">Last 90 days</Button>
            <Button variant="outline" size="sm">This year</Button>
            <Button variant="outline" size="sm">Custom range</Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageData?.storage?.used || 0} MB
            </div>
            <p className="text-xs text-muted-foreground">
              of {usageData?.storage?.total || 1000} MB total
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${((usageData?.storage?.used || 0) / (usageData?.storage?.total || 1000)) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bandwidth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageData?.bandwidth?.upload || 0} MB
            </div>
            <p className="text-xs text-muted-foreground">
              Upload • {usageData?.bandwidth?.download || 0} MB Download
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageData?.requests?.thisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              This month • {usageData?.requests?.total || 0} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Badge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageData?.projects?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {usageData?.projects?.total || 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Activity
            </CardTitle>
            <CardDescription>
              File upload patterns over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto mb-2" />
                <p>Upload chart will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Activity
            </CardTitle>
            <CardDescription>
              File download patterns over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Download className="h-12 w-12 mx-auto mb-2" />
                <p>Download chart will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Project Usage Breakdown
          </CardTitle>
          <CardDescription>
            Resource usage by individual projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Project Data Yet</h3>
            <p>Project usage breakdown will appear here as you use the platform</p>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download usage reports and analytics data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
