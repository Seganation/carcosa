import { describe, it, expect } from "vitest";
import { S3Adapter } from "../src/s3";

describe("S3Adapter", () => {
  it("creates a signed PUT url", async () => {
    const s3 = new S3Adapter({
      bucketName: "test",
      region: "us-east-1",
      endpoint: "http://localhost:9000",
      accessKeyId: "minioadmin",
      secretAccessKey: "minioadmin",
    });
    const signed = await s3.getSignedPutUrl("path/to/file.txt", { contentType: "text/plain" });
    expect(signed.url).toContain("http");
    expect(signed.method).toBe("PUT");
  });
});

