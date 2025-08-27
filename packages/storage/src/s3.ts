import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageAdapter, StorageAdapterOptions, SignedPutUrl } from "@carcosa/types";

export class S3Adapter implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor(options: StorageAdapterOptions) {
    this.bucketName = options.bucketName;
    this.client = new S3Client({
      region: options.region ?? "us-east-1",
      endpoint: options.endpoint,
      forcePathStyle: Boolean(options.endpoint),
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async getSignedPutUrl(path: string, options?: { contentType?: string; expiresInSeconds?: number; metadata?: Record<string, string> }): Promise<SignedPutUrl> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: path,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
    });
    const expiresIn = options?.expiresInSeconds ?? 900;
    const url = await getSignedUrl(this.client, command, { expiresIn });
    return { url, method: "PUT", headers: options?.contentType ? { "content-type": options.contentType } : undefined, expiresAt: Date.now() + expiresIn * 1000 };
  }

  async getSignedGetUrl(path: string, options?: { expiresInSeconds?: number }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: path,
    });
    const expiresIn = options?.expiresInSeconds ?? 900;
    const url = await getSignedUrl(this.client, command, { expiresIn });
    return url;
  }

  async putObject(path: string, body: any, metadata?: Record<string, string>, contentType?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucketName, Key: path, Body: body as any, Metadata: metadata, ContentType: contentType })
    );
  }

  async getObject(path: string): Promise<{ body: NodeJS.ReadableStream; contentType?: string; contentLength?: number; metadata?: Record<string, string> }> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucketName, Key: path }));
    return { body: res.Body as NodeJS.ReadableStream, contentType: res.ContentType, contentLength: Number(res.ContentLength ?? 0), metadata: res.Metadata };
  }

  async listObjects(prefix: string): Promise<{ keys: string[] }> {
    const res = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucketName, Prefix: prefix }));
    const keys = (res.Contents ?? []).map(o => o.Key!).filter(Boolean);
    return { keys };
  }

  async deleteObject(path: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: path }));
  }
}

