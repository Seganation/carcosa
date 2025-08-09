#!/usr/bin/env node
import { Command } from "commander";
import { CarcosaClient } from "@carcosa/sdk";
import fs from "node:fs";
import path from "node:path";

const program = new Command();

program
  .name("carcosa")
  .description("Carcosa CLI")
  .version("0.1.0");

program
  .command("init")
  .description("Create a .carcosa.json config")
  .option("--base-url <url>", "Base URL of Carcosa API", "http://localhost:4000")
  .option("--api-key <key>", "API key (optional)")
  .action((opts) => {
    const config = { baseUrl: opts.baseUrl, apiKey: opts.apiKey ?? null };
    fs.writeFileSync(path.resolve(process.cwd(), ".carcosa.json"), JSON.stringify(config, null, 2));
    console.log("Created .carcosa.json");
  });

program
  .command("upload <file>")
  .description("Upload a file via Carcosa signed URL")
  .requiredOption("--project <id>", "Project ID")
  .option("--tenant <id>", "Tenant ID")
  .option("--path <path>", "Target path inside bucket (defaults to filename)")
  .option("--content-type <type>", "Content-Type", "application/octet-stream")
  .action(async (file, opts) => {
    const cfgPath = path.resolve(process.cwd(), ".carcosa.json");
    const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, "utf8")) : { baseUrl: "http://localhost:4000" };
    const client = new CarcosaClient({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey ?? undefined });

    const filePath = path.resolve(process.cwd(), file);
    const fileName = opts.path ?? path.basename(filePath);

    const init = await client.initUpload({ projectId: opts.project, fileName, tenantId: opts.tenant, contentType: opts.contentType });

    const data = fs.readFileSync(filePath);
    const res = await fetch(init.uploadUrl.url, { method: init.uploadUrl.method, body: data, headers: { "content-type": opts.contentType } });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

    await client.completeUpload({ uploadId: init.uploadId });
    console.log("Uploaded to:", init.path);
  });

program
  .command("migrate")
  .description("Trigger a version migration")
  .requiredOption("--project <id>", "Project ID")
  .requiredOption("--from <v>", "From version")
  .requiredOption("--to <v>", "To version")
  .action(async (opts) => {
    const cfg = fs.existsSync(".carcosa.json") ? JSON.parse(fs.readFileSync(".carcosa.json", "utf8")) : { baseUrl: "http://localhost:4000" };
    const client = new CarcosaClient({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey ?? undefined });
    const res = await client.migrateVersion({ projectId: opts.project, fromVersion: opts.from, toVersion: opts.to });
    console.log(res.status);
  });

program
  .command("tokens")
  .description("Open dashboard token management")
  .action(() => {
    console.log("Open your dashboard and manage tokens under /settings/tokens");
  });

program.parseAsync();

