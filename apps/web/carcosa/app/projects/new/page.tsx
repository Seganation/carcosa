"use client";
import { useState } from "react";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, Cloud, Database } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [provider, setProvider] = useState<"s3" | "r2">("s3");
  const [bucketName, setBucket] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [endpoint, setEndpoint] = useState("");
  const [accessKeyId, setKey] = useState("");
  const [secretAccessKey, setSecret] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/v1/projects`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          provider,
          bucketName,
          region,
          endpoint: endpoint || undefined,
          accessKeyId,
          secretAccessKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create project");
        return;
      }
      setResult(
        `✅ Project created successfully! ID: ${data.project.id}\n\n🔑 Initial API Key (save this now):\n${data.apiKey}`
      );
    } catch (error) {
      alert("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Button asChild variant="ghost" className="justify-start p-0 h-auto">
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Project</h1>
          <p className="text-muted-foreground">
            Connect your S3 or R2 bucket to get started
          </p>
        </div>
      </div>

      {result ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
            Project Created!
          </h3>
          <pre className="text-sm text-foreground whitespace-pre-wrap">
            {result}
          </pre>
          <div className="mt-4 flex gap-3">
            <Button asChild>
              <Link href="/projects">View Projects</Link>
            </Button>
            <Button variant="secondary" onClick={() => setResult(null)}>
              Create Another
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-card-foreground">
              Project Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Project Name
                </label>
                <Input
                  placeholder="My awesome project"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Slug
                </label>
                <Input
                  placeholder="my-awesome-project"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-card-foreground">
              Storage Provider
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setProvider("s3")}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  provider === "s3"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Cloud className="h-8 w-8 text-orange-400" />
                  <span className="font-medium text-foreground">AWS S3</span>
                  <span className="text-xs text-muted-foreground">
                    Amazon Web Services
                  </span>
                </div>
              </button>
              <button
                onClick={() => setProvider("r2")}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  provider === "r2"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Database className="h-8 w-8 text-orange-400" />
                  <span className="font-medium text-foreground">
                    Cloudflare R2
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Edge storage
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Storage Configuration */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-card-foreground">
              Storage Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Bucket Name
                </label>
                <Input
                  placeholder="my-bucket"
                  value={bucketName}
                  onChange={(e) => setBucket(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Region
                </label>
                <Input
                  placeholder="us-east-1"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </div>
            </div>

            {provider === "r2" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Endpoint (Optional)
                </label>
                <Input
                  placeholder="https://your-account-id.r2.cloudflarestorage.com"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Credentials */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-card-foreground">
              Access Credentials
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Access Key ID
                </label>
                <Input
                  placeholder="AKIA..."
                  value={accessKeyId}
                  onChange={(e) => setKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Secret Access Key
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••••••••••"
                  value={secretAccessKey}
                  onChange={(e) => setSecret(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              onClick={submit}
              disabled={
                !name ||
                !slug ||
                !bucketName ||
                !accessKeyId ||
                !secretAccessKey ||
                loading
              }
              className="w-full"
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
