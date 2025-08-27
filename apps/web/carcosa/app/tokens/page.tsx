"use client";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { KeySquare, Plus, Copy, Trash2, Eye, EyeOff } from "lucide-react";

type ApiKey = {
  id: string;
  label?: string | null;
  createdAt: string;
  revokedAt?: string | null;
};

export default function TokensPage() {
  const [projectId, setProjectId] = useState<string>(
    process.env.NEXT_PUBLIC_DEMO_PROJECT_ID || ""
  );
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Mock data for demo
  const mockKeys: ApiKey[] = [
    {
      id: "1",
      label: "Production API Key",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      label: "Development Key",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "3",
      label: null,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      revokedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  useEffect(() => {
    if (projectId) {
      setKeys(mockKeys);
    } else {
      setKeys([]);
    }
  }, [projectId]);

  const createKey = async () => {
    const label = prompt("API Key Label (optional)") || undefined;
    setLoading(true);

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockNewKey = `crcsa_${Math.random().toString(36).substr(2, 32)}`;
      const newApiKey: ApiKey = {
        id: Date.now().toString(),
        label: label || null,
        createdAt: new Date().toISOString(),
      };

      setNewKey(mockNewKey);
      setKeys((prev) => [newApiKey, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const revoke = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone."
      )
    ) {
      return;
    }

    setKeys((prev) =>
      prev.map((key) =>
        key.id === id ? { ...key, revokedAt: new Date().toISOString() } : key
      )
    );
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const maskKey = (key: string) => {
    return key.slice(0, 8) + "..." + key.slice(-4);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white">API Keys</h1>
        <p className="text-gray-400">Manage your project API keys and tokens</p>
      </div>

      {/* Project Selection */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Project ID
          </label>
          <Input
            placeholder="Enter project ID to manage API keys"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {projectId && (
        <>
          {/* New Key Alert */}
          {newKey && (
            <div className="bg-green-900/20 border border-green-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-2">
                API Key Created!
              </h3>
              <p className="text-gray-300 mb-4">
                Copy this key now. For security reasons, you won't be able to
                see it again.
              </p>
              <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                <code className="flex-1 text-sm text-white font-mono">
                  {newKey}
                </code>
                <Button
                  onClick={() => copyToClipboard(newKey)}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => setNewKey(null)}
                  variant="secondary"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  I've saved this key
                </Button>
              </div>
            </div>
          )}

          {/* API Keys */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <KeySquare className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-white">API Keys</h2>
              </div>
              <Button
                onClick={createKey}
                disabled={loading}
                className="bg-white text-black hover:bg-gray-100 font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? "Creating..." : "Create Key"}
              </Button>
            </div>

            {keys.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeySquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No API keys
                </h3>
                <p className="text-gray-400 mb-4">
                  Create your first API key to start using the Carcosa API.
                </p>
                <Button
                  onClick={createKey}
                  disabled={loading}
                  className="bg-white text-black hover:bg-gray-100 font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className={`border rounded-lg p-4 ${
                      key.revokedAt
                        ? "border-red-800 bg-red-900/10"
                        : "border-gray-800 hover:border-gray-700"
                    } transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-white">
                            {key.label || "Untitled API Key"}
                          </h3>
                          {key.revokedAt && (
                            <span className="text-xs bg-red-800 text-red-200 px-2 py-1 rounded">
                              Revoked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>
                            Created{" "}
                            {new Date(key.createdAt).toLocaleDateString()}
                          </span>
                          {key.revokedAt && (
                            <span>
                              Revoked{" "}
                              {new Date(key.revokedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                            {showKeys[key.id]
                              ? `crcsa_${Math.random().toString(36).substr(2, 32)}`
                              : `crcsa_${"•".repeat(24)}`}
                          </code>
                          <button
                            onClick={() =>
                              setShowKeys((prev) => ({
                                ...prev,
                                [key.id]: !prev[key.id],
                              }))
                            }
                            className="text-gray-400 hover:text-gray-300"
                          >
                            {showKeys[key.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {!key.revokedAt && (
                          <>
                            <Button
                              onClick={() =>
                                copyToClipboard(
                                  `crcsa_${Math.random().toString(36).substr(2, 32)}`
                                )
                              }
                              variant="secondary"
                              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => revoke(key.id)}
                              variant="secondary"
                              className="bg-gray-800 border-gray-700 text-red-400 hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
