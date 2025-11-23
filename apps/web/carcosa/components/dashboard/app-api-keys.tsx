"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ListSkeleton } from "../ui/card-skeleton";
import { Key, Loader2, AlertCircle, Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "react-hot-toast";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { RegenerateApiKeyDialog } from "./regenerate-api-key-dialog";
import { RevokeApiKeyDialog } from "./revoke-api-key-dialog";
import { apiBase, withAuth } from "@/lib/api";

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

export function AppApiKeys({ appId }: AppApiKeysProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storedKeys, setStoredKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchApiKeys();
    loadStoredKeys();
  }, [appId]);

  const loadStoredKeys = () => {
    // Load all stored API keys for this project from localStorage
    const keys: Record<string, string> = {};

    // Check for default key (from project creation)
    const defaultKey = localStorage.getItem(
      `carcosa_project_${appId}_default_key`
    );
    if (defaultKey) {
      keys["default"] = defaultKey;
    }

    // Check for any other keys created manually
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`carcosa_project_${appId}_api_key_`)) {
        const keyId = key.replace(`carcosa_project_${appId}_api_key_`, "");
        const value = localStorage.getItem(key);
        if (value) {
          keys[keyId] = value;
        }
      }
    }

    console.log("Loaded stored keys:", keys);
    setStoredKeys(keys);
  };

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${apiBase()}/api/v1/projects/${appId}/api-keys`,
        {
          headers: withAuth(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch API keys: ${response.statusText}`);
      }

      const data = await response.json();
      setApiKeys(data.apiKeys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch API keys");
      toast.error("Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
            <p className="text-sm text-muted-foreground">
              Manage API keys for programmatic access to your project
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ListSkeleton count={3} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Manage API keys for programmatic access to your project
          </p>
        </div>
        <CreateApiKeyDialog
          projectId={appId}
          onSuccess={() => {
            fetchApiKeys();
            loadStoredKeys();
          }}
        />
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-destructive">
                Failed to load API keys
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchApiKeys}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!error && apiKeys.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <Key className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Create your first API key to enable programmatic access to your
              project. API keys allow you to integrate your application with
              external services.
            </p>
            <CreateApiKeyDialog projectId={appId} onSuccess={fetchApiKeys} />
          </CardContent>
        </Card>
      ) : (
        !error && (
          /* API Keys List */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys ({apiKeys.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className={`p-4 rounded-lg border transition-shadow ${
                      apiKey.revokedAt
                        ? "border-red-200 bg-red-50"
                        : "border-border hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {apiKey.label || `API Key ${apiKey.id.slice(-8)}`}
                          </h3>
                          {apiKey.revokedAt && (
                            <Badge variant="destructive">Revoked</Badge>
                          )}
                        </div>

                        {/* API Key Display */}
                        {(storedKeys[apiKey.id] || storedKeys["default"]) && (
                          <div className="flex gap-2 items-center">
                            <Input
                              value={
                                visibleKeys[apiKey.id]
                                  ? `CARCOSA_APP_SECRET=${storedKeys[apiKey.id] || storedKeys["default"]}`
                                  : `CARCOSA_APP_SECRET=crcsa_${"•".repeat(28)}${(storedKeys[apiKey.id] || storedKeys["default"]).slice(-4)}`
                              }
                              readOnly
                              className="font-mono text-xs bg-muted/50"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setVisibleKeys({
                                  ...visibleKeys,
                                  [apiKey.id]: !visibleKeys[apiKey.id],
                                });
                              }}
                            >
                              {visibleKeys[apiKey.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const key =
                                  storedKeys[apiKey.id] ||
                                  storedKeys["default"];
                                navigator.clipboard.writeText(
                                  `CARCOSA_APP_SECRET=${key}`
                                );
                                toast.success(
                                  "API key copied with env variable!"
                                );
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        <div className="flex gap-1 flex-wrap">
                          {apiKey.permissions.map((permission) => (
                            <Badge
                              key={permission}
                              className={`text-xs ${getPermissionColor(
                                permission
                              )}`}
                              variant="secondary"
                            >
                              {permission}
                            </Badge>
                          ))}
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Last used: {formatDate(apiKey.lastUsedAt)}</p>
                          <p>Created: {formatDate(apiKey.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {!apiKey.revokedAt && (
                          <>
                            <RegenerateApiKeyDialog
                              projectId={appId}
                              apiKey={apiKey}
                              onSuccess={fetchApiKeys}
                            />
                            <RevokeApiKeyDialog
                              projectId={appId}
                              apiKey={apiKey}
                              onSuccess={fetchApiKeys}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      )}

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
