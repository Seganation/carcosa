import { PrismaClient } from "@prisma/client";
import { encryptWithKey } from "../src/crypto.js";

async function main() {
  const prisma = new PrismaClient();
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY ?? "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

  const project = await prisma.project.upsert({
    where: { slug: "demo" },
    update: {},
    create: { name: "Demo Project", slug: "demo", provider: "s3" },
  });

  await prisma.provider.upsert({
    where: { projectId: project.id },
    update: {},
    create: {
      projectId: project.id,
      type: "s3",
      bucketName: process.env.MINIO_BUCKET ?? "carcosa-demo",
      region: "us-east-1",
      endpoint: process.env.MINIO_ENDPOINT ?? "http://localhost:9000",
      encryptedAccessKey: await encryptWithKey(key, process.env.MINIO_ACCESS_KEY ?? "minioadmin"),
      encryptedSecretKey: await encryptWithKey(key, process.env.MINIO_SECRET_KEY ?? "minioadmin"),
    },
  });

  console.log("Seeded demo project:", project.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

