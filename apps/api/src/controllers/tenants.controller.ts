import type { Request, Response } from "express";
import { tenantsService } from "../services/tenants.service.js";
import { createTenantSchema, updateTenantSchema } from "../validations/tenants.validation.js";

// Use global Request interface

export async function list(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const projectId = req.params.id;
    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    const tenants = await tenantsService.listByProject(projectId, req.userId);
    return res.json({ tenants });
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    console.error("List tenants error:", error);
    return res.status(500).json({ error: "failed_to_list_tenants" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const projectId = req.params.id;
    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    const body = createTenantSchema.parse(req.body);
    const tenant = await tenantsService.create(body, projectId, req.userId);
    return res.status(201).json(tenant);
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    if (error instanceof Error && error.message === "tenant_slug_already_exists") {
      return res.status(400).json({ error: "tenant_slug_already_exists" });
    }
    console.error("Create tenant error:", error);
    return res.status(500).json({ error: "failed_to_create_tenant" });
  }
}

export async function update(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const projectId = req.params.id;
    const tenantId = req.params.tenantId;

    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    if (!tenantId) {
      return res.status(400).json({ error: "tenant_id_required" });
    }

    const body = updateTenantSchema.parse(req.body);
    const tenant = await tenantsService.update(tenantId, body, projectId, req.userId);
    return res.json(tenant);
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    if (error instanceof Error && error.message === "tenant_not_found") {
      return res.status(404).json({ error: "tenant_not_found" });
    }
    console.error("Update tenant error:", error);
    return res.status(500).json({ error: "failed_to_update_tenant" });
  }
}

export async function del(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const projectId = req.params.id;
    const tenantId = req.params.tenantId;

    if (!projectId) {
      return res.status(400).json({ error: "project_id_required" });
    }

    if (!tenantId) {
      return res.status(400).json({ error: "tenant_id_required" });
    }

    await tenantsService.delete(tenantId, projectId, req.userId);
    return res.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "project_not_found") {
      return res.status(404).json({ error: "project_not_found" });
    }
    if (error instanceof Error && error.message === "tenant_not_found") {
      return res.status(404).json({ error: "tenant_not_found" });
    }
    console.error("Delete tenant error:", error);
    return res.status(500).json({ error: "failed_to_delete_tenant" });
  }
}


