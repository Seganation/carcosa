"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent } from "../ui/card";
import { Database, Eye, EyeOff } from "lucide-react";
import { bucketsAPI } from "@/lib/buckets-api";
import { useTeam } from "../../contexts/team-context";

interface CreateBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateBucketDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateBucketDialogProps) {
  const [provider, setProvider] = useState<"s3" | "r2" | "">("");
  const [bucketName, setBucketName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [region, setRegion] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { currentTeam } = useTeam();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTeam) {
      toast.error("Please select a team first");
      return;
    }
    
    setIsConnecting(true);

    try {
      await bucketsAPI.create({
        name: displayName || bucketName,
        provider: provider as "s3" | "r2",
        bucketName,
        region: region || undefined,
        endpoint: endpoint || undefined,
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      }, currentTeam.id);

      toast.success("Bucket connected successfully!");
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Failed to connect bucket:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to connect bucket"
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const resetForm = () => {
    setProvider("");
    setBucketName("");
    setDisplayName("");
    setRegion("");
    setAccessKey("");
    setSecretKey("");
    setEndpoint("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Connect Storage Bucket</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Connect your S3-compatible storage bucket to start uploading files.
            {currentTeam && (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">Team Owner:</span> This bucket will be owned by <strong>{currentTeam.name}</strong> team and can be shared with other teams later.
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Storage Provider</Label>
            <Select
              value={provider}
              onValueChange={(value: "s3" | "r2") => setProvider(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select storage provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="r2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-orange-500" />
                    <span>Cloudflare R2</span>
                  </div>
                </SelectItem>
                <SelectItem value="s3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <span>Amazon S3</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {provider && (
            <Card className="border-border">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name (Optional)</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="My Production Bucket"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bucketName">Bucket Name</Label>
                  <Input
                    id="bucketName"
                    value={bucketName}
                    onChange={(e) => setBucketName(e.target.value)}
                    placeholder="my-bucket-name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder={provider === "r2" ? "auto" : "us-east-1"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessKey">Access Key ID</Label>
                  <Input
                    id="accessKey"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="AKIA..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Access Key</Label>
                  <div className="relative">
                    <Input
                      id="secretKey"
                      type={showSecretKey ? "text" : "password"}
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="••••••••••••••••"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                    >
                      {showSecretKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {provider === "r2" && (
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Endpoint (Optional)</Label>
                    <Input
                      id="endpoint"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="https://your-account-id.r2.cloudflarestorage.com"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !provider ||
                !bucketName ||
                !region ||
                !accessKey ||
                !secretKey ||
                isConnecting
              }
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {isConnecting ? "Connecting..." : "Connect Bucket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
