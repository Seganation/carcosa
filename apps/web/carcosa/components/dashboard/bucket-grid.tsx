"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CardSkeleton } from "../ui/card-skeleton";
import {
  Database,
  CheckCircle,
  AlertCircle,
  Settings,
  Loader2,
  Trash2,
  Globe,
  HardDrive,
  ExternalLink,
  Users,
  Building2,
  Share2,
  Plus,
} from "lucide-react";
import { bucketsAPI, type Bucket } from "../../lib/buckets-api";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface BucketGridProps {
  buckets: Bucket[];
  loading: boolean;
  onUpdate: () => void;
  onCreateClick?: () => void;
}

export function BucketGrid({ buckets, loading, onUpdate, onCreateClick }: BucketGridProps) {
  const [validating, setValidating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleValidate = async (bucket: Bucket) => {
    setValidating(bucket.id);
    try {
      const result = await bucketsAPI.validate(bucket.id);
      if (result.ok) {
        toast.success(`Bucket connection verified using ${result.method}`);
      } else {
        toast.error(result.error || "Validation failed");
      }
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to validate bucket");
    } finally {
      setValidating(null);
    }
  };

  const handleDelete = async (bucket: Bucket) => {
    if (
      !confirm(
        `Are you sure you want to delete "${bucket.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(bucket.id);
    try {
      await bucketsAPI.delete(bucket.id);
      toast.success("Bucket deleted successfully");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete bucket");
    } finally {
      setDeleting(null);
    }
  };

  const handleCardClick = (bucketId: string) => {
    router.push(`/dashboard/buckets/${bucketId}`);
  };

  if (loading) {
    return <CardSkeleton count={3} showHeader showFooter />;
  }

  if (!buckets || buckets.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
            <Database className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No storage buckets yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Connect your first S3 or Cloudflare R2 bucket to start storing and
            managing files. Buckets provide scalable storage for your projects.
          </p>
          {onCreateClick && (
            <Button
              onClick={onCreateClick}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Bucket
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {buckets.map((bucket) => (
        <Card 
          key={bucket.id} 
          className="group relative overflow-hidden border-0 bg-gradient-to-br from-background to-muted/50 hover:from-muted/50 hover:to-muted transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer hover:ring-2 hover:ring-primary/20"
          onClick={() => handleCardClick(bucket.id)}
        >
          {/* Status indicator bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${
            bucket.status === "connected" 
              ? "bg-gradient-to-r from-emerald-400 to-emerald-600" 
              : bucket.status === "error" 
                ? "bg-gradient-to-r from-red-400 to-red-600"
                : "bg-gradient-to-r from-amber-400 to-amber-600"
          }`} />
          
          <CardHeader className="pb-4 pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  bucket.provider === "r2" 
                    ? "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400" 
                    : "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                }`}>
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {bucket.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-medium">
                    {bucket.bucketName}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {bucket.ownerTeam.organization.name}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {bucket.ownerTeam.name}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`font-medium ${
                    bucket.provider === "r2"
                      ? "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800"
                      : "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  }`}
                >
                  {bucket.provider.toUpperCase()}
                </Badge>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Status and info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 dark:bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    bucket.status === "connected" ? "bg-emerald-500" : 
                    bucket.status === "error" ? "bg-red-500" : "bg-amber-500"
                  }`} />
                  <span className="text-sm font-medium text-foreground">Status</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`font-medium ${
                    bucket.status === "connected"
                      ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : bucket.status === "error"
                        ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                        : "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  }`}
                >
                  {bucket.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 dark:bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Region</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {bucket.region || "auto"}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 dark:bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Projects</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {bucket._count.projects}
                </span>
              </div>
              
              {bucket.sharedTeams && bucket.sharedTeams.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted/30 dark:bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Shared</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-foreground">
                      {bucket.sharedTeams.length}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      team{bucket.sharedTeams.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Click hint */}
            <div className="text-center text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view details
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-background hover:bg-muted border-border hover:border-border text-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleValidate(bucket);
                }}
                disabled={validating === bucket.id}
              >
                {validating === bucket.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(bucket);
                }}
                disabled={deleting === bucket.id || bucket._count.projects > 0}
                className="bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                {deleting === bucket.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
