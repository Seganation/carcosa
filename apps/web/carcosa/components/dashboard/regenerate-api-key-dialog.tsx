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
import { RefreshCw, Copy, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { apiBase, withAuth } from "@/lib/api";

interface ApiKey {
  id: string;
  label?: string;
}

interface RegenerateApiKeyDialogProps {
  projectId: string;
  apiKey: ApiKey;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function RegenerateApiKeyDialog({
  projectId,
  apiKey,
  onSuccess,
  trigger,
}: RegenerateApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const displayName = apiKey.label || `API Key ${apiKey.id.slice(-8)}`;

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const response = await fetch(
        `${apiBase()}/api/v1/projects/${projectId}/api-keys/${apiKey.id}/regenerate`,
        {
          method: "POST",
          headers: withAuth(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to regenerate API key");
      }

      const data = await response.json();
      setNewlyCreatedKey(data.apiKey);
      setOpen(false);
      onSuccess?.();
      toast.success("API key regenerated successfully!");
    } catch (error) {
      console.error("Failed to regenerate API key:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to regenerate API key"
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("API key copied to clipboard");
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("API key copied to clipboard");
    }
  };

  // Show newly created key dialog
  if (newlyCreatedKey) {
    return (
      <Dialog open={!!newlyCreatedKey} onOpenChange={() => setNewlyCreatedKey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              API Key Regenerated
            </DialogTitle>
            <DialogDescription>
              Your API key has been regenerated. Copy it now - you won't be able
              to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-key">New API Key</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="new-key"
                  value={newlyCreatedKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={() => copyToClipboard(newlyCreatedKey)}
                  size="icon"
                  variant="outline"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Store this key securely. You won't be able
                to view it again. The old key is now invalid.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewlyCreatedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Regenerate API Key
          </DialogTitle>
          <DialogDescription>
            This will create a new API key and invalidate the old one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Regenerating "{displayName}" will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Immediately invalidate the current key</li>
                <li>Create a new key with the same permissions</li>
                <li>Break any applications currently using the old key</li>
              </ul>
              <p className="mt-2">
                Make sure to update any applications using this key after
                regeneration.
              </p>
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">
            You will be shown the new key once - make sure to copy and store it
            securely.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isRegenerating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              "Regenerate Key"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
