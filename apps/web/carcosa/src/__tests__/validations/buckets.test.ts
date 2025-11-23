import { describe, it, expect } from "vitest";
import { createBucketSchema } from "../../../lib/validations/buckets.validation";

describe("createBucketSchema", () => {
  it("accepts valid S3 bucket", () => {
    const result = createBucketSchema.safeParse({
      name: "My Bucket",
      provider: "s3",
      region: "us-east-1",
      bucketName: "my-bucket",
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid R2 bucket with endpoint", () => {
    const result = createBucketSchema.safeParse({
      name: "My R2 Bucket",
      provider: "r2",
      region: "auto",
      bucketName: "my-r2-bucket",
      endpoint: "https://account-id.r2.cloudflarestorage.com",
      accessKeyId: "access-key",
      secretAccessKey: "secret-key",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid provider", () => {
    const result = createBucketSchema.safeParse({
      name: "My Bucket",
      provider: "gcs",
      region: "us-east-1",
      bucketName: "my-bucket",
      accessKeyId: "key",
      secretAccessKey: "secret",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid endpoint URL", () => {
    const result = createBucketSchema.safeParse({
      name: "My Bucket",
      provider: "r2",
      region: "auto",
      bucketName: "my-bucket",
      endpoint: "not-a-url",
      accessKeyId: "key",
      secretAccessKey: "secret",
    });
    expect(result.success).toBe(false);
  });
});
