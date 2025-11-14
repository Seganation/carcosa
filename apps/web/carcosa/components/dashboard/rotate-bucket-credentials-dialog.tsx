"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { RefreshCw, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
import { bucketsAPI } from "@/lib/buckets-api";

interface Bucket {
  id: string;
  name: string;
  provider: string;
}

interface RotateBucketCredentialsDialogProps {
  bucket: Bucket;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function RotateBucketCredentialsDialog({
  bucket,
  onSuccess,
  trigger,
}: RotateBucketCredentialsDialogProps) {
  const [open, setOpen] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const handleRotate = async () => {
    if (!accessKey || !secretKey) {
      toast.error("Both access key and secret key are required");
      return;
    }

    setIsRotating(true);
    try {
      const result = await bucketsAPI.rotateCredentials(
        bucket.id,
        accessKey,
        secretKey
      );

      toast.success(
        result.message ||
          "Credentials rotated successfully! Please validate the connection."
      );
      setOpen(false);
      setAccessKey("");
      setSecretKey("");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to rotate credentials:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to rotate credentials"
      );
    } finally {
      setIsRotating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setAccessKey("");
      setSecretKey("");
      setShowSecretKey(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Rotate Credentials
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Rotate Bucket Credentials
          </DialogTitle>
          <DialogDescription>
            Update the access credentials for this bucket connection. The bucket
            status will be reset to pending after rotation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Rotating credentials will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Replace the current credentials with new ones</li>
                <li>Reset the bucket status to "pending"</li>
                <li>Require connection validation after rotation</li>
              </ul>
              <p className="mt-2">
                Make sure you have generated new credentials in your storage provider
                before proceeding.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="accessKey">
              New Access Key ID
              {bucket.provider === "r2" && " (Cloudflare R2)"}
              {bucket.provider === "s3" && " (AWS S3)"}
            </Label>
            <Input
              id="accessKey"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="Enter new access key"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretKey">New Secret Access Key</Label>
            <div className="relative">
              <Input
                id="secretKey"
                type={showSecretKey ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter new secret key"
                required
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showSecretKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>After Rotation:</strong> You will need to validate the new
              credentials using the "Validate Connection" button to ensure everything
              is working correctly.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isRotating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleRotate}
            disabled={!accessKey || !secretKey || isRotating}
          >
            {isRotating ? "Rotating..." : "Rotate Credentials"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
