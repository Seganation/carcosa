import type { StorageAdapterOptions } from "@carcosa/types";
import { S3Adapter } from "./s3.js";

export class R2Adapter extends S3Adapter {
  constructor(options: StorageAdapterOptions) {
    super({ ...options, region: options.region ?? "auto" });
  }
}

