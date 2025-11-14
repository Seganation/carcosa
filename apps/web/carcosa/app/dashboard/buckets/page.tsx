"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateBucketDialog } from "@/components/dashboard/create-bucket-dialog";
import { BucketGrid } from "@/components/dashboard/bucket-grid";
import { bucketsAPI, type Bucket } from "@/lib/buckets-api";

export default function BucketsPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadBuckets = async () => {
    try {
      console.log("🔍 Loading buckets...");
      const response = await bucketsAPI.list();
      console.log("📦 Buckets response:", response);
      setBuckets(response.buckets);
    } catch (error) {
      console.error("❌ Failed to load buckets:", error);
      toast.error("Failed to load buckets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🚀 Buckets page mounted, loading buckets...");
    loadBuckets();
  }, []);

  const handleBucketCreated = () => {
    console.log("✅ Bucket created, reloading...");
    loadBuckets();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Storage Buckets</h2>
          <p className="text-muted-foreground">
            Connect your S3 or Cloudflare R2 buckets to use with your projects.
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Connect Bucket
        </Button>
      </div>

      <BucketGrid
        buckets={buckets}
        loading={loading}
        onUpdate={loadBuckets}
        onCreateClick={() => setCreateDialogOpen(true)}
      />

      <CreateBucketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleBucketCreated}
      />
    </div>
  );
}
