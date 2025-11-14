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
import { Alert, AlertDescription } from "../ui/alert";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { apiBase, withAuth } from "@/lib/api";

interface ApiKey {
  id: string;
  label?: string;
}

interface RevokeApiKeyDialogProps {
  projectId: string;
  apiKey: ApiKey;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function RevokeApiKeyDialog({
  projectId,
  apiKey,
  onSuccess,
  trigger,
}: RevokeApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const displayName = apiKey.label || `API Key ${apiKey.id.slice(-8)}`;

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      const response = await fetch(
        `${apiBase()}/api/v1/projects/${projectId}/api-keys/${apiKey.id}`,
        {
          method: "DELETE",
          headers: withAuth(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to revoke API key");
      }

      toast.success("API key revoked successfully!");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke API key"
      );
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Revoke API Key
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The API key will be permanently revoked
            and cannot be used again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Revoking "{displayName}" will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Permanently invalidate the API key</li>
                <li>Immediately block all requests using this key</li>
                <li>Break any applications currently using it</li>
              </ul>
              <p className="mt-2">
                This action is irreversible. Consider regenerating the key
                instead if you just need to rotate credentials.
              </p>
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">
            If you want to keep the same permissions but change the key value,
            use the regenerate option instead.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isRevoking}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRevoke}
            disabled={isRevoking}
          >
            {isRevoking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Revoking...
              </>
            ) : (
              "Revoke Key"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
