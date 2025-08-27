import { prisma } from "@carcosa/database";
import { decryptWithKey } from "../utils/crypto.js";
import Env from "../config/env.js";
import { R2Adapter, S3Adapter } from "@carcosa/storage";
import type { StorageAdapter } from "@carcosa/types";

export async function getAdapterForBucket(
  bucketId: string
): Promise<StorageAdapter> {
  const env = Env.parse(process.env);
  const bucket = await prisma.bucket.findFirstOrThrow({
    where: { id: bucketId },
  });

  const accessKeyId = await decryptWithKey(
    env.CREDENTIALS_ENCRYPTION_KEY,
    bucket.encryptedAccessKey
  );
  const secretAccessKey = await decryptWithKey(
    env.CREDENTIALS_ENCRYPTION_KEY,
    bucket.encryptedSecretKey
  );

  const baseOptions = {
    bucketName: bucket.bucketName,
    region: bucket.region ?? undefined,
    endpoint: bucket.endpoint ?? undefined,
    accessKeyId,
    secretAccessKey,
  };

  if (bucket.provider === "r2") return new R2Adapter(baseOptions);
  return new S3Adapter(baseOptions);
}

export async function getAdapterForProject(
  projectId: string
): Promise<StorageAdapter> {
  const env = Env.parse(process.env);

  // Get project with bucket
  const project = await prisma.project.findFirstOrThrow({
    where: { id: projectId },
    include: { bucket: true },
  });

  const accessKeyId = await decryptWithKey(
    env.CREDENTIALS_ENCRYPTION_KEY,
    project.bucket.encryptedAccessKey
  );
  const secretAccessKey = await decryptWithKey(
    env.CREDENTIALS_ENCRYPTION_KEY,
    project.bucket.encryptedSecretKey
  );

  const baseOptions = {
    bucketName: project.bucket.bucketName,
    region: project.bucket.region ?? undefined,
    endpoint: project.bucket.endpoint ?? undefined,
    accessKeyId,
    secretAccessKey,
  };

  if (project.bucket.provider === "r2") return new R2Adapter(baseOptions);
  return new S3Adapter(baseOptions);
}
