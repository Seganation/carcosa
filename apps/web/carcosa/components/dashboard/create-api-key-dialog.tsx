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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Copy, CheckCircle, Loader2 } from "lucide-react";
import { apiBase, withAuth } from "@/lib/api";
import { createApiKeySchema } from "@/lib/validations/api-keys.validation";

interface CreateApiKeyDialogProps {
  projectId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateApiKeyDialog({
  projectId,
  onSuccess,
  trigger,
}: CreateApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    permissions: ["files:read", "files:write"],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const parsed = createApiKeySchema.safeParse({
      label: formData.label.trim() || undefined,
      permissions: formData.permissions,
    });

    if (!parsed.success) {
      const zodErrors: Record<string, string> = {};
      for (const err of parsed.error.issues) {
        if (err.path && err.path.length) {
          zodErrors[String(err.path[0])] = err.message;
        }
      }
      setErrors(zodErrors);
      toast.error("Please fix validation errors");
      return;
    }

    setErrors({});
    setIsCreating(true);
    try {
      const payload = {
        label: formData.label.trim() || undefined,
        permissions: formData.permissions,
      };
      console.log("Sending API key create request:", payload);

      const response = await fetch(
        `${apiBase()}/api/v1/projects/${projectId}/api-keys`,
        {
          method: "POST",
          headers: { ...withAuth(), "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("API Key creation failed:", error);
        if (error.details) {
          console.error("Validation details:", error.details);
        }
        throw new Error(error.error || "Failed to create API key");
      }

      const data = await response.json();
      setNewlyCreatedKey(data.apiKey);

      // Store in localStorage for Quick Copy feature
      if (data.apiKey) {
        localStorage.setItem(
          `carcosa_project_${projectId}_api_key_${data.apiKeyRecord.id}`,
          data.apiKey
        );
      }

      setOpen(false);
      setFormData({ label: "", permissions: ["files:read", "files:write"] });
      onSuccess?.();
      toast.success("API key created successfully!");
    } catch (error) {
      console.error("Failed to create API key:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create API key"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setFormData({ label: "", permissions: ["files:read", "files:write"] });
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
      <Dialog
        open={!!newlyCreatedKey}
        onOpenChange={() => setNewlyCreatedKey(null)}
      >
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle
                className="h-5 w-5 text-green-600"
                aria-hidden="true"
              />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Your new API key has been created. Copy it now - you won't be able
              to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-key">API Key</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="new-key"
                  value={newlyCreatedKey}
                  readOnly
                  className="font-mono text-sm"
                  aria-label="Your new API key"
                />
                <Button
                  onClick={() => copyToClipboard(newlyCreatedKey)}
                  size="icon"
                  variant="outline"
                  aria-label="Copy API key to clipboard"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
              role="alert"
            >
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Store this key securely. You won't be
                able to view it again.
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Create API Key
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
          <DialogDescription>
            Create a new API key with specific permissions for your application.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKeyLabel">Label (Optional)</Label>
            <Input
              id="apiKeyLabel"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              placeholder="e.g., Production Key, Development Key"
              aria-describedby="apiKeyLabelHelp"
            />
            <p id="apiKeyLabelHelp" className="text-xs text-muted-foreground">
              A friendly name to help you identify this key
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKeyPermissions">Permissions</Label>
            <Select
              value={formData.permissions.join(",")}
              onValueChange={(value) =>
                setFormData({ ...formData, permissions: value.split(",") })
              }
            >
              <SelectTrigger
                id="apiKeyPermissions"
                aria-describedby="apiKeyPermissionsHelp"
              >
                <SelectValue placeholder="Select permissions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="files:read,files:write">
                  Read & Write
                </SelectItem>
                <SelectItem value="files:read">Read Only</SelectItem>
                <SelectItem value="files:read,files:write,files:delete">
                  Read, Write & Delete
                </SelectItem>
                <SelectItem value="*">Full Access (Admin)</SelectItem>
              </SelectContent>
            </Select>
            <p
              id="apiKeyPermissionsHelp"
              className="text-xs text-muted-foreground"
            >
              Controls what actions this API key can perform
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2
                    className="h-4 w-4 mr-2 animate-spin"
                    aria-hidden="true"
                  />
                  Creating...
                </>
              ) : (
                "Create Key"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
