"use client";
import { useEffect, useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";

type Tenant = { id: string; slug: string };

export default function TenantsPage() {
  const [projectId, setProjectId] = useState<string>(process.env.NEXT_PUBLIC_DEMO_PROJECT_ID || "");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const load = async () => {
    if (!projectId) return setTenants([]);
    setLoading(true);
    try {
      const res = await fetch(`${api}/api/v1/projects/${projectId}/tenants`);
      const data = await res.json();
      setTenants(data.tenants ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const createTenant = async () => {
    if (!projectId || !slug) return;
    const res = await fetch(`${api}/api/v1/projects/${projectId}/tenants`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (!res.ok) return alert("failed");
    setSlug("");
    load();
  };

  const del = async (id: string) => {
    if (!projectId) return;
    const res = await fetch(`${api}/api/v1/projects/${projectId}/tenants/${id}`, { method: "DELETE" });
    if (!res.ok) return alert("failed");
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Tenants</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex gap-2">
            <Input placeholder="Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
          </div>
          <div className="mb-4 flex gap-2">
            <Input placeholder="tenant-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <Button onClick={createTenant} disabled={!slug || !projectId}>Create</Button>
          </div>
          {loading ? (
            <div className="text-sm text-zinc-500">Loading…</div>
          ) : tenants.length === 0 ? (
            <div className="text-sm text-zinc-500">No tenants</div>
          ) : (
            <ul className="divide-y">
              {tenants.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{t.slug}</span>
                  <Button variant="secondary" onClick={() => del(t.id)}>Delete</Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


