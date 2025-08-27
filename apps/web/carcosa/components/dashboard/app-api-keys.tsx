"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Key, Plus, MoreHorizontal, Copy, Eye, EyeOff, Trash2, RefreshCw, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface AppApiKeysProps {
  appId: string;
}

interface ApiKey {
  id: string;
  label?: string;
  permissions: string[];
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
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

export function AppApiKeys({ appId }: AppApiKeysProps) {

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState<string | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<CreateApiKeyData>({
    label: "",
    permissions: ["read", "write"],
  });
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Fetch API keys on component mount
  useEffect(() => {
    fetchApiKeys();
  }, [appId]);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('carcosa_token');
      const response = await fetch(`http://localhost:4000/api/v1/projects/${appId}/api-keys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch API keys: ${response.statusText}`);
      }
      
      const data = await response.json();
      setApiKeys(data.apiKeys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys');
      toast.error("Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    try {
      setIsCreating(true);
      
      const token = localStorage.getItem('carcosa_token');
      const response = await fetch(`http://localhost:4000/api/v1/projects/${appId}/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newApiKey),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create API key: ${response.statusText}`);
      }
      
      const data = await response.json();
      setNewlyCreatedKey(data.apiKey);
      setShowCreateDialog(false);
      setNewApiKey({ label: "", permissions: ["read", "write"] });
      
      // Refresh the list
      await fetchApiKeys();
      
      toast.success("API key created successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const regenerateApiKey = async (keyId: string) => {
    try {
      setIsRegenerating(true);
      
      const token = localStorage.getItem('carcosa_token');
      const response = await fetch(`http://localhost:4000/api/v1/projects/${appId}/api-keys/${keyId}/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to regenerate API key: ${response.statusText}`);
      }
      
      const data = await response.json();
      setNewlyCreatedKey(data.apiKey);
      setShowRegenerateDialog(null);
      
      // Refresh the list
      await fetchApiKeys();
      
      toast.success("API key regenerated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate API key');
    } finally {
      setIsRegenerating(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      setIsRevoking(true);
      
      const token = localStorage.getItem('carcosa_token');
      const response = await fetch(`http://localhost:4000/api/v1/projects/${appId}/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to revoke API key: ${response.statusText}`);
      }
      
      setShowRevokeDialog(null);
      
      // Refresh the list
      await fetchApiKeys();
      
      toast.success("API key revoked successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke API key');
    } finally {
      setIsRevoking(false);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("API key copied to clipboard");
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success("API key copied to clipboard");
    }
  };

  const maskKey = (key: string) => {
    if (!key) return "••••••••••••••••";
    const prefix = key.split("_").slice(0, 3).join("_") + "_";
    return prefix + "••••••••••••••••";
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case "read": return "bg-blue-100 text-blue-800";
      case "write": return "bg-green-100 text-green-800";
      case "delete": return "bg-red-100 text-red-800";
      case "admin": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
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
              Your new API key has been created. Copy it now - you won't be able to see it again!
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
                ⚠️ Store this key securely. You won't be able to view it again.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewlyCreatedKey(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for your application
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key with specific permissions for your application.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="label">Label (Optional)</Label>
                <Input
                  id="label"
                  placeholder="e.g., Production Key, Development Key"
                  value={newApiKey.label}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, label: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="permissions">Permissions</Label>
                <Select
                  value={newApiKey.permissions.join(",")}
                  onValueChange={(value) => setNewApiKey(prev => ({ ...prev, permissions: value.split(",") }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select permissions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read,write">Read & Write</SelectItem>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="read,write,delete">Read, Write & Delete</SelectItem>
                    <SelectItem value="read,write,delete,admin">Full Access (Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createApiKey} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading API keys...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700">Failed to load API keys</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchApiKeys}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys ({apiKeys.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className={`p-4 rounded-lg border ${
                    apiKey.revokedAt ? 'border-red-200 bg-red-50' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {apiKey.label || `API Key ${apiKey.id.slice(-8)}`}
                          {apiKey.revokedAt && (
                            <Badge variant="destructive" className="ml-2">
                              Revoked
                            </Badge>
                          )}
                        </h3>
                        <div className="flex gap-1">
                          {apiKey.permissions.map((permission) => (
                            <Badge
                              key={permission}
                              className={`text-xs ${getPermissionColor(permission)}`}
                            >
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p>
                          Last used: {formatDate(apiKey.lastUsedAt)}
                        </p>
                        <p>
                          Created: {formatDate(apiKey.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!apiKey.revokedAt && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setShowRegenerateDialog(apiKey.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => setShowRevokeDialog(apiKey.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {apiKeys.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="font-medium">No API keys created yet</p>
                  <p className="text-sm">Create your first API key to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regenerate Dialog */}
      <Dialog open={!!showRegenerateDialog} onOpenChange={() => setShowRegenerateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate API Key</DialogTitle>
            <DialogDescription>
              This will create a new API key and invalidate the old one. The old key will no longer work.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ Regenerating will immediately invalidate the current key. Make sure to update any applications using it.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegenerateDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => showRegenerateDialog && regenerateApiKey(showRegenerateDialog)}
              disabled={isRegenerating}
              variant="destructive"
            >
              {isRegenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Regenerate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={!!showRevokeDialog} onOpenChange={() => setShowRevokeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The API key will be permanently revoked and cannot be used again.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              🚨 This action is irreversible. Any applications using this key will immediately lose access.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => showRevokeDialog && revokeApiKey(showRevokeDialog)}
              disabled={isRevoking}
              variant="destructive"
            >
              {isRevoking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">SDK Example</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                {`import { CarcosaClient } from '@carcosa/sdk';

const client = new CarcosaClient({
  apiKey: 'your-api-key',
  projectId: '${appId}'
});`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">REST API Example</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                {`curl -X POST https://api.carcosa.dev/v1/projects/${appId}/uploads/init \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
