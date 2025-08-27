"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, RefreshCw, Trash2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

interface ApiKey {
  id: string;
  label?: string;
  permissions: string[];
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
  project: {
    id: string;
    name: string;
    slug: string;
  };
}

interface CreateApiKeyData {
  label?: string;
  permissions: string[];
}

export default function ApiKeysManager({ projectId }: { projectId: string }) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createData, setCreateData] = useState<CreateApiKeyData>({
    label: "",
    permissions: ["read", "write"],
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (projectId) {
      loadApiKeys();
    }
  }, [projectId]);

  const loadApiKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/projects/${projectId}/api-keys`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys || []);
      } else {
        console.error("Failed to load API keys");
        toast.error("Failed to load API keys");
      }
    } catch (error) {
      console.error("Error loading API keys:", error);
              toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/projects/${projectId}/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(createData),
      });

      if (response.ok) {
        const data = await response.json();
        setShowNewKey(data.apiKey);
        setCreateDialogOpen(false);
        setCreateData({ label: "", permissions: ["read", "write"] });
        loadApiKeys();
        toast.success("API key created successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
              toast.error("Failed to create API key");
    } finally {
      setLoading(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/projects/${projectId}/api-keys/${keyId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        loadApiKeys();
        toast.success("API key revoked successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to revoke API key");
      }
    } catch (error) {
      console.error("Error revoking API key:", error);
              toast.error("Failed to revoke API key");
    } finally {
      setLoading(false);
    }
  };

  const regenerateApiKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to regenerate this API key? The old key will be revoked.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/projects/${projectId}/api-keys/${keyId}/regenerate`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setShowNewKey(data.apiKey);
        loadApiKeys();
        toast.success("API key regenerated successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to regenerate API key");
      }
    } catch (error) {
      console.error("Error regenerating API key:", error);
              toast.error("Failed to regenerate API key");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("API key copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy API key");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case "read":
        return "bg-blue-100 text-blue-800";
      case "write":
        return "bg-green-100 text-green-800";
      case "delete":
        return "bg-red-100 text-red-800";
      case "admin":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">
            Manage API keys for your project. These keys allow external applications to access your project.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key with specific permissions. The key will only be shown once.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  placeholder="e.g., Production API Key"
                  value={createData.label}
                  onChange={(e) => setCreateData({ ...createData, label: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="permissions">Permissions</Label>
                <Select
                  value={createData.permissions.join(",")}
                  onValueChange={(value) => setCreateData({ ...createData, permissions: value.split(",") })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="read,write">Read & Write</SelectItem>
                    <SelectItem value="read,write,delete">Read, Write & Delete</SelectItem>
                    <SelectItem value="read,write,delete,admin">Full Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createApiKey} disabled={loading}>
                {loading ? "Creating..." : "Create API Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* New Key Display */}
      {showNewKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">New API Key Created!</CardTitle>
            <CardDescription className="text-green-700">
              Copy this key now. It won't be shown again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input
                value={showNewKey}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                size="sm"
                onClick={() => copyToClipboard(showNewKey)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setShowNewKey(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No API keys found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first API key to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((key) => (
            <Card key={key.id} className={key.revokedAt ? "opacity-60" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">
                        {key.label || "Unnamed API Key"}
                      </h3>
                      {key.revokedAt && (
                        <Badge variant="secondary">Revoked</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {key.permissions.map((permission) => (
                        <Badge
                          key={permission}
                          variant="outline"
                          className={getPermissionColor(permission)}
                        >
                          {permission}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Created: {formatDate(key.createdAt)}</p>
                      {key.lastUsedAt && (
                        <p>Last used: {formatDate(key.lastUsedAt)}</p>
                      )}
                      {key.revokedAt && (
                        <p>Revoked: {formatDate(key.revokedAt)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!key.revokedAt && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateApiKey(key.id)}
                          disabled={loading}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeApiKey(key.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
