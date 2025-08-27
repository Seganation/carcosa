"use client";
import { useEffect, useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Upload,
  Zap,
  HardDrive,
  Settings,
} from "lucide-react";

type Usage = {
  day: string;
  uploads: number;
  transforms: number;
  bandwidthBytes: string;
};

export default function UsagePage() {
  const [projectId, setProjectId] = useState<string>(
    process.env.NEXT_PUBLIC_DEMO_PROJECT_ID || ""
  );
  const [usage, setUsage] = useState<Usage[]>([]);
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [uploadsPerMinute, setUPM] = useState<number>(120);
  const [transformsPerMinute, setTPM] = useState<number>(360);
  const [bandwidthPerMonthMiB, setBPM] = useState<number | "" | null>("");
  const [loading, setLoading] = useState(false);

  // Mock usage data for demo
  const mockUsage: Usage[] = [
    {
      day: new Date().toISOString(),
      uploads: 45,
      transforms: 120,
      bandwidthBytes: "2147483648",
    },
    {
      day: new Date(Date.now() - 86400000).toISOString(),
      uploads: 32,
      transforms: 89,
      bandwidthBytes: "1610612736",
    },
    {
      day: new Date(Date.now() - 172800000).toISOString(),
      uploads: 28,
      transforms: 74,
      bandwidthBytes: "1342177280",
    },
  ];

  useEffect(() => {
    if (projectId) {
      setUsage(mockUsage);
    } else {
      setUsage([]);
    }
  }, [projectId]);

  const formatBytes = (bytes: string) => {
    const size = Number(bytes) / (1024 * 1024);
    return size.toFixed(2);
  };

  const totalUploads = usage.reduce((sum, u) => sum + u.uploads, 0);
  const totalTransforms = usage.reduce((sum, u) => sum + u.transforms, 0);
  const totalBandwidth = usage.reduce(
    (sum, u) => sum + Number(u.bandwidthBytes),
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white">Usage & Analytics</h1>
        <p className="text-gray-400">
          Monitor your project usage and configure rate limits
        </p>
      </div>

      {/* Project Selection */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Project ID
          </label>
          <Input
            placeholder="Enter project ID to view usage"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {projectId && (
        <>
          {/* Usage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Upload className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Total Uploads</h3>
                  <p className="text-sm text-gray-400">Last 30 days</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                {totalUploads.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
                <TrendingUp className="h-3 w-3" />
                +12% from last month
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Transforms</h3>
                  <p className="text-sm text-gray-400">Last 30 days</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                {totalTransforms.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
                <TrendingUp className="h-3 w-3" />
                +8% from last month
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <HardDrive className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Bandwidth</h3>
                  <p className="text-sm text-gray-400">Last 30 days</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                {(totalBandwidth / (1024 * 1024 * 1024)).toFixed(1)} GB
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
                <TrendingUp className="h-3 w-3" />
                +15% from last month
              </div>
            </div>
          </div>

          {/* Daily Usage */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-white">Daily Usage</h2>
            </div>

            {usage.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No usage data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-400 border-b border-gray-800 pb-2">
                  <div>Date</div>
                  <div>Uploads</div>
                  <div>Transforms</div>
                  <div>Bandwidth (MB)</div>
                </div>
                {usage.map((u, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 gap-4 text-sm text-white py-2 border-b border-gray-800/50"
                  >
                    <div className="text-gray-300">
                      {new Date(u.day).toLocaleDateString()}
                    </div>
                    <div>{u.uploads.toLocaleString()}</div>
                    <div>{u.transforms.toLocaleString()}</div>
                    <div>{formatBytes(u.bandwidthBytes)} MB</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rate Limits */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-white">Rate Limits</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Uploads per minute
                </label>
                <Input
                  type="number"
                  value={uploadsPerMinute}
                  onChange={(e) => setUPM(Number(e.target.value || 0))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Transforms per minute
                </label>
                <Input
                  type="number"
                  value={transformsPerMinute}
                  onChange={(e) => setTPM(Number(e.target.value || 0))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Bandwidth per month (MB)
                </label>
                <Input
                  type="number"
                  value={bandwidthPerMonthMiB ?? ""}
                  onChange={(e) =>
                    setBPM(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Unlimited"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={async () => {
                  setLoading(true);
                  try {
                    // Mock save for demo
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    // Replace with actual API call:
                    // await fetch(`${api}/api/v1/projects/${projectId}/rate_limit`, {
                    //   method: "POST",
                    //   headers: { "content-type": "application/json" },
                    //   body: JSON.stringify({ uploadsPerMinute, transformsPerMinute, bandwidthPerMonthMiB: bandwidthPerMonthMiB === "" ? null : bandwidthPerMonthMiB })
                    // });
                    alert("Rate limits saved successfully!");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="bg-white text-black hover:bg-gray-100 font-medium"
              >
                {loading ? "Saving..." : "Save Rate Limits"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
