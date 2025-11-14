"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import {
  ArrowLeft,
  Database,
  Settings,
  Share2,
  Globe,
  HardDrive,
  Building2,
  Users,
  Crown,
  Eye,
  Edit,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";
import { bucketsAPI, type Bucket } from "../../../../lib/buckets-api";
import { BucketSharingDialog } from "../../../../components/dashboard/bucket-sharing-dialog";
import { EditBucketDialog } from "../../../../components/dashboard/edit-bucket-dialog";
import { DeleteBucketDialog } from "../../../../components/dashboard/delete-bucket-dialog";
import { RotateBucketCredentialsDialog } from "../../../../components/dashboard/rotate-bucket-credentials-dialog";
import { toast } from "react-hot-toast";

export default function BucketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [bucket, setBucket] = useState<Bucket | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [sharingDialogOpen, setSharingDialogOpen] = useState(false);

  const bucketId = params.id as string;

  useEffect(() => {
    if (bucketId) {
      loadBucket();
    }
  }, [bucketId]);

  const loadBucket = async () => {
    setLoading(true);
    try {
      const bucketData = await bucketsAPI.get(bucketId);
      setBucket(bucketData);
    } catch (error: any) {
      toast.error(error.message || "Failed to load bucket");
      router.push("/dashboard/buckets");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!bucket) return;
    
    setValidating(true);
    try {
      const result = await bucketsAPI.validate(bucket.id);
      if (result.ok) {
        toast.success(`Bucket connection verified using ${result.method}`);
        await loadBucket();
      } else {
        toast.error(result.error || "Validation failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to validate bucket");
    } finally {
      setValidating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "error":
        return "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
      default:
        return "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case "READ_ONLY":
        return <Eye className="h-4 w-4" />;
      case "READ_WRITE":
        return <Edit className="h-4 w-4" />;
      case "ADMIN":
        return <Crown className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "READ_ONLY":
        return "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "READ_WRITE":
        return "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
      case "ADMIN":
        return "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      default:
        return "bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!bucket) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Bucket Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The bucket you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/dashboard/buckets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Buckets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/buckets")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Buckets
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{bucket.name}</h1>
            <p className="text-muted-foreground">{bucket.bucketName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={validating}
          >
            {validating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          <EditBucketDialog
            bucket={bucket}
            onSuccess={loadBucket}
          />
          <RotateBucketCredentialsDialog
            bucket={bucket}
            onSuccess={loadBucket}
          />
          <Button onClick={() => setSharingDialogOpen(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Manage Sharing
          </Button>
          <DeleteBucketDialog
            bucket={bucket}
            onSuccess={() => router.push("/dashboard/buckets")}
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Bucket Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Bucket Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Provider</span>
              <Badge
                variant="secondary"
                className={
                  bucket.provider === "r2"
                    ? "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800"
                    : "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                }
              >
                {bucket.provider.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant="secondary" className={getStatusColor(bucket.status)}>
                {bucket.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Region</span>
              <span className="text-sm">{bucket.region || "auto"}</span>
            </div>
            {bucket.endpoint && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Endpoint</span>
                <span className="text-sm truncate max-w-48" title={bucket.endpoint}>
                  {bucket.endpoint}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owner Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Bucket Owner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{bucket.ownerTeam.organization.name}</div>
                <div className="text-sm text-muted-foreground">Organization</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{bucket.ownerTeam.name}</div>
                <div className="text-sm text-muted-foreground">Owning Team</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Projects</span>
              <span className="text-2xl font-bold">{bucket._count.projects}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Shared Teams</span>
              <span className="text-2xl font-bold">
                {bucket.sharedTeams ? bucket.sharedTeams.length : 0}
              </span>
            </div>
            {bucket.lastChecked && (
              <div>
                <span className="text-sm font-medium">Last Checked</span>
                <div className="text-sm text-muted-foreground">
                  {new Date(bucket.lastChecked).toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shared Teams */}
      {bucket.sharedTeams && bucket.sharedTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Shared Teams ({bucket.sharedTeams.length})
            </CardTitle>
            <CardDescription>
              Teams that have access to this bucket
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bucket.sharedTeams.map((access) => (
                <Card key={access.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{access.team.name}</span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`flex items-center gap-1 ${getAccessLevelColor(access.accessLevel)}`}
                      >
                        {getAccessLevelIcon(access.accessLevel)}
                        {access.accessLevel.replace('_', ' ')}
                      </Badge>
                    </div>
                    {access.team.organization && (
                      <div className="text-sm text-muted-foreground">
                        {access.team.organization.name}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      Added {new Date(access.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Using This Bucket */}
      {bucket.projects && bucket.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Projects Using This Bucket ({bucket.projects.length})
            </CardTitle>
            <CardDescription>
              Applications and projects connected to this storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bucket.projects.map((project) => (
                <div
                  key={project.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/app/${project.id}`)}
                >
                  <Card className="border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{project.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {project.slug}
                      </div>
                      {project.team && (
                        <div className="flex items-center gap-1 mt-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {project.team.name}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bucket Sharing Dialog */}
      <BucketSharingDialog
        bucket={bucket}
        open={sharingDialogOpen}
        onOpenChange={setSharingDialogOpen}
        onUpdate={loadBucket}
      />
    </div>
  );
}