"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { 
  Users, 
  Plus, 
  Trash2, 
  Shield, 
  Eye, 
  Edit, 
  Crown,
  Building2,
  Share2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { bucketsAPI, type Bucket, type BucketTeamAccess, type Team } from "../../lib/buckets-api";
import { toast } from "react-hot-toast";

interface BucketSharingDialogProps {
  bucket: Bucket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function BucketSharingDialog({
  bucket,
  open,
  onOpenChange,
  onUpdate,
}: BucketSharingDialogProps) {
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<"READ_ONLY" | "READ_WRITE" | "ADMIN">("READ_WRITE");
  const [loading, setLoading] = useState(false);
  const [granting, setGranting] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (open && bucket) {
      loadAvailableTeams();
    }
  }, [open, bucket]);

  const loadAvailableTeams = async () => {
    if (!bucket) return;
    
    setLoading(true);
    try {
      const response = await bucketsAPI.getAvailableTeams(bucket.id);
      setAvailableTeams(response.teams);
    } catch (error: any) {
      toast.error(error.message || "Failed to load available teams");
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!bucket || !selectedTeamId) return;

    setGranting(true);
    try {
      await bucketsAPI.grantTeamAccess(bucket.id, selectedTeamId, selectedAccessLevel);
      toast.success("Team access granted successfully");
      setSelectedTeamId("");
      setSelectedAccessLevel("READ_WRITE");
      await loadAvailableTeams();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to grant team access");
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeAccess = async (teamId: string, teamName: string) => {
    if (!bucket) return;

    if (!confirm(`Are you sure you want to revoke access for "${teamName}"?`)) {
      return;
    }

    setRevoking(teamId);
    try {
      await bucketsAPI.revokeTeamAccess(bucket.id, teamId);
      toast.success("Team access revoked successfully");
      await loadAvailableTeams();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke team access");
    } finally {
      setRevoking(null);
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

  if (!bucket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Manage Bucket Sharing
          </DialogTitle>
          <DialogDescription>
            Control which teams can access <strong>{bucket.name}</strong> bucket.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bucket Owner Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="h-4 w-4 text-amber-500" />
                Bucket Owner
              </CardTitle>
              <CardDescription>
                This team owns and controls the bucket
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-muted/30 dark:bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{bucket.ownerTeam.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {bucket.ownerTeam.organization.name}
                    </div>
                  </div>
                </div>
                <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                  Owner
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Shared Teams */}
          {bucket.sharedTeams && bucket.sharedTeams.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Shared Teams ({bucket.sharedTeams.length})
                </CardTitle>
                <CardDescription>
                  Teams with access to this bucket
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bucket.sharedTeams.map((access) => (
                  <div
                    key={access.id}
                    className="flex items-center justify-between p-3 bg-muted/30 dark:bg-muted/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{access.team.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {access.team.organization?.name || 'Unknown Organization'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`flex items-center gap-1 ${getAccessLevelColor(access.accessLevel)}`}
                      >
                        {getAccessLevelIcon(access.accessLevel)}
                        {access.accessLevel.replace('_', ' ')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeAccess(access.teamId, access.team.name)}
                        disabled={revoking === access.teamId}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Grant New Access */}
          {availableTeams.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4" />
                  Grant Team Access
                </CardTitle>
                <CardDescription>
                  Add another team to this bucket
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Team</label>
                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{team.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Access Level</label>
                    <Select value={selectedAccessLevel} onValueChange={(value: any) => setSelectedAccessLevel(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="READ_ONLY">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span>Read Only</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="READ_WRITE">
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            <span>Read Write</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            <span>Admin</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleGrantAccess}
                  disabled={!selectedTeamId || granting}
                  className="w-full"
                >
                  {granting ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                      Granting Access...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Grant Access
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* No Teams Available */}
          {!loading && availableTeams.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All Teams Have Access</h3>
                <p className="text-muted-foreground">
                  This bucket is already shared with all teams in the organization.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
