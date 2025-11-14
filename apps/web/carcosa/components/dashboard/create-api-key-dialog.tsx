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
    permissions: ["read", "write"],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsCreating(true);
    try {
      const response = await fetch(
        `${apiBase()}/api/v1/projects/${projectId}/api-keys`,
        {
          method: "POST",
          headers: { ...withAuth(), "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            label: formData.label.trim() || undefined,
            permissions: formData.permissions,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create API key");
      }

      const data = await response.json();
      setNewlyCreatedKey(data.apiKey);
      setOpen(false);
      setFormData({ label: "", permissions: ["read", "write"] });
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
      setFormData({ label: "", permissions: ["read", "write"] });
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
                to view it again.
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
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
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
            />
            <p className="text-xs text-muted-foreground">
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
              <SelectTrigger id="apiKeyPermissions">
                <SelectValue placeholder="Select permissions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read,write">Read & Write</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
                <SelectItem value="read,write,delete">
                  Read, Write & Delete
                </SelectItem>
                <SelectItem value="read,write,delete,admin">
                  Full Access (Admin)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Controls what actions this API key can perform
            </p>
          </div>

          <div className="flex gap-3 pt-4">
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
