"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@carcosa/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@carcosa/ui";
import { Input } from "@carcosa/ui";
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@carcosa/ui";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id as string;
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [project, setProject] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [toVersion, setToVersion] = useState("v2");

  useEffect(() => {
    (async () => {
      if (!projectId) return;
      const res = await fetch(`${api}/api/v1/projects/${projectId}`);
      if (res.ok) setProject(await res.json());
    })();
  }, [api, projectId]);

  const validateCreds = async () => {
    setValidating(true);
    setValidation(null);
    const res = await fetch(`${api}/api/v1/projects/${projectId}/validate-credentials`, { method: "POST" });
    const data = await res.json();
    setValidation(res.ok ? `OK via ${data.method}` : `Error: ${data.error}`);
    setValidating(false);
  };

  const switchVersion = async () => {
    const res = await fetch(`${api}/api/v1/projects/${projectId}/migrate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromVersion: "v1", toVersion }),
    });
    if (!res.ok) return alert("Failed switching version");
    setSwitchOpen(false);
    alert("Active version set to " + toVersion);
  };

  if (!project) return <div className="text-sm text-zinc-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Project: {project.name}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">Type: {project.provider?.toUpperCase?.() ?? project.provider}</div>
            <div className="mt-3 flex gap-2">
              <Button onClick={validateCreds} disabled={validating}>{validating ? "Validating…" : "Validate credentials"}</Button>
              {validation && <span className="self-center text-xs text-zinc-600">{validation}</span>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Versioning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">Switch active version</div>
            <div className="mt-3">
              <Button variant="secondary" onClick={() => setSwitchOpen(true)}>Switch Version</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <DialogHeader>
          <DialogTitle>Switch Active Version</DialogTitle>
          <DialogDescription>Enter target version e.g. v2</DialogDescription>
        </DialogHeader>
        <Input placeholder="v2" value={toVersion} onChange={(e) => setToVersion(e.target.value)} />
        <DialogFooter>
          <Button variant="secondary" onClick={() => setSwitchOpen(false)}>Cancel</Button>
          <Button onClick={switchVersion} disabled={!toVersion}>Switch</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}



